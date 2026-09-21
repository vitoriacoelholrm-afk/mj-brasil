// O vocabulário fechado da cadeia. Um valor só por conceito — a mesma disciplina de Definitions
// do catálogo: quem quiser um estado novo muda aqui, não inventa string no meio do código.

/** Como cada cláusula é avaliada no diagnóstico. */
export const AVALIACAO = ['nao_atende', 'atende_parcial', 'atende', 'nao_aplicavel'] as const;
export type Avaliacao = (typeof AVALIACAO)[number];

/** Rótulos para tela e relatório. */
export const AVALIACAO_ROTULO: Record<Avaliacao, string> = {
  nao_atende: 'Não atende',
  atende_parcial: 'Atende parcialmente',
  atende: 'Atende',
  nao_aplicavel: 'Não aplicável',
};

/** Peso da cláusula no diagnóstico. Nem toda cláusula pesa igual para o certificado. */
export const PESO = ['normal', 'alto'] as const;
export type Peso = (typeof PESO)[number];

/** Severidade do gap — derivada da avaliação e do peso, nunca digitada na criação. */
export const SEVERIDADE = ['critica', 'alta', 'media', 'baixa'] as const;
export type Severidade = (typeof SEVERIDADE)[number];

/** Tipo de diagnóstico. O `inicial` é o que serve de ferramenta de venda. */
export const DIAGNOSTICO_TIPO = ['inicial', 'acompanhamento', 'pre_auditoria', 'recertificacao'] as const;
export type DiagnosticoTipo = (typeof DIAGNOSTICO_TIPO)[number];

export const DIAGNOSTICO_STATUS = ['rascunho', 'em_andamento', 'concluido', 'convertido', 'cancelado'] as const;
export type DiagnosticoStatus = (typeof DIAGNOSTICO_STATUS)[number];

export const GAP_STATUS = ['aberto', 'em_tratamento', 'pronto_para_verificacao', 'fechado', 'aceito_como_risco', 'cancelado'] as const;
export type GapStatus = (typeof GAP_STATUS)[number];

export const TAREFA_STATUS = ['pendente', 'em_andamento', 'concluida', 'cancelada'] as const;
export type TarefaStatus = (typeof TAREFA_STATUS)[number];

/** De que lado está o responsável. A consultoria não pode ser cobrada por atraso do cliente. */
export const LADO = ['consultoria', 'cliente'] as const;
export type Lado = (typeof LADO)[number];

/** O que a tarefa entrega. `documento` é o elo que fecha a cadeia até o SGQ. */
export const PRODUZ = ['documento', 'registro', 'evidencia', 'nenhum'] as const;
export type Produz = (typeof PRODUZ)[number];
