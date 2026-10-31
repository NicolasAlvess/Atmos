
export interface SurveyResponse {
  id: string;
  setor?: string;
  [key: string]: unknown;
}

type Classification = 'critico' | 'alerta' | 'forte' | 'sem_dados';

interface DimensionDefinition {
  key: string;
  nome: string;
  teoria: string;
}

const DIMENSIONS: DimensionDefinition[] = [
  {
    key: 'q1_pertencimento',
    nome: 'Pertencimento',
    teoria: 'Hierarquia de Necessidades de Maslow (necessidades sociais)'
  },
  {
    key: 'q2_valorizacao',
    nome: 'Valorização',
    teoria: 'Teoria dos Dois Fatores de Herzberg (fatores motivacionais)'
  },
  {
    key: 'q3_seguranca',
    nome: 'Segurança Psicológica',
    teoria: 'Teoria da Expectativa de Vroom (relação esforço-resultado)'
  },
  {
    key: 'q4_respeito',
    nome: 'Respeito e Diversidade',
    teoria: 'Hierarquia de Necessidades de Maslow (pertencimento e estima)'
  },
  {
    key: 'q5_equidade',
    nome: 'Equidade',
    teoria: 'Teoria do Design do Trabalho de Hackman & Oldham (justiça e crescimento)'
  },
  {
    key: 'q6_capacitacao',
    nome: 'Capacitação',
    teoria: 'Teoria do Design do Trabalho de Hackman & Oldham (desenvolvimento)'
  },
  {
    key: 'q7_comunicacao',
    nome: 'Comunicação',
    teoria: 'Teoria dos Dois Fatores de Herzberg (fatores higiênicos)'
  },
  {
    key: 'q8_lideranca',
    nome: 'Liderança',
    teoria: 'Teoria da Expectativa de Vroom (instrumentalidade da liderança)'
  }
];

interface ActionItem {
  prazo: 'Curto prazo' | 'Médio prazo' | 'Longo prazo';
  acao: string;
}

interface TextEntry {
  diagnostico: string;
  acoes: ActionItem[];
}

const DIAGNOSIS_TEXTS: Record<string, Record<'critico' | 'alerta' | 'forte', TextEntry>> = {
  q1_pertencimento: {
    critico: {
      diagnostico:
        'A baixa percepção de pertencimento indica que a necessidade social básica (Maslow) não está sendo satisfeita, o que tende a reduzir engajamento e aumentar a rotatividade.',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Criar rodas de escuta/feedback anônimas para entender as causas do não pertencimento.' },
        { prazo: 'Médio prazo', acao: 'Implementar rituais de integração e reconhecimento entre equipes.' },
        { prazo: 'Longo prazo', acao: 'Revisar a cultura organizacional e os critérios de contratação/onboarding.' }
      ]
    },
    alerta: {
      diagnostico:
        'A percepção de pertencimento está em zona de atenção; parte dos colaboradores ainda não se sente plenamente parte do grupo (Maslow).',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Fortalecer momentos de conexão entre equipes (eventos, confraternizações internas).' },
        { prazo: 'Médio prazo', acao: 'Criar programas de mentoria e grupos de afinidade.' }
      ]
    },
    forte: {
      diagnostico: 'O pertencimento é um ponto forte: os colaboradores sentem-se parte do grupo, satisfazendo a necessidade social de Maslow.',
      acoes: []
    }
  },
  q2_valorizacao: {
    critico: {
      diagnostico:
        'A baixa valorização percebida é um fator motivacional ausente (Herzberg): sem reconhecimento, a motivação intrínseca tende a cair mesmo com bons fatores higiênicos.',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Implementar reconhecimento público de conquistas em reuniões/canais internos.' },
        { prazo: 'Médio prazo', acao: 'Criar programa estruturado de feedback e reconhecimento (ex: peer recognition).' },
        { prazo: 'Longo prazo', acao: 'Revisar política de promoções e remuneração por mérito.' }
      ]
    },
    alerta: {
      diagnostico: 'A valorização está em zona de atenção; o fator motivacional de reconhecimento (Herzberg) precisa ser reforçado.',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Treinar lideranças para dar feedback positivo com mais frequência.' },
        { prazo: 'Médio prazo', acao: 'Criar canais formais para sugestões e ideias serem reconhecidas.' }
      ]
    },
    forte: {
      diagnostico: 'A valorização é um ponto forte: o fator motivacional de reconhecimento (Herzberg) está bem atendido.',
      acoes: []
    }
  },
  q3_seguranca: {
    critico: {
      diagnostico:
        'A baixa segurança psicológica quebra a relação esforço-resultado da Teoria da Expectativa de Vroom: colaboradores evitam expor erros ou sugerir melhorias por medo de retaliação.',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Comunicar e reforçar uma política clara de não retaliação a erros reportados.' },
        { prazo: 'Médio prazo', acao: 'Treinar lideranças em escuta ativa e gestão de erros como aprendizado.' },
        { prazo: 'Longo prazo', acao: 'Instituir comitês de ética/ouvidoria independentes da hierarquia direta.' }
      ]
    },
    alerta: {
      diagnostico: 'A segurança psicológica está em zona de atenção; parte da equipe ainda hesita em expor problemas (Vroom: expectativa de retaliação).',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Criar canais de feedback anônimo para erros e sugestões.' },
        { prazo: 'Médio prazo', acao: 'Promover rodas de retrospectiva sem culpabilização individual.' }
      ]
    },
    forte: {
      diagnostico: 'A segurança psicológica é um ponto forte: a equipe confia que expor problemas gera melhoria, não punição (Vroom).',
      acoes: []
    }
  },
  q4_respeito: {
    critico: {
      diagnostico:
        'A baixa percepção de respeito e diversidade indica falhas na necessidade de estima e aceitação social (Maslow), com risco de conflitos interpessoais e exclusão.',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Investigar via canal confidencial relatos específicos de desrespeito ou exclusão.' },
        { prazo: 'Médio prazo', acao: 'Implementar treinamentos obrigatórios de diversidade, equidade e inclusão.' },
        { prazo: 'Longo prazo', acao: 'Revisar políticas de convivência e código de conduta com consequências claras.' }
      ]
    },
    alerta: {
      diagnostico: 'O respeito entre colegas está em zona de atenção; ainda há espaço para fortalecer a convivência entre perfis diferentes (Maslow).',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Promover campanhas internas de sensibilização sobre diversidade.' },
        { prazo: 'Médio prazo', acao: 'Criar grupos de afinidade e espaços de diálogo entre equipes.' }
      ]
    },
    forte: {
      diagnostico: 'O respeito e a diversidade são um ponto forte: há convivência saudável entre perfis diferentes (Maslow).',
      acoes: []
    }
  },
  q5_equidade: {
    critico: {
      diagnostico:
        'A baixa percepção de equidade fere o princípio de justiça do modelo de Hackman & Oldham: oportunidades percebidas como injustas reduzem o engajamento com o trabalho.',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Auditar critérios de promoção recentes e comunicar os critérios de forma transparente.' },
        { prazo: 'Médio prazo', acao: 'Criar trilhas de carreira claras e públicas para todos os cargos.' },
        { prazo: 'Longo prazo', acao: 'Implementar comitê de meritocracia com participação de RH e lideranças múltiplas.' }
      ]
    },
    alerta: {
      diagnostico: 'A equidade está em zona de atenção; os critérios de crescimento (Hackman & Oldham) precisam ficar mais claros para a equipe.',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Divulgar com clareza os critérios de promoção e avaliação de desempenho.' },
        { prazo: 'Médio prazo', acao: 'Revisar periodicamente a distribuição de oportunidades por perfil/setor.' }
      ]
    },
    forte: {
      diagnostico: 'A equidade é um ponto forte: os colaboradores percebem justiça nas oportunidades de crescimento (Hackman & Oldham).',
      acoes: []
    }
  },
  q6_capacitacao: {
    critico: {
      diagnostico:
        'O baixo acesso à capacitação limita a dimensão de "oportunidade de crescimento" do modelo de Hackman & Oldham, afetando a motivação pelo desenvolvimento.',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Mapear lacunas de treinamento por setor e priorizar as mais urgentes.' },
        { prazo: 'Médio prazo', acao: 'Criar plano de capacitação contínua acessível a todos os perfis.' },
        { prazo: 'Longo prazo', acao: 'Estabelecer parcerias com instituições de ensino para formação continuada.' }
      ]
    },
    alerta: {
      diagnostico: 'O acesso à capacitação está em zona de atenção; a oportunidade de crescimento (Hackman & Oldham) pode ser mais homogênea entre os colaboradores.',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Ampliar a comunicação sobre treinamentos já disponíveis.' },
        { prazo: 'Médio prazo', acao: 'Garantir cota mínima de horas de capacitação por colaborador/ano.' }
      ]
    },
    forte: {
      diagnostico: 'A capacitação é um ponto forte: os colaboradores têm acesso equilibrado ao desenvolvimento (Hackman & Oldham).',
      acoes: []
    }
  },
  q7_comunicacao: {
    critico: {
      diagnostico:
        'Falhas na comunicação institucional são um fator higiênico deficiente (Herzberg): mesmo sem gerar motivação por si só, sua ausência gera forte insatisfação.',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Revisar a linguagem das comunicações oficiais para garantir inclusão e clareza.' },
        { prazo: 'Médio prazo', acao: 'Criar canais de comunicação interna bidirecionais (não só de cima para baixo).' },
        { prazo: 'Longo prazo', acao: 'Treinar times de comunicação/RH em linguagem inclusiva e acessível.' }
      ]
    },
    alerta: {
      diagnostico: 'A comunicação institucional está em zona de atenção; esse fator higiênico (Herzberg) pode gerar insatisfação se não for ajustado.',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Padronizar um guia de linguagem inclusiva para comunicados internos.' },
        { prazo: 'Médio prazo', acao: 'Criar pesquisa de pulso periódica sobre clareza da comunicação.' }
      ]
    },
    forte: {
      diagnostico: 'A comunicação institucional é um ponto forte: o fator higiênico (Herzberg) está bem atendido, evitando insatisfação.',
      acoes: []
    }
  },
  q8_lideranca: {
    critico: {
      diagnostico:
        'A liderança direta pouco inclusiva quebra a instrumentalidade da Teoria da Expectativa de Vroom: os colaboradores não enxergam ligação clara entre esforço, reconhecimento e tratamento justo.',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Aplicar avaliação 360° nas lideranças diretas para identificar pontos de melhoria.' },
        { prazo: 'Médio prazo', acao: 'Treinar lideranças em gestão inclusiva e comunicação não-violenta.' },
        { prazo: 'Longo prazo', acao: 'Incluir indicadores de liderança inclusiva nas metas e avaliações de gestores.' }
      ]
    },
    alerta: {
      diagnostico: 'A liderança está em zona de atenção; a relação esforço-reconhecimento (Vroom) pode não estar clara para todos os times.',
      acoes: [
        { prazo: 'Curto prazo', acao: 'Capacitar lideranças em feedback estruturado e escuta ativa.' },
        { prazo: 'Médio prazo', acao: 'Criar pesquisa de clima específica por liderança/equipe.' }
      ]
    },
    forte: {
      diagnostico: 'A liderança é um ponto forte: os colaboradores percebem clareza entre esforço, reconhecimento e tratamento justo (Vroom).',
      acoes: []
    }
  }
};

function classifyScore(nota: number): Classification {
  if (!Number.isFinite(nota) || nota <= 0) {
    return 'sem_dados';
  }

  if (nota >= 4.0) {
    return 'forte';
  }

  if (nota >= 3.0) {
    return 'alerta';
  }

  return 'critico';
}

export function calcAverage(responses: SurveyResponse[], key: string): number {
  const validValues = responses
    .map((item) => Number(item[key]))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);

  if (validValues.length === 0) {
    return 0;
  }

  const sum = validValues.reduce((acc, value) => acc + value, 0);

  return Number((sum / validValues.length).toFixed(1));
}

export interface DimensionDiagnosis {
  key: string;
  nome: string;
  nota: number;
  classificacao: Classification;
  teoria: string;
  diagnostico: string;
}

export interface InterventionAction extends ActionItem {
  dimensao: string;
  teoria: string;
}

export interface DiagnosisResult {
  totalRespostas: number;
  mediaGeral: number;
  pontoForte: { dimensao: string; nota: number } | null;
  pontoCritico: { dimensao: string; nota: number } | null;
  resumoExecutivo: string;
  dimensoes: DimensionDiagnosis[];
  planoIntervencao: InterventionAction[];
}

export function generateDiagnosis(responses: SurveyResponse[]): DiagnosisResult {
  const dimensoes: DimensionDiagnosis[] = DIMENSIONS.map((dimension) => {
    const nota = calcAverage(responses, dimension.key);
    const classificacao = classifyScore(nota);

    const textEntry =
      classificacao === 'sem_dados'
        ? null
        : DIAGNOSIS_TEXTS[dimension.key][classificacao];

    return {
      key: dimension.key,
      nome: dimension.nome,
      nota,
      classificacao,
      teoria: dimension.teoria,
      diagnostico:
        textEntry?.diagnostico ??
        'Ainda não há respostas suficientes para avaliar esta dimensão.'
    };
  });

  const avaliadas = dimensoes.filter((d) => d.classificacao !== 'sem_dados');

  const mediaGeral =
    avaliadas.length > 0
      ? Number(
          (
            avaliadas.reduce((acc, d) => acc + d.nota, 0) / avaliadas.length
          ).toFixed(1)
        )
      : 0;

  const ordenadasPorNota = [...avaliadas].sort((a, b) => b.nota - a.nota);

  const pontoForte = ordenadasPorNota[0]
    ? { dimensao: ordenadasPorNota[0].nome, nota: ordenadasPorNota[0].nota }
    : null;

  const pontoCritico = ordenadasPorNota[ordenadasPorNota.length - 1]
    ? {
        dimensao: ordenadasPorNota[ordenadasPorNota.length - 1].nome,
        nota: ordenadasPorNota[ordenadasPorNota.length - 1].nota
      }
    : null;

  const resumoExecutivo =
    avaliadas.length === 0
      ? 'Ainda não há respostas suficientes para gerar um diagnóstico.'
      : `Com base em ${responses.length} resposta(s), a média geral de favorabilidade é ${mediaGeral} (escala de 1 a 5). ` +
        `O ponto forte é "${pontoForte?.dimensao}" (${pontoForte?.nota}) e o principal gargalo é "${pontoCritico?.dimensao}" (${pontoCritico?.nota}), que deve ser priorizado no plano de intervenção.`;

  const planoIntervencao: InterventionAction[] = dimensoes
    .filter((d) => d.classificacao === 'critico' || d.classificacao === 'alerta')
    .sort((a, b) => a.nota - b.nota)
    .flatMap((dimension) => {
      const textEntry = DIAGNOSIS_TEXTS[dimension.key][
        dimension.classificacao as 'critico' | 'alerta'
      ];

      return textEntry.acoes.map((acao) => ({
        ...acao,
        dimensao: dimension.nome,
        teoria: dimension.teoria
      }));
    });

  return {
    totalRespostas: responses.length,
    mediaGeral,
    pontoForte,
    pontoCritico,
    resumoExecutivo,
    dimensoes,
    planoIntervencao
  };
}
