
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { db } from './firebase';
import { requireAuth, type AuthenticatedRequest } from './auth';
import { generateDiagnosis, type SurveyResponse, type DiagnosisResult } from './diagnosis';
import { randomSuffix, slugify } from './slug';

const app = express();
const PORT = process.env.PORT || 3000;

// Necessário no Render (atrás de proxy) para o rate limiter identificar o IP real do cliente.
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

// Evita abuso/spam no envio de respostas da pesquisa: permite rajadas
// legítimas (ex: uma empresa inteira respondendo durante uma reunião,
// todos atrás do mesmo IP de escritório), mas bloqueia envios
// automatizados em massa.
const surveySubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas respostas enviadas deste local em pouco tempo. Tente novamente em alguns minutos.' }
});

// Rota de teste do servidor
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Servidor da Pesquisa Organizacional está a correr!'
  });
});

async function findCompanyBySlug(slug: string) {
  const snapshot = await db
    .collection('companies')
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as { id: string; name: string; slug: string };
}

// Criar o perfil da empresa (chamado logo após o cadastro no Firebase Auth)
app.post('/api/companies', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name } = req.body as { name?: string };

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'O nome da empresa é obrigatório.' });
      return;
    }

    const companyId = req.companyId as string;
    const baseSlug = slugify(name) || 'empresa';

    // Sempre inclui um sufixo aleatório no link da pesquisa, mesmo sem colisão de nomes:
    // caso contrário, qualquer pessoa que souber o nome da empresa adivinharia a URL
    // (ex: "minha-empresa") e poderia responder a pesquisa sem ter recebido o link.
    let slug = `${baseSlug}-${randomSuffix(6)}`;
    let attempts = 0;

    while (await findCompanyBySlug(slug)) {
      slug = `${baseSlug}-${randomSuffix(6)}`;
      attempts += 1;

      if (attempts > 5) {
        break;
      }
    }

    await db.collection('companies').doc(companyId).set({
      name: name.trim(),
      slug,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ companyId, name: name.trim(), slug });
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({ error: 'Erro interno ao criar a empresa.' });
  }
});

// Resolver o slug público para saber a qual empresa a pesquisa pertence
app.get('/api/companies/:slug', async (req, res) => {
  try {
    const company = await findCompanyBySlug(req.params.slug);

    if (!company) {
      res.status(404).json({ error: 'Pesquisa não encontrada para este link.' });
      return;
    }

    res.status(200).json({ companyId: company.id, name: company.name });
  } catch (error) {
    console.error('Erro ao buscar empresa pelo slug:', error);
    res.status(500).json({ error: 'Erro interno ao buscar a empresa.' });
  }
});

// Receber e gravar as respostas do questionário
app.post('/api/survey', surveySubmitLimiter, async (req, res) => {
  try {
    const { slug, ...formData } = req.body as { slug?: string } & Record<string, unknown>;

    if (!slug) {
      res.status(400).json({ error: 'Link de pesquisa inválido: faltando identificador da empresa.' });
      return;
    }

    const company = await findCompanyBySlug(slug);

    if (!company) {
      res.status(404).json({ error: 'Pesquisa não encontrada para este link.' });
      return;
    }

    const dataParaGravar = {
      ...formData,
      companyId: company.id,
      companySlug: slug,
      timestamp: new Date().toISOString()
    };

    const docRef = await db.collection('survey_responses').add(dataParaGravar);

    console.log('Nova resposta guardada com ID:', docRef.id);

    res.status(201).json({
      message: 'Dados guardados com sucesso',
      id: docRef.id
    });
  } catch (error) {
    console.error('Erro ao guardar no Firebase:', error);

    res.status(500).json({
      error: 'Erro interno do servidor ao guardar os dados'
    });
  }
});

async function getCompanyResponses(companyId: string): Promise<SurveyResponse[]> {
  const snapshot = await db
    .collection('survey_responses')
    .where('companyId', '==', companyId)
    .get();

  return snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data()
  })) as SurveyResponse[];
}

interface SurveyRound {
  id: string;
  label: string;
  startedAt: string;
}

// Rodadas ordenadas da mais antiga para a mais recente (facilita calcular os limites de cada período)
async function getCompanyRounds(companyId: string): Promise<SurveyRound[]> {
  const snapshot = await db
    .collection('companies')
    .doc(companyId)
    .collection('rounds')
    .orderBy('startedAt', 'asc')
    .get();

  return snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data()
  })) as SurveyRound[];
}

// Filtra as respostas de uma rodada específica pelo intervalo de tempo entre o início dela
// e o início da próxima (ou até agora, se for a rodada mais recente).
function filterResponsesByRound(
  responses: SurveyResponse[],
  rounds: SurveyRound[],
  roundId: string
): SurveyResponse[] {
  const index = rounds.findIndex((round) => round.id === roundId);

  if (index === -1) {
    return responses;
  }

  const start = rounds[index].startedAt;
  const end = rounds[index + 1]?.startedAt;

  return responses.filter((response) => {
    const timestamp = response.timestamp as string | undefined;
    if (!timestamp) return false;
    return timestamp >= start && (!end || timestamp < end);
  });
}

// Buscar todas as respostas da empresa logada para o dashboard de BI
app.get('/api/admin/responses', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const companyId = req.companyId as string;
    const roundId = req.query.roundId as string | undefined;

    let responses = await getCompanyResponses(companyId);

    if (roundId) {
      const rounds = await getCompanyRounds(companyId);
      responses = filterResponsesByRound(responses, rounds, roundId);
    }

    res.status(200).json(responses);
  } catch (error) {
    console.error('Erro ao buscar dados no Firebase:', error);

    res.status(500).json({
      error: 'Erro interno ao buscar os dados'
    });
  }
});

// Buscar o perfil (nome/slug) da empresa logada
app.get('/api/admin/company', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const doc = await db.collection('companies').doc(req.companyId as string).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Empresa não encontrada.' });
      return;
    }

    res.status(200).json({ companyId: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ error: 'Erro interno ao buscar a empresa.' });
  }
});

// Gerar o diagnóstico de clima e o plano de intervenção da empresa logada
app.get('/api/admin/diagnosis', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const companyId = req.companyId as string;
    const roundId = req.query.roundId as string | undefined;

    let responses = await getCompanyResponses(companyId);

    if (roundId) {
      const rounds = await getCompanyRounds(companyId);
      responses = filterResponsesByRound(responses, rounds, roundId);
    }

    const diagnosis = generateDiagnosis(responses);
    res.status(200).json(diagnosis);
  } catch (error) {
    console.error('Erro ao gerar diagnóstico:', error);
    res.status(500).json({ error: 'Erro interno ao gerar o diagnóstico.' });
  }
});

// Listar as rodadas de pesquisa da empresa logada (mais recente primeiro)
app.get('/api/admin/rounds', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const rounds = await getCompanyRounds(req.companyId as string);
    res.status(200).json(rounds.slice().reverse());
  } catch (error) {
    console.error('Erro ao buscar rodadas:', error);
    res.status(500).json({ error: 'Erro interno ao buscar as rodadas.' });
  }
});

// Iniciar uma nova rodada de pesquisa: tudo que for respondido a partir de agora
// passa a contar para essa rodada, até que uma próxima seja criada.
app.post('/api/admin/rounds', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { label } = req.body as { label?: string };
    const companyId = req.companyId as string;

    const roundsRef = db.collection('companies').doc(companyId).collection('rounds');
    const existing = await roundsRef.get();
    const roundNumber = existing.size + 1;
    const finalLabel = label?.trim() || `Rodada ${roundNumber}`;
    const startedAt = new Date().toISOString();

    const docRef = await roundsRef.add({ label: finalLabel, startedAt });

    res.status(201).json({ id: docRef.id, label: finalLabel, startedAt });
  } catch (error) {
    console.error('Erro ao criar rodada:', error);
    res.status(500).json({ error: 'Erro interno ao criar a rodada.' });
  }
});

// Evolução da média geral ao longo das rodadas, para o gráfico de tendência no dashboard.
app.get('/api/admin/rounds/trend', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const companyId = req.companyId as string;
    const [responses, rounds] = await Promise.all([
      getCompanyResponses(companyId),
      getCompanyRounds(companyId)
    ]);

    const points: Array<{
      id: string;
      label: string;
      startedAt: string | null;
      mediaGeral: number;
      totalRespostas: number;
    }> = [];

    if (rounds.length > 0) {
      const beforeFirstRound = responses.filter((response) => {
        const timestamp = response.timestamp as string | undefined;
        return !!timestamp && timestamp < rounds[0].startedAt;
      });

      if (beforeFirstRound.length > 0) {
        const diagnosis: DiagnosisResult = generateDiagnosis(beforeFirstRound);
        points.push({
          id: 'antes-das-rodadas',
          label: 'Antes das rodadas',
          startedAt: null,
          mediaGeral: diagnosis.mediaGeral,
          totalRespostas: diagnosis.totalRespostas
        });
      }
    }

    rounds.forEach((round) => {
      const filtered = filterResponsesByRound(responses, rounds, round.id);
      const diagnosis: DiagnosisResult = generateDiagnosis(filtered);
      points.push({
        id: round.id,
        label: round.label,
        startedAt: round.startedAt,
        mediaGeral: diagnosis.mediaGeral,
        totalRespostas: diagnosis.totalRespostas
      });
    });

    res.status(200).json(points);
  } catch (error) {
    console.error('Erro ao calcular a evolução das rodadas:', error);
    res.status(500).json({ error: 'Erro interno ao calcular a evolução das rodadas.' });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});
