// OS INDICADORES DA MINASJATO — transcritos da planilha "Indicadores MJ - 2025", emissão
// 01/08/2025, treze abas.
//
// Uma coisa que NÃO entrou de propósito: os valores de faturamento. A planilha usa o faturamento
// do mês como denominador dos dois indicadores de custo, e faturamento é dado comercial que o
// sistema da qualidade não precisa guardar para atender a 9.1.1 — o que a cláusula pede é o
// resultado do que se monitora, e o resultado é o percentual. O percentual entra; o valor
// absoluto fica na planilha dela.
//
// Outra: nenhum número foi corrigido na transcrição. Onde a planilha diz 104% de entregas no
// prazo, aqui diz 104%. Quem aponta o erro é o app, olhando os componentes — não eu, apagando.
import type { Apuracao, Indicador } from '@/plataforma/indicadores';

export const INDICADORES: Indicador[] = [
  {
    chave: 'satisfacao_cliente',
    nome: 'Índice de Satisfação do Cliente',
    unidade: 'proporcao', meta: 0.90, sentido: 'maior_melhor', teto: 1,
    numeradorRotulo: 'Total de pontos obtidos', denominadorRotulo: 'Total de pontos possíveis',
    nota: 'Alimenta-se da pesquisa de satisfação (FM-004).',
  },
  {
    chave: 'faturamento',
    nome: 'Faturamento sobre a meta mensal',
    unidade: 'percentual_variacao', meta: 0, sentido: 'maior_melhor',
    nota: 'Quanto o faturamento do mês ficou acima ou abaixo da meta mensal. Os valores em reais ficam na planilha comercial; aqui entra só a variação.',
  },
  {
    chave: 'devolucao',
    nome: 'Índice de Devolução de Clientes',
    unidade: 'proporcao', meta: 0.025, sentido: 'menor_melhor', teto: 1,
    numeradorRotulo: 'Quantidade devolvida', denominadorRotulo: 'Pedidos entregues',
  },
  {
    chave: 'custo_devolucao',
    nome: 'Custo de Devolução',
    unidade: 'proporcao', meta: 0.005, sentido: 'menor_melhor', teto: 1,
    nota: 'Custo das notas devolvidas sobre o faturamento do mês. Os dois valores são comerciais e ficam na planilha.',
  },
  {
    chave: 'eficiencia_entrega',
    nome: 'Eficiência de Entrega',
    unidade: 'proporcao', meta: 0.85, sentido: 'maior_melhor', teto: 1,
    numeradorRotulo: 'Entregas realizadas no prazo', denominadorRotulo: 'Total de entregas',
  },
  {
    chave: 'reclamacao_cliente',
    nome: 'Índice de Reclamação de Cliente',
    unidade: 'proporcao', meta: 0.03, sentido: 'menor_melhor', teto: 1,
    numeradorRotulo: 'Pedidos reclamados', denominadorRotulo: 'Pedidos entregues',
  },
  {
    chave: 'produto_nao_conforme',
    nome: 'Produto Não Conforme — geral',
    unidade: 'proporcao', meta: 0.15, sentido: 'menor_melhor', teto: 1,
    numeradorRotulo: 'Total de RNC', denominadorRotulo: 'Total de entregas',
    nota: 'Deveria contar toda não conformidade, inclusive a que a inspeção pega antes de sair — não só a que o cliente reclamou.',
  },
  {
    chave: 'custo_produto_nao_conforme',
    nome: 'Custo de Produto Não Conforme — geral',
    unidade: 'proporcao', meta: 0.002, sentido: 'menor_melhor', teto: 1,
    nota: 'Custo dos RNC sobre o faturamento do mês. Os dois valores são comerciais e ficam na planilha.',
  },
  {
    chave: 'qualidade_fornecedor',
    nome: 'Índice de Qualidade de Fornecedor (IQF)',
    unidade: 'proporcao', meta: 0.90, sentido: 'maior_melhor', teto: 1,
    numeradorRotulo: 'Fornecimentos conformes', denominadorRotulo: 'Total de fornecimentos',
    nota: 'Deveria sair da avaliação de fornecedores (FM-008).',
  },
  {
    chave: 'eficacia_treinamento',
    nome: 'Eficácia de Treinamento',
    unidade: 'proporcao', meta: 0.95, sentido: 'maior_melhor', teto: 1,
    numeradorRotulo: 'Treinamentos eficazes', denominadorRotulo: 'Total de treinados',
    nota: 'Alimenta-se do registro de treinamento (FM-009).',
  },
  {
    chave: 'eficacia_comunicacao',
    nome: 'Eficácia da Comunicação',
    unidade: 'proporcao', meta: 0.70, sentido: 'maior_melhor', teto: 1,
    numeradorRotulo: 'Respostas corretas', denominadorRotulo: 'Total de respostas',
  },
  {
    chave: 'eficacia_acoes',
    nome: 'Eficácia das Ações',
    unidade: 'proporcao', meta: 0.90, sentido: 'maior_melhor', teto: 1,
    numeradorRotulo: 'Ações eficazes', denominadorRotulo: 'Ações fechadas',
    nota: 'Fecha o ciclo da 10.2.2: ação corretiva que não resolveu não conta como eficaz.',
  },
  {
    chave: 'resposta_orcamento',
    nome: 'Índice de Resposta de Orçamento',
    unidade: 'proporcao', meta: 0.95, sentido: 'maior_melhor', teto: 1,
    numeradorRotulo: 'Orçamentos respondidos no prazo', denominadorRotulo: 'Total de orçamentos respondidos',
  },
];

/* ── O apurado de 2025 ─────────────────────────────────────────────────────────────────────────
   `naPlanilha` é o número que está lá, sempre. Quando há numerador e denominador, o app refaz a
   conta e compara — e é dessa comparação que saem os achados.                                   */

const M = (n: number) => `2025-${String(n).padStart(2, '0')}`;

/** Monta as apurações de um indicador a partir de listas mês a mês, começando em janeiro. */
function serie(
  indicador: string,
  naPlanilha: (number | null)[],
  componentes?: { numerador: (number | null)[]; denominador: (number | null)[] },
): Apuracao[] {
  return naPlanilha.flatMap((valor, i) => {
    const num = componentes?.numerador[i];
    const den = componentes?.denominador[i];
    if (valor === null && num == null) return [];
    return [{
      indicador, periodo: M(i + 1),
      ...(num != null ? { numerador: num } : {}),
      ...(den != null ? { denominador: den } : {}),
      ...(valor !== null ? { naPlanilha: valor } : {}),
    }];
  });
}

export const APURACOES: Apuracao[] = [
  ...serie('satisfacao_cliente', [0.85, 0.92, 0.91, 0.93, 0.87, 0.96, 0.91]),

  ...serie('faturamento',
    [0.0849147902691552, 0.2933614043291533, 0.1762645524848305,
      0.1394877153523646, 0.3001293777520093, -0.0875689204819020]),

  ...serie('devolucao', [0, 0, 0, 0, 0, 0, 0], {
    numerador: [0, 0, 0, 0, 0, 0, 0],
    denominador: [85, 74, 65, 60, 63, 25, 47],
  }),

  ...serie('custo_devolucao', [0, 0, 0, 0, 0, 0, 0]),

  ...serie('eficiencia_entrega',
    [0.9647058823529412, 0.9189189189189189, 0.9384615384615385, 1,
      0.9365079365079365, 1.04, 0.9361702127659575], {
      numerador: [82, 68, 61, 60, 59, 26, 44],
      denominador: [85, 74, 65, 60, 63, 25, 47],
    }),

  ...serie('reclamacao_cliente',
    [0.0117647058823529, 0, 0, 0, 0.0158730158730159, 0, 0.0212765957446809], {
      numerador: [1, 0, 0, 0, 1, 0, 1],
      denominador: [85, 74, 65, 60, 63, 25, 47],
    }),

  ...serie('produto_nao_conforme',
    [0.0117647058823529, 0, 0, 0, 0.0158730158730159, 0, 0.0212765957446809], {
      numerador: [1, 0, 0, 0, 1, 0, 1],
      denominador: [85, 74, 65, 60, 63, 25, 47],
    }),

  ...serie('custo_produto_nao_conforme', [0.002, 0, 0, 0, 0.002, 0, 0.002]),

  ...serie('qualidade_fornecedor', [1, 1, 1, 1, 1, 1]),

  ...serie('eficacia_treinamento', [1, 0.5, 2, 1, 1, 1, 1], {
    numerador: [1, 2, 2, 1, 1, 2, 1],
    denominador: [1, 1, 1, 1, 1, 2, 1],
  }),

  ...serie('eficacia_comunicacao', [0.7], { numerador: [31.5], denominador: [45] }),

  ...serie('eficacia_acoes', [0.9], { numerador: [22.5], denominador: [25] }),

  ...serie('resposta_orcamento', [0.9701492537313433], { numerador: [65], denominador: [67] }),
];
