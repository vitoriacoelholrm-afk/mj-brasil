// MINASJATO — cliente 01 da consultoria. Só DADO, nenhuma regra.
//
// Tudo aqui saiu da planilha LM-SGQ-001 rev. 3, emitida 03/06/2025, e dos catorze arquivos MJ-*.
// As regras que leem estes dados estão em `plataforma/documentos.ts` e não sabem que a Minasjato
// existe — trocar de empresa é trocar este arquivo por outro.
import { registrar, type PerfilDaEmpresa } from '@/plataforma/empresa';
import { APURACOES, INDICADORES } from './minasjato.indicadores';
import {
  SEM_CODIGO,
  type Acesso, type DocumentoMestre, type Legenda, type ListaMestraMeta, type Natureza,
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
  'revisao' | 'emissao' | 'clausulas' | 'codigosParalelos' | 'divergenciaNaLista'
  | 'tela' | 'nota' | 'local' | 'padroes' | 'exclusoes'>>;

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
  // O manual sozinho atende o escopo (4.3) e a política (5.2.2): os dois textos estão nele por
  // extenso, não só citados. Apareciam como falta porque o modelo antes só deixava um documento
  // apontar para um padrão.
  //
  // As cláusulas vêm por extenso, e não como '4', '5', '6'…, desde 21/09/2026. É a MESMA
  // declaração da Lista Mestra, escrita num grau mais fino: quem declara a seção 4 declara a 4.1,
  // a 4.2, a 4.3 e a 4.4 — não há como declarar a seção e não as cláusulas dela.
  //
  // O que muda é o endereço. O auditor não pergunta onde a cláusula está coberta; pergunta qual
  // documento responde por ela. "Seção 4" manda procurar; "4.1" leva direto.
  //
  // O 8.3 continua na lista de propósito: a empresa exclui o requisito, e a norma manda a exclusão
  // estar documentada com justificativa — que é o que o campo `exclusoes` abaixo guarda. A cláusula
  // aparece no manual justamente para dizer que não se aplica, e por quê.
  catalogado('MQ-001', 'Manual da Qualidade', 'manual', 'Gestão da Qualidade', 'Dir. Geral',
    [
      '4.1', '4.2', '4.3', '4.4',
      '5.1', '5.2', '5.3',
      '6.1', '6.2', '6.3',
      '7.1', '7.1.5', '7.1.6', '7.2', '7.3', '7.4', '7.5',
      '8.1', '8.2', '8.3', '8.4', '8.5.1', '8.5.2', '8.5.3', '8.5.4', '8.5.5', '8.5.6', '8.6', '8.7',
      '9.1.1', '9.1.2', '9.1.3', '9.2', '9.3',
      '10.1', '10.2', '10.3',
    ], 'irrestrito', {
    padroes: ['manual_qualidade', 'escopo_sgq', 'politica_qualidade'],
    revisao: '00',
    emissao: '2026-03-05',
    divergenciaNaLista: { revisao: '01', emissao: '2025-06-03' },
    nota: 'A Lista Mestra traz rev. 01 de 03/06/2025 — data anterior à existência do manual. O arquivo é que está certo: rev. 00 de 05/03/2026, emissão inicial, elaborado por Vitória Coelho, verificado por Gustavo Moreira e aprovado por Leandro Santos. Quem precisa ser corrigida é a lista.',
    exclusoes: [{
      requisito: '8.3 Projeto e Desenvolvimento',
      justificativa: 'A Minasjato não desenvolve especificações de pintura; executa conforme os requisitos definidos pelo contratante.',
    }],
  }),

  catalogado('PG-001', 'Controle de Documentos e Registros', 'procedimento', 'Gestão da Qualidade', 'RQ', ['7.5'], 'irrestrito', { padroes: ['controle_documentos'], codigosParalelos: ['MJ-CDT-01'], tela: 'lista-mestra' }),
  catalogado('PG-002', 'Análise Crítica pela Direção', 'procedimento', 'Gestão da Qualidade', 'Dir. Geral', ['9.3'], 'irrestrito', { padroes: ['analise_critica_direcao'] }),
  catalogado('PG-003', 'Gestão de Riscos e Oportunidades', 'procedimento', 'Gestão da Qualidade', 'RQ', ['6.1'], 'irrestrito', { padroes: ['riscos_oportunidades'] }),
  catalogado('PG-004', 'Auditoria Interna', 'procedimento', 'Gestão da Qualidade', 'RQ', ['9.2'], 'irrestrito', { padroes: ['auditoria_interna'] }),
  catalogado('PG-005', 'Não Conformidade e Ação Corretiva', 'procedimento', 'Gestão da Qualidade', 'RQ', ['10.2'], 'irrestrito', { padroes: ['nao_conformidade'], codigosParalelos: ['MJ-NC-01'] }),
  catalogado('PG-006', 'Objetivos e Indicadores da Qualidade', 'procedimento', 'Gestão da Qualidade', 'RQ', ['6.2', '9.1'], 'irrestrito', { padroes: ['objetivos_qualidade'] }),

  catalogado('PC-001', 'Análise Crítica de Pedidos e Contratos', 'procedimento', 'Comercial', 'Ger. Comercial', ['8.2'], 'restrito', { padroes: ['analise_critica_requisitos'] }),
  catalogado('PC-002', 'Elaboração de Orçamentos', 'procedimento', 'Comercial', 'Ger. Orçamentos', ['8.2'], 'restrito', { padroes: ['determinacao_requisitos'],
    nota: 'É daqui que sai a especificação que a OS carrega — o que o cliente pediu na hora do orçamento.',
  }),
  catalogado('PC-003', 'Comunicação com o Cliente', 'procedimento', 'Comercial', 'Ger. Comercial', ['8.2.1'], 'irrestrito', { padroes: ['comunicacao_cliente'] }),

  catalogado('PO-001', 'Recebimento e Inspeção de Entrada de Peças', 'procedimento', 'Operações', 'Ger. Operações', ['8.4', '8.6'], 'irrestrito', { padroes: ['recebimento'] }),
  catalogado('PO-002', 'Identificação e Rastreabilidade de Peças', 'procedimento', 'Operações', 'Ger. Operações', ['8.5.2'], 'irrestrito', { padroes: ['rastreabilidade'],
    codigosParalelos: ['MJ-RAI-01'],
    nota: 'O §8 manda registrar o lote da tinta na ordem de produção. É a cláusula que os Planos de Serviço da WEIR deixavam em branco.',
  }),
  catalogado('PO-003', 'Jateamento Abrasivo Industrial', 'procedimento', 'Operações', 'Ger. Jateamento', ['8.5.1'], 'irrestrito', { padroes: ['st_jateamento'], nota: 'Ref. SSPC-SP10 / Sa 2½.' }),
  catalogado('PO-004', 'Aplicação de Primer e Tinta de Fundo', 'procedimento', 'Operações', 'Ger. Pintura', ['8.5.1'], 'irrestrito', { padroes: ['st_aplicacao_tinta'] }),
  catalogado('PO-005', 'Aplicação de Tinta de Acabamento', 'procedimento', 'Operações', 'Ger. Pintura', ['8.5.1'], 'irrestrito', { padroes: ['st_aplicacao_tinta'] }),
  catalogado('PO-006', 'Cura e Secagem em Estufa', 'procedimento', 'Operações', 'Ger. Pintura', ['8.5.1'], 'irrestrito', { padroes: ['st_cura'] }),
  catalogado('PO-007', 'Planejamento e Controle da Produção (PCP)', 'procedimento', 'Operações', 'Ger. Operações', ['8.1'], 'irrestrito', { padroes: ['caracteristicas_produto'] }),
  catalogado('PO-008', 'Embalagem, Proteção e Expedição de Peças', 'procedimento', 'Operações', 'Logística', ['8.5.4'], 'irrestrito', { padroes: ['expedicao'] }),

  catalogado('PQ-001', 'Inspeção de Qualidade — Jateamento', 'procedimento', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito', { padroes: ['st_inspecao_jateamento'], nota: 'Ref. ABNT NBR 7348.' }),
  catalogado('PQ-002', 'Inspeção de Qualidade — Pintura', 'procedimento', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito', { padroes: ['st_inspecao_pintura'], nota: 'Ref. ABNT NBR 12321.' }),
  catalogado('PQ-003', 'Medição de Espessura de Película Seca', 'procedimento', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito', { padroes: ['st_medicao_espessura'],
    nota: 'Ref. ABNT NBR 10443. É o procedimento onde a tolerância de −10% / +40% precisa estar escrita.',
  }),
  catalogado('PQ-004', 'Ensaio de Aderência por Corte em Cruz', 'procedimento', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito', { padroes: ['st_aderencia'], nota: 'Ref. ABNT NBR 11003.' }),
  catalogado('PQ-005', 'Controle de Equipamentos de Medição (EMC)', 'procedimento', 'Qualidade', 'Ger. Qualidade', ['7.1.5'], 'irrestrito', { padroes: ['calibracao'], codigosParalelos: ['MJ-CAL-01'], tela: 'instrumentos' }),
  catalogado('PQ-006', 'Inspeção de Saída e Liberação de Peças', 'procedimento', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito', { padroes: ['liberacao_produto'] }),

  catalogado('PF-001', 'Qualificação e Avaliação de Fornecedores', 'procedimento', 'Compras', 'Ger. Administrativo', ['8.4'], 'restrito', { padroes: ['avaliacao_fornecedor'] }),
  catalogado('PF-002', 'Controle de Materiais e Insumos', 'procedimento', 'Compras', 'Almoxarifado', ['8.4.3'], 'irrestrito', { padroes: ['controle_insumos'] }),

  catalogado('PRH-001', 'Competência, Treinamento e Conscientização', 'procedimento', 'RH', 'Ger. RH', ['7.2', '7.3'], 'irrestrito', { padroes: ['competencia_treinamento'] }),
  catalogado('PRH-002', 'Integração de Novos Colaboradores', 'procedimento', 'RH', 'Ger. RH', ['7.2'], 'irrestrito', { padroes: ['conscientizacao'] }),

  catalogado('PSSMA-001', 'Controle de EPI e EPC', 'procedimento', 'SSMA', 'SSMA', ['7.1.4'], 'irrestrito', { padroes: ['ssma_epi'], local: 'Servidor / Pasta SSMA', nota: 'Ref. NR-6.' }),
  catalogado('PSSMA-002', 'Gestão de Resíduos Industriais', 'procedimento', 'SSMA', 'SSMA', ['8.5.1'], 'irrestrito', { padroes: ['ssma_residuos'], local: 'Servidor / Pasta SSMA', nota: 'Ref. CONAMA 313.' }),
  catalogado('PSSMA-003', 'Controle de Produtos Químicos (FISPQ)', 'procedimento', 'SSMA', 'SSMA', ['7.1.4'], 'irrestrito', { padroes: ['ssma_quimicos'], local: 'Servidor / Pasta SSMA', nota: 'Ref. NR-26 / ABNT 14725.' }),

  catalogado('IT-001', 'IT — Operação do Vaso de Jateamento', 'instrucao', 'Operações', 'Ger. Jateamento', ['8.5.1'], 'irrestrito', { padroes: ['st_it_jateamento'] }),
  catalogado('IT-002', 'IT — Operação da Pistola Airless', 'instrucao', 'Operações', 'Ger. Pintura', ['8.5.1'], 'irrestrito', { padroes: ['st_it_aplicacao'] }),
  catalogado('IT-003', 'IT — Preparação e Mistura de Tintas', 'instrucao', 'Operações', 'Ger. Pintura', ['8.5.1'], 'irrestrito', { padroes: ['st_it_aplicacao'] }),
  catalogado('IT-004', 'IT — Uso do Medidor de Espessura', 'instrucao', 'Qualidade', 'Ger. Qualidade', ['7.1.5'], 'irrestrito', { padroes: ['st_it_medicao'], local: 'Lab. Qualidade (físico)' }),
  catalogado('IT-005', 'IT — Leitura de Perfil de Rugosidade', 'instrucao', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito', { padroes: ['st_rugosidade'], local: 'Lab. Qualidade (físico)' }),

  catalogado('FM-001', 'Formulário — Ordem de Serviço (OS)', 'formulario', 'Operações', 'Ger. Operações', ['8.5.1'], 'irrestrito', { padroes: ['st_ordem_servico'], codigosParalelos: ['MJ-OP-01'], tela: 'plano' }),
  catalogado('FM-002', 'Formulário — Relatório de Inspeção de Pintura', 'formulario', 'Qualidade', 'Ger. Qualidade', ['8.6'], 'irrestrito', { padroes: ['st_relatorio_inspecao'],
    tela: 'plano',
    nota: 'O documento que vai ao cliente como prova de conformidade. O app o gera a partir da FM-001, sem redigitar.',
  }),
  catalogado('FM-003', 'Formulário — Relatório de Não Conformidade (RNC)', 'formulario', 'Gestão da Qualidade', 'RQ', ['8.7.2', '10.2'], 'irrestrito', {
    padroes: ['nao_conformidade', 'saida_nao_conforme'], tela: 'nao-conformidade',
    codigosParalelos: ['MJ-FORM-NC-01', 'MJ-FORM-RNC'],
    nota: 'Dois arquivos diferentes se declaram este mesmo formulário. Atende duas cláusulas: a 8.7.2 quer saber o que se fez com a PEÇA, a 10.2.2 o que se fez com a CAUSA.',
  }),
  catalogado('FM-004', 'Formulário — Pesquisa de Satisfação do Cliente', 'formulario', 'Comercial', 'Ger. Comercial', ['9.1.2'], 'irrestrito', { padroes: ['satisfacao_cliente'] }),
  catalogado('FM-005', 'Formulário — Plano de Ação (5W2H)', 'formulario', 'Gestão da Qualidade', 'RQ', ['10.2'], 'irrestrito', { padroes: ['plano_acao'] }),
  catalogado('FM-006', 'Formulário — Controle de Recebimento de Peças', 'formulario', 'Logística', 'Logística', ['8.4.3'], 'irrestrito', { padroes: ['recebimento'], codigosParalelos: ['MJ-REC-01'] }),
  catalogado('FM-007', 'Formulário — Romaneio de Expedição', 'formulario', 'Logística', 'Logística', ['8.5.4'], 'irrestrito', { padroes: ['expedicao'], codigosParalelos: ['MJ-ROM-01'] }),
  catalogado('FM-008', 'Formulário — Avaliação de Fornecedores', 'formulario', 'Compras', 'Ger. Administrativo', ['8.4'], 'restrito', { padroes: ['avaliacao_fornecedor'] }),
  catalogado('FM-009', 'Formulário — Registro de Treinamento (LNT)', 'formulario', 'RH', 'Ger. RH', ['7.2'], 'irrestrito', { padroes: ['evidencia_competencia'] }),
  catalogado('FM-010', 'Formulário — Plano de Auditoria Interna', 'formulario', 'Gestão da Qualidade', 'RQ', ['9.2'], 'irrestrito', { padroes: ['auditoria_interna'] }),
  // Os dois que faltavam à norma, criados em 16/09/2026. Entram em FM-020 e FM-021 — a numeração
  // segue do maior, nunca preenche buraco. Buraco pode ser código aposentado, e reaproveitar
  // código aposentado faz o arquivo antigo virar armadilha: dois documentos diferentes com o
  // mesmo número em épocas diferentes.
  catalogado('FM-020', 'Formulário — Ocorrência com Propriedade do Cliente', 'formulario', 'Operações', 'Ger. Operações', ['8.5.3'], 'irrestrito', {
    padroes: ['propriedade_cliente'], tela: 'propriedade-cliente',
    nota: 'Criado em 16/09/2026 para fechar a falta da 8.5.3. Peça de cliente perdida, danificada ou inadequada: a norma pede comunicar E registrar.',
  }),
  catalogado('FM-021', 'Formulário — Análise Crítica de Mudança na Produção', 'formulario', 'Operações', 'Ger. Operações', ['8.5.6'], 'irrestrito', {
    padroes: ['mudanca_producao'], tela: 'mudanca-producao',
    nota: 'Criado em 16/09/2026 para fechar a falta da 8.5.6. Retém o resultado da análise, quem autorizou e as ações necessárias.',
  }),

  // A 9.1.1 pede o resultado do que se monitora. O relatório de inspeção já mede o PRODUTO;
  // o que faltava era o indicador do SISTEMA — o número que a direção consome na análise
  // crítica. Entra em FM-022 porque a numeração segue do maior.
  catalogado('FM-022', 'Formulário — Indicadores do SGQ', 'formulario', 'Gestão da Qualidade', 'RQ', ['9.1.1'], 'irrestrito', {
    padroes: ['monitoramento_medicao'], tela: 'indicadores',
    nota: 'Criado em 16/09/2026 para fechar a falta da 9.1.1. Um registro por indicador e por período — é assim que se compara com o período anterior.',
  }),

  // A portaria, criada em 17/09/2026. FM-023 porque a numeração segue do maior — e o livro
  // da portaria é registro próprio: não substitui o FM-006 nem o FM-007, que inspecionam a
  // carga. Aqui se registra o veículo passando pelo portão.
  catalogado('FM-023', 'Formulário — Controle de Entrada e Saída de Cargas', 'formulario', 'Logística', 'Logística', ['8.5.3', '8.5.4'], 'irrestrito', {
    padroes: ['controle_cargas'], tela: 'cargas',
  }),

  // A SWOT, catalogada em 21/09/2026. Executa a proposta que o próprio plano de unificação já
  // fazia: ela estava FORA DA LISTA por ter tomado o FM-011, que a Lista Mestra dá ao Pedido de
  // Compra — e os dois têm acesso diferente (o pedido é restrito, a SWOT é irrestrita).
  //
  // Quem muda de número é a SWOT, e não o pedido: o FM-011 do Pedido de Compra já saiu da empresa
  // — o pedido 245-96 enviado à RINA traz esse código. Código que já circulou não se renumera.
  //
  // FM-024 porque a numeração segue do maior e nunca preenche buraco; buraco pode ser código
  // aposentado, e reaproveitá-lo faz o arquivo antigo virar armadilha.
  //
  // O FM-011 fica registrado como código paralelo DE PROPÓSITO: o arquivo e as cópias impressas
  // ainda dizem FM-011 até a próxima revisão. O sistema continua apontando isso como pendência
  // — não é ruído, é o que falta fazer no mundo físico.
  //
  // Com ela na lista, a 4.2 deixa de ter o manual como única resposta: passa a ter documento
  // próprio, que era o que a auditoria ia cobrar.
  catalogado('FM-024', 'Formulário — Contexto Organizacional e Matriz SWOT', 'formulario', 'Gestão da Qualidade', 'RQ', ['4.1', '4.2', '6.1'], 'irrestrito', {
    padroes: ['contexto_partes_interessadas'],
    revisao: '00',
    emissao: '2026-08-10',
    codigosParalelos: ['FM-011'],
    nota: 'Era FM-011, que colidia com o Pedido de Compra. Renumerada em 21/09/2026 para FM-024. A Lista Mestra e o arquivo ainda trazem o código antigo — atualizar os dois é o que fecha a pendência.',
  }),

  catalogado('FM-011', 'Formulário — Pedido de Compra', 'formulario', 'Compras', 'Ger. Administrativo', ['8.4'], 'restrito', { padroes: ['compras'],
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
  // A SWOT saiu daqui em 21/09/2026 — virou FM-024, catalogada. Ver a nota lá.

  foraDaLista('TR-001', 'Lista de Presença — Treinamento de Maquinário', 'formulario', 'RH',
    'Usa um prefixo (TR) que a Legenda da Lista Mestra não conhece — ela só reconhece MQ, PG, PC, PO, PQ, PF, PRH, PSSMA, IT e FM. É vizinho do FM-009, mas não é o mesmo documento: o LNT levanta a necessidade de treinamento, a Lista de Presença registra quem esteve na sala.',
    { revisao: '01', clausulas: ['7.2'], padroes: ['evidencia_competencia'] }),

  foraDaLista('MJ-FORM-CAL-02', 'Avaliação de Impacto de Calibração', 'formulario', 'Qualidade',
    'Citado pelo MJ-CAL-01 (o PQ-005), mas o arquivo nunca apareceu. A 7.1.5.2 exige avaliar o impacto quando um instrumento aparece fora de calibração — é este documento.',
    { clausulas: ['7.1.5.2'], padroes: ['calibracao'] }),

  ...([
    ['Plano de Calibração', 'Qualidade', '7.1.5', 'calibracao'],
    ['Verificação Interna de Instrumento', 'Qualidade', '7.1.5', 'calibracao'],
    ['Calibração Externa', 'Qualidade', '7.1.5', 'calibracao'],
    ['Solicitação de Alteração de Documento', 'Gestão da Qualidade', '7.5.2', 'controle_documentos'],
    ['Controle de Distribuição de Documentos', 'Gestão da Qualidade', '7.5.3', 'controle_documentos'],
  ] as const).map(([titulo, categoria, clausula, padrao], i) =>
    foraDaLista(`${SEM_CODIGO}-${String(i + 1).padStart(2, '0')}`, titulo, 'registro', categoria,
      'Registro em uso, sem código e sem entrada na Lista Mestra.', { clausulas: [clausula], padrao })),
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
    propriedade_cliente: 'FM-020',
    mudanca_producao: 'FM-021',
    monitoramento_sgq: 'FM-022',
    controle_cargas: 'FM-023',
    plano_auditoria: 'FM-010',
    pedido_compra: 'FM-011',
  },
  indicadores: INDICADORES,
  apuracoes: APURACOES,
  modulos: ['tratamento-superficie', 'ssma', 'portaria'],
});

export { META, LEGENDA };
