// A LISTA MESTRA é a autoridade sobre código de documento. Nenhuma tela inventa o seu código:
// toda tela pede o dela aqui, por `doc('FM-001')`. Trocar um código é trocar uma linha deste
// arquivo, e todas as telas que o carimbam mudam junto.
//
// Se uma tela pedir um código que não está catalogado, `doc` estoura. É de propósito: é o que
// impede o app de emitir um documento com código que o auditor não encontra na Lista Mestra.
//
// Origem: LM-SGQ-001 rev. 3, emitida 03/06/2025, com 47 documentos. Estão aqui os que o app
// toca, mais os que circulam sem entrada — que são o problema a resolver.

export type SituacaoDoc = 'vigente' | 'obsoleto' | 'em_revisao';
export type Acesso = 'irrestrito' | 'restrito';
export type Natureza = 'manual' | 'procedimento' | 'instrucao' | 'formulario' | 'registro';

export const NATUREZA_ROTULO: Record<Natureza, string> = {
  manual: 'Manual',
  procedimento: 'Procedimento',
  instrucao: 'Instrução de trabalho',
  formulario: 'Formulário',
  registro: 'Registro',
};

export interface DocumentoMestre {
  /** O código da Lista Mestra. É o oficial — o que o app carimba. */
  codigo: string;
  titulo: string;
  natureza: Natureza;
  revisao: string | null;
  emissao: string | null;
  proximaRevisao: string | null;
  situacao: SituacaoDoc;
  acesso: Acesso;
  /** Códigos que o arquivo real carrega, quando não são o da Lista Mestra. */
  codigosParalelos?: string[];
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

/** Cabeçalho da própria Lista Mestra. */
export const LISTA_MESTRA_META = {
  codigo: 'LM-SGQ-001',
  revisao: '3',
  emissao: '2025-06-03',
  proximaRevisao: '2026-07-04',
  totalCatalogado: 47,
  codigosParalelos: ['MJ-REG-LMD-01', 'MJ-REC-01'],
  nota: 'O arquivo se identifica como LM-SGQ-001; o MJ-CDT-01 §11 manda mantê-la sob MJ-REG-LMD-01; e a planilha "Controle de Documentos" traz a aba sob MJ-REC-01 — que já é o código do formulário de Recebimento.',
};

export const LISTA_MESTRA: DocumentoMestre[] = [
  /* ── Manual e procedimentos que o app referencia ─────────────────────────────────────────── */
  {
    codigo: 'MQ-001', titulo: 'Manual do Sistema de Gestão da Qualidade', natureza: 'manual',
    revisao: '00', emissao: '2026-03-05', proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    foraDaLista: true,
    nota: 'Emitido depois da última revisão da Lista Mestra, e por isso ainda não catalogado nela.',
  },
  {
    codigo: 'PG-001', titulo: 'Controle de Documentos', natureza: 'procedimento',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    codigosParalelos: ['MJ-CDT-01'], tela: 'lista-mestra',
  },
  {
    codigo: 'PG-005', titulo: 'Não Conformidade e Ação Corretiva', natureza: 'procedimento',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    codigosParalelos: ['MJ-NC-01'],
  },
  {
    codigo: 'PO-002', titulo: 'Identificação e Rastreabilidade', natureza: 'procedimento',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    codigosParalelos: ['MJ-RAI-01'],
    nota: 'O §8 manda registrar o lote da tinta na ordem de produção. É a cláusula que os Planos de Serviço da WEIR deixam em branco.',
  },
  {
    codigo: 'PO-003', titulo: 'Jateamento Abrasivo Industrial', natureza: 'procedimento',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
  },
  {
    codigo: 'PQ-005', titulo: 'Controle de Equipamentos de Medição e Monitoramento', natureza: 'procedimento',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    codigosParalelos: ['MJ-CAL-01'], tela: 'instrumentos',
  },

  /* ── Os 11 formulários — estes viram tela ────────────────────────────────────────────────── */
  {
    codigo: 'FM-001', titulo: 'Ordem de Serviço / Plano de Serviço', natureza: 'formulario',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    codigosParalelos: ['MJ-OP-01'], tela: 'plano',
  },
  {
    codigo: 'FM-002', titulo: 'Relatório de Inspeção de Jateamento e Pintura (RIP)', natureza: 'formulario',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    tela: 'plano',
    nota: 'O documento que vai ao cliente como prova de conformidade. O app o gera a partir da FM-001.',
  },
  {
    codigo: 'FM-003', titulo: 'Relatório de Não Conformidade (RNC)', natureza: 'formulario',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    codigosParalelos: ['MJ-FORM-NC-01', 'MJ-FORM-RNC'],
    nota: 'Dois arquivos diferentes se declaram este mesmo formulário.',
  },
  {
    codigo: 'FM-004', titulo: 'Pesquisa de Satisfação do Cliente', natureza: 'formulario',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
  },
  {
    codigo: 'FM-005', titulo: 'Plano de Ação (5W2H)', natureza: 'formulario',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
  },
  {
    codigo: 'FM-006', titulo: 'Controle de Recebimento de Peças', natureza: 'formulario',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    codigosParalelos: ['MJ-REC-01'],
  },
  {
    codigo: 'FM-007', titulo: 'Romaneio de Expedição', natureza: 'formulario',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    codigosParalelos: ['MJ-ROM-01'],
  },
  {
    codigo: 'FM-008', titulo: 'Avaliação de Fornecedores', natureza: 'formulario',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
  },
  {
    codigo: 'FM-009', titulo: 'Registro de Treinamento (LNT)', natureza: 'formulario',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
  },
  {
    codigo: 'FM-010', titulo: 'Plano de Auditoria Interna', natureza: 'formulario',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
  },
  {
    codigo: 'FM-011', titulo: 'Pedido de Compra', natureza: 'formulario',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'restrito',
    nota: 'O pedido 245-96 enviado à RINA traz este código.',
  },

  /* ── Documentos vigentes que disputam código ou circulam sem entrada ─────────────────────── */
  {
    codigo: 'FM-011', titulo: 'Contexto Organizacional e Matriz SWOT', natureza: 'formulario',
    revisao: '00', emissao: '2026-08-10', proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    nota: 'Tomou um código que já estava ocupado pelo Pedido de Compra.',
  },
  {
    codigo: 'TR-001', titulo: 'Lista de Presença — Treinamento de Maquinário', natureza: 'formulario',
    revisao: '01', emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    foraDaLista: true,
    nota: 'Usa um prefixo (TR) que a Lista Mestra não conhece. É vizinho do FM-009 — Registro de Treinamento —, mas não é o mesmo documento: um levanta a necessidade, o outro registra quem esteve na sala. Precisa de decisão: entra como FM-012 ou como anexo do FM-009?',
  },
  {
    codigo: 'MJ-FORM-CAL-02', titulo: 'Avaliação de Impacto de Calibração', natureza: 'formulario',
    revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
    foraDaLista: true,
    nota: 'Citado pelo MJ-CAL-01, mas o arquivo nunca apareceu.',
  },
  ...(
    [
      'Plano de Calibração',
      'Verificação Interna de Instrumento',
      'Calibração Externa',
      'Solicitação de Alteração de Documento',
      'Controle de Distribuição de Documentos',
    ].map((titulo, i): DocumentoMestre => ({
      codigo: `${SEM_CODIGO}-${String(i + 1).padStart(2, '0')}`,
      titulo, natureza: 'registro',
      revisao: null, emissao: null, proximaRevisao: null, situacao: 'vigente', acesso: 'irrestrito',
      foraDaLista: true,
      nota: 'Registro em uso, sem código e sem entrada na Lista Mestra.',
    }))
  ),
];

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
  const partes = [d.codigo];
  if (d.revisao) partes.push(`rev. ${d.revisao}`);
  return partes.join(' · ');
}

/* ── Conflitos ─────────────────────────────────────────────────────────────────────────────── */

export type TipoConflito = 'codigo_duplicado' | 'fora_da_lista' | 'codigo_paralelo' | 'revisao_vencida';

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
    if (d.proximaRevisao && new Date(d.proximaRevisao) < hoje) {
      out.push({
        tipo: 'revisao_vencida', codigo: codigoReal(d), titulo: d.titulo,
        detalhe: `Revisão prevista para ${br(d.proximaRevisao)}, ainda não feita.`,
        gravidade: 'alta',
      });
    }
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

  return out;
}
