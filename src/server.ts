
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { db } from './firebase';
import { requireAuth, type AuthenticatedRequest } from './auth';
import { generateDiagnosis, type SurveyResponse } from './diagnosis';
import { randomSuffix, slugify } from './slug';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

    let slug = baseSlug;
    let attempts = 0;

    while (await findCompanyBySlug(slug)) {
      slug = `${baseSlug}-${randomSuffix()}`;
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
app.post('/api/survey', async (req, res) => {
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

// Buscar todas as respostas da empresa logada para o dashboard de BI
app.get('/api/admin/responses', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const responses = await getCompanyResponses(req.companyId as string);
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
    const responses = await getCompanyResponses(req.companyId as string);
    const diagnosis = generateDiagnosis(responses);
    res.status(200).json(diagnosis);
  } catch (error) {
    console.error('Erro ao gerar diagnóstico:', error);
    res.status(500).json({ error: 'Erro interno ao gerar o diagnóstico.' });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});
