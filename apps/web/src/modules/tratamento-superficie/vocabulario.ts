// tratamento-superficie — vocabulário do Plano de Serviço.
//
// Tudo aqui saiu dos formulários reais em uso (Plano de Serviço e Relatório de Inspeção).
// Nomes amplos de propósito: o módulo tem que servir a jateamento, pintura, galvanização ou
// metalização sem duplicar por cliente.
//
// Os dados de exemplo são ANONIMIZADOS — cliente e obra entram como identificadores neutros.

import { toleranciaAtiva, type Tolerancia } from '@/plataforma/empresa';

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

/** Como a conformidade de uma medição é julgada.
 *    faixa       — a especificação já é um intervalo ("50-70")
 *    tolerancia  — a especificação é um valor alvo ("100"), com a tolerância abaixo aplicada
 *    categorico  — texto comparado por grafia normalizada ("SA 2½", "X0Y0") */
export const TIPO_MEDIDA = ['faixa', 'tolerancia', 'categorico'] as const;
export type TipoMedida = (typeof TIPO_MEDIDA)[number];

/** A tolerância NÃO mora aqui: é número combinado com cada empresa, e vive no perfil dela
 *  (`plataforma/empresa.ts`). A Minasjato usa -10% / +40%; o próximo cliente usará o dele.
 *
 *  A assimetria é de propósito e vem da física: camada fina demais não protege, e por isso o
 *  limite de baixo é apertado; camada grossa protege, e só vira problema bem mais longe.
 *
 *  As funções abaixo aceitam a tolerância por parâmetro — o padrão é só a da empresa ativa. */
export type { Tolerancia } from '@/plataforma/empresa';

/** O intervalo realmente aceito, depois da tolerância. Para um alvo único, min e max são o mesmo
 *  número; para uma faixa, a tolerância abre cada ponta para o seu lado. */
export function faixaTolerada(min: number, max = min, tol: Tolerancia = toleranciaAtiva()): { min: number; max: number } {
  return {
    min: arredondar(min * (1 - tol.abaixo)),
    max: arredondar(max * (1 + tol.acima)),
  };
}

/** Quanto o medido se afasta do especificado, em porcentagem. Negativo = abaixo. */
export function desvioPercentual(especificado: number, encontrado: number): number | null {
  if (especificado === 0) return null;
  return arredondar(((encontrado - especificado) / especificado) * 100, 1);
}

function arredondar(n: number, casas = 4): number {
  const f = 10 ** casas;
  return Math.round(n * f) / f;
}

/** Uma etapa pode ser dividida por ESCOPO: a mesma demão aplicada a partes diferentes da obra
 *  (escadas e guarda-corpos, por exemplo) são registros independentes, com medições próprias. */
export type Escopo = string;

/** O que se mede em cada etapa. Cada uma é uma linha ESPECIFICADO | ENCONTRADO | DATA |
 *  RESPONSÁVEL PROCESSO | RESPONSÁVEL INSPEÇÃO — o átomo do formulário. */
export interface Grandeza {
  chave: string;
  rotulo: string;
  tipo: TipoMedida;
  unidade?: string;
  etapas: readonly Etapa[];
  /** Controle de processo que o esquema do cliente pode não pedir. Aparece como pendência,
   *  mas não segura a liberação da OS. */
  opcional?: boolean;
}

export const GRANDEZAS: Grandeza[] = [
  { chave: 'padrao_jateamento', rotulo: 'Padrão de jateamento', tipo: 'categorico', etapas: ['jateamento'] },
  { chave: 'grau_intemperismo', rotulo: 'Grau de intemperismo', tipo: 'categorico', etapas: ['jateamento'] },
  { chave: 'abrasivo', rotulo: 'Abrasivo', tipo: 'categorico', etapas: ['jateamento'] },
  { chave: 'padrao_rugosidade', rotulo: 'Padrão de rugosidade', tipo: 'faixa', unidade: 'µm', etapas: ['jateamento'] },
  { chave: 'camada_umida', rotulo: 'Camada úmida', tipo: 'tolerancia', unidade: 'µm', etapas: ['fundo', 'intermediario_i', 'intermediario_ii', 'acabamento'], opcional: true },
  { chave: 'camada_seca', rotulo: 'Camada seca', tipo: 'tolerancia', unidade: 'µm', etapas: ['fundo', 'intermediario_i', 'intermediario_ii', 'acabamento'] },
  { chave: 'visual', rotulo: 'Visual / aderência', tipo: 'categorico', etapas: ['fundo', 'intermediario_i', 'intermediario_ii', 'acabamento'] },
];

export const GRANDEZA_POR_CHAVE = new Map(GRANDEZAS.map((g) => [g.chave, g]));

export const OS_STATUS = ['rascunho', 'em_execucao', 'aguardando_inspecao', 'aprovada', 'reprovada', 'expedida', 'encerrada', 'cancelada'] as const;
export type OsStatus = (typeof OS_STATUS)[number];

export const RESULTADO = ['conforme', 'nao_conforme', 'pendente'] as const;
export type Resultado = (typeof RESULTADO)[number];

export const PINTURA = ['externa', 'interna', 'ambas'] as const;
export type Pintura = (typeof PINTURA)[number];
