// A LISTA MESTRA é a autoridade sobre código de documento. Nenhuma tela inventa o seu código:
// toda tela pede o dela aqui, por `doc('FM-001')`. Trocar um código é trocar uma linha deste
// arquivo, e todas as telas que o carimbam mudam junto.
//
// Se uma tela pedir um código que não está catalogado, `doc` estoura. É de propósito: é o que
// impede o app de emitir um documento com código que o auditor não encontra na Lista Mestra.
//
// Importado da planilha LM-SGQ-001 rev. 3, emitida 03/06/2025: os 47 documentos, com tipo,
// categoria, responsável, cláusula da ISO 9001:2015 e nível de acesso. Junto vêm os documentos
// que circulam SEM entrada na lista — que são o problema a resolver.

export type SituacaoDoc = 'vigente' | 'obsoleto' | 'em_revisao';
export type Acesso = 'irrestrito' | 'restrito' | 'confidencial';
export type Natureza = 'manual' | 'procedimento' | 'instrucao' | 'formulario' | 'registro';

export const NATUREZA_ROTULO: Record<Natureza, string> = {
  manual: 'Manual',
  procedimento: 'Procedimento',
  instrucao: 'Instrução de trabalho',
  formulario: 'Formulário',
  registro: 'Registro',
};

/** O que cada prefixo significa — está na aba Legenda da planilha. */
export const PREFIXO_ROTULO: Record<string, string> = {
  MQ: 'Manual da Qualidade',
  PG: 'Procedimento Gerencial',
  PC: 'Procedimento Comercial',
  PO: 'Procedimento Operacional',
  PQ: 'Procedimento de Qualidade',
  PF: 'Procedimento de Fornecedores / Compras',
  PRH: 'Procedimento de Recursos Humanos',
  PSSMA: 'Procedimento de SSMA',
  IT: 'Instrução de Trabalho',
  FM: 'Formulário / Modelo de Registro',
};

export interface DocumentoMestre {
  /** O código da Lista Mestra. É o oficial — o que o app carimba. */
  codigo: string;
  titulo: string;
  natureza: Natureza;
  categoria: string;
  revisao: string | null;
  emissao: string | null;
  proximaRevisao: string | null;
  situacao: SituacaoDoc;
  acesso: Acesso;
  responsavel: string | null;
  /** Cláusulas da ISO 9001:2015 que este documento atende. */
  clausulas: string[];
  local: string | null;
  /** Códigos que o arquivo real carrega, quando não são o da Lista Mestra. */
  codigosParalelos?: string[];
  /** Revisão que o arquivo real declara, quando não bate com a da lista. */
  revisaoNoArquivo?: { revisao: string; data: string };
  /** A tela do app que emite ou consome este documento. */
  tela?: string;
  /** Verdadeiro quando o documento circula sem entrada própria na Lista Mestra. */
  foraDaLista?: boolean;
  nota?: string;
}

/** Sem código de verdade: o lugar de código fica vazio, não com um rótulo inventado. */
export const SEM_CODIGO = 'SEM-CODIGO';

const codigoReal = (d: DocumentoMestre) => (d.codigo.startsWith(SEM_CODIGO) ? null : d.codigo);
const br = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

/** Cabeçalho da própria Lista Mestra, como está na planilha. */
export const LISTA_MESTRA_META = {
  codigo: 'LM-SGQ-001',
  revisao: '3',
  emissao: '2025-06-03',
  proximaRevisao: '2026-07-04',
  totalCatalogado: 47,
  norma: 'ISO 9001:2015',
  /** A planilha traz os campos, mas em branco. ISO 7.5.2 pede aprovação registrada. */
  aprovadoPor: null as string | null,
  elaboradoPor: null as string | null,
  codigosParalelos: ['MJ-REG-LMD-01', 'MJ-REC-01'],
  nota: 'O arquivo se identifica como LM-SGQ-001; o MJ-CDT-01 §11 manda mantê-la sob MJ-REG-LMD-01; e a planilha "Controle de Documentos" traz a aba sob MJ-REC-01 — que já é o código do formulário de Recebimento.',
};

/* ── Os 47 catalogados ──────────────────────────────────────────────────────────────────────
   Todos rev. 00 (menos o manual, rev. 01), emitidos em 03/06/2025, com revisão prevista para
   04/07/2026 — que é a data vencida. Os campos vieram da planilha coluna a coluna.           */

const EMISSAO = '2025-06-03';
const PROXIMA = '2026-07-04';

type Extra = Partial<Pick<DocumentoMestre,
  'revisao' | 'codigosParalelos' | 'revisaoNoArquivo' | 'tela' | 'nota' | 'local'>>;

function catalogado(
  codigo: string, titulo: string, natureza: Natureza, categoria: string,
  responsavel: string, clausulas: string[], acesso: Acesso, extra: Extra = {},
): DocumentoMestre {
  const fisico = natureza === 'instrucao';
  return {
    codigo, titulo, natureza, categoria, responsavel, clausulas, acesso,
    revisao: '00', emissao: EMISSAO, proximaRevisao: PROXIMA, situacao: 'vigente',
    local: fisico ? 'Produção (físico)' : 'Servidor / Pasta SGQ',
    ...extra,
  };
}

const CATALOGADOS: DocumentoMestre[] = [
  catalogado('MQ-001', 'Manual da Qualidade', 'manual', 'Gestão da Qualidade', 'Dir. Geral',
    ['4', '5', '6', '7', '8', '9', '10'], 'irrestrito', {
    revisao: '01',
    revisaoNoArquivo: { revisao: '00', data: '2026-03-05' },
    nota: 'A lista traz rev. 01 de 03/06/2025; o arquivo em uso declara rev. 00 de 05/03/2026. O arquivo é mais novo e a revisão é mais antiga — um dos dois está errado.',
  }),

  catalogado('PG-001', 'Controle de Documentos e Registros', 'procedimento', 'Gestão da Qualidade', 'RQ', ['7.5'], 'irrestrito', { codigosParalelos: ['MJ-CDT-01'], tela: 'lista-mestra' }),
  catalogado('PG-002', 'Análise Crítica pela Direção', 'procedimento', 'Gestão da Qualidade', 'Dir. Geral', ['9.3'], 'irrestrito'),
  catalogado('PG-003', 'Gestão de Riscos e Oportunidades', 'procedimento', 'Gestão da Qualidade', 'RQ', ['6.1'], 'irrestrito'),
  catalogado('PG-004', 'Auditoria Interna', 'procedimento', 'Gestão da Qualidade', 'RQ', ['9.2'], 'irrestrito'),
  catalogado('PG-005', 'Não Conformidade e Ação Corretiva', 'procedimento', 'Gestão da Qualidade', 'RQ', ['10.2'], 'irrestrito', { codigosParalelos: ['MJ-NC-01'] }),
  catalogado('PG-006', 'Objetivos e Indicadores da Qualidade', 'procedimento', 'Gestão da Qualidade', 'RQ', ['6.2', '9.1'], 'irrestrito'),

  catalogado('PC-001', 'Análise Crítica de Pedidos e Contratos', 'procedimento', 'Comercial', 'Ger. Comercial', ['8.2'], 'restrito'),
  catalogado('PC-002', 'Elaboração de Orçamentos', 'procedimento', 'Comercial', 'Ger. Orçamentos', ['8.2'], 'restrito', {
    nota: 'É daqui que sai a especificação que a OS carrega — o que o cliente pediu na hora do orçamento.',
  }),
  catalogado('PC-003', 'Comunicação com o Cliente', 'procedimento', 'Comercial', 'Ger. Comercial', ['8.2.1'], 'irrestrito'),

  catalogado('PO-001', 'Recebimento e Inspeção de Entrada de Peças', 'procedimento', 'Operações', 'Ger. Operações', ['8.4', '8.6'], 'irrestrito'),
  catalogado('PO-002', 'Identificação e Rastreabilidade de Peças', 'procedimento', 'Operações', 'Ger. Operações', ['8.5.2'], 'irrestrito', {
    codigosParalelos: ['MJ-RAI-01'],
    nota: 'O §8 manda registrar o lote da tinta na ordem de produção. É a cláusula que os Planos de Serviço da WEIR deixavam em branco.',
  }),
  catalogado('PO-003', 'Jateamento Abrasivo Industrial', 'procedimento', 'Operações', 'Ger. Jateamento', ['8.5.1'], 'irrestrito', { nota: 'Ref. SSPC-SP10 / Sa 2½.' }),
  catalogado('PO-004', 'Aplicação de Primer e Tinta de Fundo', 'procedimento', 'Operações', 'Ger. Pintura', ['8.5.1'], 'irrestrito'),
  catalogado('PO-005', 'Aplicação de Tinta de Acabamento', 'procedimento', 'Operações', 'Ger. Pintura', ['8.5.1'], 'irrestrito'),
  catalogado('PO-006', 'Cura e Secagem em Estufa', 'procedimento', 'Operações', 'Ger. Pintura', ['8.5.1'], 'irrestrito'),
  catalogado('PO-007', 'Planejamento e Controle da Produção (PCP)', 'procedimento', 'Operações', 'Ger. Operações', ['8.1'], 'irrestrito'),
  catalogado('PO-008', 'Embalagem, Proteção e Expedição de Peças', 'procedimento', 'Operações', 'Logística', ['8.5.4'], 'irrestrito'),

  catalogado('PQ-001', 'Inspeção de Qualidade — Jateamento', 'procedimento', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito', { nota: 'Ref. ABNT NBR 7348.' }),
  catalogado('PQ-002', 'Inspeção de Qualidade — Pintura', 'procedimento', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito', { nota: 'Ref. ABNT NBR 12321.' }),
  catalogado('PQ-003', 'Medição de Espessura de Película Seca', 'procedimento', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito', {
    nota: 'Ref. ABNT NBR 10443. É o procedimento onde a tolerância de −10% / +40% precisa estar escrita.',
  }),
  catalogado('PQ-004', 'Ensaio de Aderência por Corte em Cruz', 'procedimento', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito', { nota: 'Ref. ABNT NBR 11003.' }),
  catalogado('PQ-005', 'Controle de Equipamentos de Medição (EMC)', 'procedimento', 'Qualidade', 'Ger. Qualidade', ['7.1.5'], 'irrestrito', { codigosParalelos: ['MJ-CAL-01'], tela: 'instrumentos' }),
  catalogado('PQ-006', 'Inspeção de Saída e Liberação de Peças', 'procedimento', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito'),

  catalogado('PF-001', 'Qualificação e Avaliação de Fornecedores', 'procedimento', 'Compras', 'Ger. Administrativo', ['8.4'], 'restrito'),
  catalogado('PF-002', 'Controle de Materiais e Insumos', 'procedimento', 'Compras', 'Almoxarifado', ['8.4.3'], 'irrestrito'),

  catalogado('PRH-001', 'Competência, Treinamento e Conscientização', 'procedimento', 'RH', 'Ger. RH', ['7.2', '7.3'], 'irrestrito'),
  catalogado('PRH-002', 'Integração de Novos Colaboradores', 'procedimento', 'RH', 'Ger. RH', ['7.2'], 'irrestrito'),

  catalogado('PSSMA-001', 'Controle de EPI e EPC', 'procedimento', 'SSMA', 'SSMA', ['7.1.4'], 'irrestrito', { local: 'Servidor / Pasta SSMA', nota: 'Ref. NR-6.' }),
  catalogado('PSSMA-002', 'Gestão de Resíduos Industriais', 'procedimento', 'SSMA', 'SSMA', ['8.5.1'], 'irrestrito', { local: 'Servidor / Pasta SSMA', nota: 'Ref. CONAMA 313.' }),
  catalogado('PSSMA-003', 'Controle de Produtos Químicos (FISPQ)', 'procedimento', 'SSMA', 'SSMA', ['7.1.4'], 'irrestrito', { local: 'Servidor / Pasta SSMA', nota: 'Ref. NR-26 / ABNT 14725.' }),

  catalogado('IT-001', 'IT — Operação do Vaso de Jateamento', 'instrucao', 'Operações', 'Ger. Jateamento', ['8.5.1'], 'irrestrito'),
  catalogado('IT-002', 'IT — Operação da Pistola Airless', 'instrucao', 'Operações', 'Ger. Pintura', ['8.5.1'], 'irrestrito'),
  catalogado('IT-003', 'IT — Preparação e Mistura de Tintas', 'instrucao', 'Operações', 'Ger. Pintura', ['8.5.1'], 'irrestrito'),
  catalogado('IT-004', 'IT — Uso do Medidor de Espessura', 'instrucao', 'Qualidade', 'Ger. Qualidade', ['7.1.5'], 'irrestrito', { local: 'Lab. Qualidade (físico)' }),
  catalogado('IT-005', 'IT — Leitura de Perfil de Rugosidade', 'instrucao', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito', { local: 'Lab. Qualidade (físico)' }),

  catalogado('FM-001', 'Formulário — Ordem de Serviço (OS)', 'formulario', 'Operações', 'Ger. Operações', ['8.5.1'], 'irrestrito', { codigosParalelos: ['MJ-OP-01'], tela: 'plano' }),
  catalogado('FM-002', 'Formulário — Relatório de Inspeção de Pintura', 'formulario', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito', {
    tela: 'plano',
    nota: 'O documento que vai ao cliente como prova de conformidade. O app o gera a partir da FM-001, sem redigitar.',
  }),
  catalogado('FM-003', 'Formulário — Relatório de Não Conformidade (RNC)', 'formulario', 'Gestão da Qualidade', 'RQ', ['10.2'], 'irrestrito', {
    codigosParalelos: ['MJ-FORM-NC-01', 'MJ-FORM-RNC'],
    nota: 'Dois arquivos diferentes se declaram este mesmo formulário.',
  }),
  catalogado('FM-004', 'Formulário — Pesquisa de Satisfação do Cliente', 'formulario', 'Comercial', 'Ger. Comercial', ['9.1.2'], 'irrestrito'),
  catalogado('FM-005', 'Formulário — Plano de Ação (5W2H)', 'formulario', 'Gestão da Qualidade', 'RQ', ['10.2'], 'irrestrito'),
  catalogado('FM-006', 'Formulário — Controle de Recebimento de Peças', 'formulario', 'Logística', 'Logística', ['8.4.3'], 'irrestrito', { codigosParalelos: ['MJ-REC-01'] }),
  catalogado('FM-007', 'Formulário — Romaneio de Expedição', 'formulario', 'Logística', 'Logística', ['8.5.4'], 'irrestrito', { codigosParalelos: ['MJ-ROM-01'] }),
  catalogado('FM-008', 'Formulário — Avaliação de Fornecedores', 'formulario', 'Compras', 'Ger. Administrativo', ['8.4'], 'restrito'),
  catalogado('FM-009', 'Formulário — Registro de Treinamento (LNT)', 'formulario', 'RH', 'Ger. RH', ['7.2'], 'irrestrito'),
  catalogado('FM-010', 'Formulário — Plano de Auditoria Interna', 'formulario', 'Gestão da Qualidade', 'RQ', ['9.2'], 'irrestrito'),
  catalogado('FM-011', 'Formulário — Pedido de Compra', 'formulario', 'Compras', 'Ger. Administrativo', ['8.4'], 'restrito', {
    nota: 'Requisição e aprovação de compra de materiais e serviços. O pedido 245-96 enviado à RINA traz este código.',
  }),
];

/* ── O que circula sem entrada na lista ─────────────────────────────────────────────────────── */

function foraDaLista(
  codigo: string, titulo: string, natureza: Natureza, categoria: string, nota: string,
  extra: Extra = {},
): DocumentoMestre {
  return {
    codigo, titulo, natureza, categoria, nota, foraDaLista: true,
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    responsavel: null, clausulas: [], local: null,
    ...extra,
  };
}

const FORA: DocumentoMestre[] = [
  foraDaLista('FM-011', 'Contexto Organizacional e Matriz SWOT', 'formulario', 'Gestão da Qualidade',
    'Tomou um código que a Lista Mestra já dá ao Pedido de Compra. E os dois têm nível de acesso diferente: o pedido é restrito, a SWOT é irrestrita.',
    { revisao: '00', emissao: '2026-08-10', clausulas: ['4.1', '4.2', '6.1'] }),

  foraDaLista('TR-001', 'Lista de Presença — Treinamento de Maquinário', 'formulario', 'RH',
    'Usa um prefixo (TR) que a Legenda da Lista Mestra não conhece — ela só reconhece MQ, PG, PC, PO, PQ, PF, PRH, PSSMA, IT e FM. É vizinho do FM-009, mas não é o mesmo documento: o LNT levanta a necessidade de treinamento, a Lista de Presença registra quem esteve na sala.',
    { revisao: '01', clausulas: ['7.2'] }),

  foraDaLista('MJ-FORM-CAL-02', 'Avaliação de Impacto de Calibração', 'formulario', 'Qualidade',
    'Citado pelo MJ-CAL-01 (o PQ-005), mas o arquivo nunca apareceu.', { clausulas: ['7.1.5'] }),

  ...[
    ['Plano de Calibração', 'Qualidade', '7.1.5'],
    ['Verificação Interna de Instrumento', 'Qualidade', '7.1.5'],
    ['Calibração Externa', 'Qualidade', '7.1.5'],
    ['Solicitação de Alteração de Documento', 'Gestão da Qualidade', '7.5.2'],
    ['Controle de Distribuição de Documentos', 'Gestão da Qualidade', '7.5.3'],
  ].map(([titulo, categoria, clausula], i) =>
    foraDaLista(`${SEM_CODIGO}-${String(i + 1).padStart(2, '0')}`, titulo, 'registro', categoria,
      'Registro em uso, sem código e sem entrada na Lista Mestra.', { clausulas: [clausula] })),
];

export const LISTA_MESTRA: DocumentoMestre[] = [...CATALOGADOS, ...FORA];

/* ── Acesso ─────────────────────────────────────────────────────────────────────────────────── */

const PORCODIGO = new Map<string, DocumentoMestre[]>();
for (const d of LISTA_MESTRA) {
  const lista = PORCODIGO.get(d.codigo) ?? [];
  lista.push(d);
  PORCODIGO.set(d.codigo, lista);
}

/** O documento sob este código. Estoura se não estiver catalogado — é o que impede uma tela de
 *  carimbar um código que a Lista Mestra não conhece. */
export function doc(codigo: string): DocumentoMestre {
  const achados = PORCODIGO.get(codigo);
  if (!achados?.length) {
    throw new Error(`Código "${codigo}" não está na Lista Mestra. Cadastre-o em listaMestra.ts antes de usá-lo numa tela.`);
  }
  return achados[0];
}

/** O carimbo que vai no rodapé de um documento emitido pelo app. */
export function carimbo(codigo: string): string {
  const d = doc(codigo);
  return d.revisao ? `${d.codigo} rev. ${d.revisao}` : d.codigo;
}

/** O prefixo de um código, e o que ele significa na Legenda. Null se a Legenda não o conhece. */
export function significadoDoPrefixo(codigo: string): string | null {
  const prefixo = codigo.split('-')[0];
  return PREFIXO_ROTULO[prefixo] ?? null;
}

/** O próximo código livre de um prefixo — para cadastrar o que hoje circula sem entrada. */
export function proximoCodigoLivre(prefixo: string): string {
  const usados = [...PORCODIGO.keys()]
    .filter((c) => c.startsWith(`${prefixo}-`))
    .map((c) => Number(c.slice(prefixo.length + 1)))
    .filter((n) => Number.isFinite(n));
  const proximo = usados.length ? Math.max(...usados) + 1 : 1;
  return `${prefixo}-${String(proximo).padStart(3, '0')}`;
}

/* ── Conflitos ─────────────────────────────────────────────────────────────────────────────── */

export type TipoConflito =
  | 'codigo_duplicado' | 'fora_da_lista' | 'codigo_paralelo'
  | 'revisao_vencida' | 'revisao_divergente' | 'prefixo_desconhecido' | 'sem_aprovacao';

export interface Conflito {
  tipo: TipoConflito;
  /** O código sob conflito, ou null quando o documento não tem código nenhum. */
  codigo: string | null;
  titulo: string;
  detalhe: string;
  gravidade: 'alta' | 'media';
}

export const CONFLITO_ROTULO: Record<TipoConflito, string> = {
  codigo_duplicado: 'Dois documentos, o mesmo código',
  fora_da_lista: 'Circula sem entrada na Lista Mestra',
  codigo_paralelo: 'O arquivo real usa outro código',
  revisao_vencida: 'Revisão vencida',
  revisao_divergente: 'A revisão da lista não bate com a do arquivo',
  prefixo_desconhecido: 'Prefixo que a Legenda não conhece',
  sem_aprovacao: 'Sem aprovação registrada',
};

/** Tudo que impede a Lista Mestra de ser a única fonte de identificação. */
export function conflitos(hoje = new Date()): Conflito[] {
  const out: Conflito[] = [];

  for (const [codigo, docs] of PORCODIGO) {
    if (docs.length > 1) {
      out.push({
        tipo: 'codigo_duplicado', codigo, titulo: docs.map((d) => d.titulo).join(' × '),
        detalhe: `${docs.length} documentos vigentes disputam o código ${codigo}.`,
        gravidade: 'alta',
      });
    }
  }

  for (const d of LISTA_MESTRA) {
    if (d.foraDaLista) {
      out.push({
        tipo: 'fora_da_lista', codigo: codigoReal(d), titulo: d.titulo,
        detalhe: d.nota ?? 'Documento em uso, sem entrada própria na Lista Mestra.',
        gravidade: d.natureza === 'formulario' ? 'alta' : 'media',
      });
    }
    if (d.codigosParalelos?.length) {
      out.push({
        tipo: 'codigo_paralelo', codigo: codigoReal(d), titulo: d.titulo,
        detalhe: `O arquivo real se identifica como ${d.codigosParalelos.join(' e ')}. São o mesmo documento com códigos diferentes.`,
        gravidade: 'media',
      });
    }
    if (d.revisaoNoArquivo) {
      out.push({
        tipo: 'revisao_divergente', codigo: codigoReal(d), titulo: d.titulo,
        detalhe: `A lista traz rev. ${d.revisao}; o arquivo declara rev. ${d.revisaoNoArquivo.revisao} de ${br(d.revisaoNoArquivo.data)}.`,
        gravidade: 'alta',
      });
    }
    if (!d.codigo.startsWith(SEM_CODIGO) && !significadoDoPrefixo(d.codigo)) {
      out.push({
        tipo: 'prefixo_desconhecido', codigo: d.codigo, titulo: d.titulo,
        detalhe: `A Legenda reconhece ${Object.keys(PREFIXO_ROTULO).join(', ')} — "${d.codigo.split('-')[0]}" não está entre eles.`,
        gravidade: 'alta',
      });
    }
  }

  // Vencimento é do sistema inteiro, não de cada linha: os 47 têm a mesma data. Uma carta por
  // documento viraria 47 cartas iguais e esconderia o que importa — que venceu tudo de uma vez.
  const vencidos = new Map<string, DocumentoMestre[]>();
  for (const d of LISTA_MESTRA) {
    if (d.proximaRevisao && new Date(d.proximaRevisao) < hoje) {
      vencidos.set(d.proximaRevisao, [...(vencidos.get(d.proximaRevisao) ?? []), d]);
    }
  }
  for (const [data, docs] of vencidos) {
    out.push({
      tipo: 'revisao_vencida', codigo: null,
      titulo: `${docs.length} documento${docs.length > 1 ? 's' : ''} da Lista Mestra`,
      detalhe: `Revisão prevista para ${br(data)} e ainda não feita. Vence tudo na mesma data porque tudo foi emitido na mesma data — ${br(EMISSAO)}.`,
      gravidade: 'alta',
    });
  }

  // A própria Lista Mestra está vencida, e ela não se cataloga.
  if (new Date(LISTA_MESTRA_META.proximaRevisao) < hoje) {
    out.push({
      tipo: 'revisao_vencida', codigo: LISTA_MESTRA_META.codigo, titulo: 'Lista Mestra de Documentos',
      detalhe: `Emitida em ${br(LISTA_MESTRA_META.emissao)}, revisão prevista para ${br(LISTA_MESTRA_META.proximaRevisao)}.`,
      gravidade: 'alta',
    });
  }
  out.push({
    tipo: 'codigo_duplicado', codigo: LISTA_MESTRA_META.codigo, titulo: 'Lista Mestra de Documentos',
    detalhe: LISTA_MESTRA_META.nota,
    gravidade: 'alta',
  });
  if (!LISTA_MESTRA_META.aprovadoPor || !LISTA_MESTRA_META.elaboradoPor) {
    out.push({
      tipo: 'sem_aprovacao', codigo: LISTA_MESTRA_META.codigo, titulo: 'Lista Mestra de Documentos',
      detalhe: 'Os campos "Elaborado por" e "Aprovado por" estão em branco na planilha. A ISO 9001 §7.5.2 pede aprovação registrada.',
      gravidade: 'alta',
    });
  }

  return out;
}

/** Quantos documentos por categoria — para a tela mostrar o tamanho do sistema. */
export function porCategoria(): { categoria: string; total: number }[] {
  const mapa = new Map<string, number>();
  for (const d of CATALOGADOS) mapa.set(d.categoria, (mapa.get(d.categoria) ?? 0) + 1);
  return [...mapa].map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total);
}

/** Os documentos que atendem uma cláusula da ISO. */
export function porClausula(clausula: string): DocumentoMestre[] {
  return CATALOGADOS.filter((d) => d.clausulas.some((c) => c === clausula || c.startsWith(`${clausula}.`)));
}

export { CATALOGADOS };
