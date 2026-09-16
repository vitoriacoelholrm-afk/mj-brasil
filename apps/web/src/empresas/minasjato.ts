// MINASJATO — cliente 01 da consultoria. Só DADO, nenhuma regra.
//
// Tudo aqui saiu da planilha LM-SGQ-001 rev. 3, emitida 03/06/2025, e dos catorze arquivos MJ-*.
// As regras que leem estes dados estão em `plataforma/documentos.ts` e não sabem que a Minasjato
// existe — trocar de empresa é trocar este arquivo por outro.
import { registrar, type PerfilDaEmpresa } from '@/plataforma/empresa';
import {
  SEM_CODIGO,
  type DocumentoMestre, type Legenda, type ListaMestraMeta, type Natureza,
} from '@/plataforma/documentos';

/** O que cada prefixo significa — está na aba Legenda da planilha. */
const LEGENDA: Legenda = {
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

/** Cabeçalho da própria Lista Mestra, como está na planilha. */
const META: ListaMestraMeta = {
  codigo: 'LM-SGQ-001',
  revisao: '3',
  emissao: '2025-06-03',
  proximaRevisao: '2026-07-04',
  totalCatalogado: 47,
  norma: 'ISO 9001:2015',
  /** A planilha traz os campos, mas em branco. ISO 7.5.2 pede aprovação registrada. */
  aprovadoPor: null,
  elaboradoPor: null,
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

export const CATALOGADOS: DocumentoMestre[] = [
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

/** O perfil completo. Registrar aqui é o que faz a Minasjato existir para a plataforma. */
export const MINASJATO: PerfilDaEmpresa = registrar({
  id: 'minasjato',
  identidade: {
    nome: 'Minasjato',
    subtitulo: 'Sistema da Qualidade',
    // Ocre: o amarelo que os formulários dela já usam para "campo obrigatório".
    acento: '#B08900',
    acentoFraco: '#FBF3D2',
  },
  // Decidido por ela em 16/09/2026: até 40% acima, no máximo 10% abaixo.
  tolerancia: { abaixo: 0.10, acima: 0.40 },
  documentacao: { meta: META, legenda: LEGENDA, documentos: LISTA_MESTRA },
  formularios: {
    ordem_servico: 'FM-001',
    relatorio_inspecao: 'FM-002',
    nao_conformidade: 'FM-003',
    pesquisa_satisfacao: 'FM-004',
    plano_acao: 'FM-005',
    recebimento: 'FM-006',
    romaneio: 'FM-007',
    avaliacao_fornecedor: 'FM-008',
    registro_treinamento: 'FM-009',
    plano_auditoria: 'FM-010',
    pedido_compra: 'FM-011',
  },
  modulos: ['surface-treatment'],
});

export { META, LEGENDA };
