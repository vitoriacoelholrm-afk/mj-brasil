// surface-treatment — vocabulário do Plano de Serviço.
//
// Tudo aqui saiu do formulário real (PLANO DE SERVIÇO, e a OS 748 preenchida do Consórcio
// Ápia-Real). Nomes amplos de propósito: o módulo tem que servir a jateamento, pintura,
// galvanização ou metalização sem duplicar por cliente.

/** As etapas do plano. Não são "1ª, 2ª, 3ª demão": são POSIÇÕES FIXAS no esquema de pintura. */
export const ETAPA = ['jateamento', 'fundo', 'intermediario_i', 'intermediario_ii', 'acabamento'] as const;
export type Etapa = (typeof ETAPA)[number];

export const ETAPA_ROTULO: Record<Etapa, string> = {
  jateamento: 'Jateamento',
  fundo: 'Aplicação de tinta — Fundo',
  intermediario_i: 'Aplicação de tinta — Intermediário I',
  intermediario_ii: 'Aplicação de tinta — Intermediário II',
  acabamento: 'Aplicação de tinta — Acabamento',
};

/** Como a conformidade de uma medição é julgada. */
export const TIPO_MEDIDA = ['faixa', 'minimo', 'categorico'] as const;
export type TipoMedida = (typeof TIPO_MEDIDA)[number];

/** O que se mede em cada etapa. Cada uma é uma linha ESPECIFICADO | ENCONTRADO | DATA |
 *  RESPONSÁVEL PROCESSO | RESPONSÁVEL INSPEÇÃO — o átomo do formulário. */
export interface Grandeza {
  chave: string;
  rotulo: string;
  tipo: TipoMedida;
  unidade?: string;
  etapas: readonly Etapa[];
}

export const GRANDEZAS: Grandeza[] = [
  { chave: 'padrao_jateamento', rotulo: 'Padrão de jateamento', tipo: 'categorico', etapas: ['jateamento'] },
  { chave: 'grau_intemperismo', rotulo: 'Grau de intemperismo', tipo: 'categorico', etapas: ['jateamento'] },
  { chave: 'abrasivo', rotulo: 'Abrasivo', tipo: 'categorico', etapas: ['jateamento'] },
  { chave: 'padrao_rugosidade', rotulo: 'Padrão de rugosidade', tipo: 'faixa', unidade: 'µm', etapas: ['jateamento'] },
  { chave: 'camada_umida', rotulo: 'Camada úmida', tipo: 'minimo', unidade: 'µm', etapas: ['fundo', 'intermediario_i', 'intermediario_ii', 'acabamento'] },
  { chave: 'camada_seca', rotulo: 'Camada seca', tipo: 'minimo', unidade: 'µm', etapas: ['fundo', 'intermediario_i', 'intermediario_ii', 'acabamento'] },
  { chave: 'visual', rotulo: 'Visual / aderência', tipo: 'categorico', etapas: ['fundo', 'intermediario_i', 'intermediario_ii', 'acabamento'] },
];

export const GRANDEZA_POR_CHAVE = new Map(GRANDEZAS.map((g) => [g.chave, g]));

export const OS_STATUS = ['rascunho', 'em_execucao', 'aguardando_inspecao', 'aprovada', 'reprovada', 'expedida', 'encerrada', 'cancelada'] as const;
export type OsStatus = (typeof OS_STATUS)[number];

export const RESULTADO = ['conforme', 'nao_conforme', 'pendente'] as const;
export type Resultado = (typeof RESULTADO)[number];

export const PINTURA = ['externa', 'interna', 'ambas'] as const;
export type Pintura = (typeof PINTURA)[number];
