// O CATÁLOGO PADRÃO — a lista mestra genérica da consultoria.
//
// O desencontro de informação nasce de uma coisa só: hoje a IDENTIDADE de um documento é o
// CÓDIGO, e código cada empresa inventa o seu. Aí o mesmo documento é FM-001 numa, FOR-001 noutra
// e MJ-OP-01 no arquivo, e ninguém consegue comparar duas empresas nem reaproveitar nada.
//
// Aqui a identidade passa a ser a CHAVE, que é da plataforma e não muda nunca. O código vira
// apelido local. Uma empresa pode chamar o controle de documentos de PG-001 e outra de POP-002 —
// as duas apontam para `controle_documentos`, e a consultoria fala uma língua só.
//
// DUAS COISAS QUE ESTE ARQUIVO SEPARA, e que valem dinheiro para quem faz consultoria:
//
//   exigencia: 'norma'    a ISO 9001:2015 manda manter ou reter esta informação documentada.
//                         Falta dela é não conformidade em auditoria.
//   exigencia: 'legal'    exigido por norma ou regulamento FORA da ISO 9001 (NR, CONAMA, ABNT
//                         setorial). Falta disso é problema, mas com outro auditor.
//   exigencia: 'pratica'  ninguém exige. É costume, e costume bom — mas é escolha da empresa,
//                         e ninguém deveria ser reprovado por não ter.
//
// A 2015 deixou de exigir manual da qualidade e procedimento documentado obrigatório; muita
// empresa continua sendo levada a escrever os dois por hábito de quem veio da 2008.
//
// E o catálogo é MODULAR: o núcleo vale para qualquer empresa certificada; o resto vem do módulo
// setorial que ela usa. Quem não jateia não recebe procedimento de jateamento.
import type { DocumentoMestre, Natureza } from './documentos';
import type { PapelDeFormulario } from './empresa';

/** A codificação sugerida. Quatro prefixos, de propósito.
 *
 *  Codificar a ÁREA no prefixo — PG, PC, PO, PQ, PF, PRH, PSSMA — é o que faz uma lista mestra
 *  ficar sem espaço e alguém inventar um prefixo novo por fora. A área é campo, não prefixo. */
export const LEGENDA_PADRAO: Record<string, string> = {
  MQ: 'Manual da Qualidade',
  PR: 'Procedimento',
  IT: 'Instrução de Trabalho',
  FR: 'Formulário / Registro',
};

/** Onde o documento nasce: no núcleo que toda empresa certificada precisa, ou num módulo. */
export const NUCLEO = 'nucleo';

/** De onde vem a obrigação. Confundir os três é o que faz empresa escrever documento demais e
 *  deixar de escrever o que importa. */
export type Exigencia = 'norma' | 'legal' | 'pratica';

export const EXIGENCIA_ROTULO: Record<Exigencia, string> = {
  norma: 'A ISO 9001:2015 exige',
  legal: 'Exigência legal ou de outra norma',
  pratica: 'Prática — ninguém exige',
};

export interface DocumentoPadrao {
  /** A identidade. Não muda, não depende de empresa, e é por ela que tudo se compara. */
  chave: string;
  titulo: string;
  natureza: Natureza;
  categoria: string;
  clausulas: string[];
  exigencia: Exigencia;
  /** MANTER é o documento — existe, vive, tem revisão. Um manual atende dezenas de cláusulas
   *  assim. RETER é o registro — nasce quando o fato acontece, e nenhum texto o substitui.
   *  Confundir os dois é o erro mais caro: a empresa escreve no manual "retemos informação
   *  documentada", o auditor pede o registro, e não existe. */
  retencao: 'manter' | 'reter';
  /** O que fazer para atender, em uma frase. É a diferença entre saber que falta e saber o que
   *  criar. */
  comoAtender?: string;
  origem: string;
  /** O código que a empresa recebe se adotar a codificação padrão. */
  codigoSugerido: string;
  /** Quando é formulário que vira tela, o papel que ele cumpre. */
  papel?: PapelDeFormulario;
  nota?: string;
}

const d = (
  chave: string, titulo: string, natureza: Natureza, categoria: string,
  clausulas: string[], exigencia: Exigencia, codigoSugerido: string,
  extra: Partial<DocumentoPadrao> = {},
): DocumentoPadrao => ({
  chave, titulo, natureza, categoria, clausulas, exigencia, codigoSugerido,
  retencao: natureza === 'formulario' || natureza === 'registro' ? 'reter' : 'manter',
  origem: NUCLEO, ...extra,
});

/* ══ NÚCLEO — vale para qualquer empresa certificada ISO 9001:2015 ═══════════════════════════ */

const NUCLEO_DOCS: DocumentoPadrao[] = [
  // — O que a norma manda MANTER (documento vivo, com revisão) —
  d('escopo_sgq', 'Escopo do Sistema de Gestão da Qualidade', 'manual', 'Gestão da Qualidade', ['4.3'], 'norma', 'MQ-001',
    { comoAtender: 'Costuma viver dentro do manual da qualidade, escrito por extenso. Se estiver lá, aponte a chave para o manual em vez de criar documento novo.', nota: 'A norma exige que o escopo esteja disponível como informação documentada, com os requisitos que a empresa considera não aplicáveis e a justificativa.' }),
  d('politica_qualidade', 'Política da Qualidade', 'manual', 'Gestão da Qualidade', ['5.2.2'], 'norma', 'MQ-002',
    { comoAtender: 'Idem: normalmente está no manual. Um documento pode cumprir vários padrões.' }),
  d('objetivos_qualidade', 'Objetivos da Qualidade e Planejamento', 'manual', 'Gestão da Qualidade', ['6.2.1'], 'norma', 'MQ-003'),
  d('caracteristicas_produto', 'Características do Produto e Serviço a Entregar', 'procedimento', 'Operações', ['8.5.1'], 'norma', 'PR-001',
    { nota: 'O que vai ser feito e que resultado tem de ser alcançado. Em serviço, costuma viver na ordem de serviço.' }),

  // — O que a norma manda RETER (registro, prova do que aconteceu) —
  d('evidencia_competencia', 'Evidência de Competência', 'formulario', 'Pessoas', ['7.2'], 'norma', 'FR-001',
    { papel: 'registro_treinamento' }),
  d('calibracao', 'Calibração e Verificação de Instrumentos', 'formulario', 'Qualidade', ['7.1.5.1', '7.1.5.2'], 'norma', 'FR-002',
    { nota: 'Sem instrumento calibrado, a medição não é rastreável e o registro não prova nada.' }),
  d('analise_critica_requisitos', 'Análise Crítica de Requisitos do Cliente', 'formulario', 'Comercial', ['8.2.3.2'], 'norma', 'FR-003'),
  d('avaliacao_fornecedor', 'Avaliação e Reavaliação de Fornecedores', 'formulario', 'Compras', ['8.4.1'], 'norma', 'FR-004',
    { papel: 'avaliacao_fornecedor' }),
  d('rastreabilidade', 'Identificação e Rastreabilidade', 'formulario', 'Operações', ['8.5.2'], 'norma', 'FR-005',
    { nota: 'Exigido quando rastreabilidade é requisito. É a cláusula do lote de tinta que fica em branco.' }),
  d('propriedade_cliente', 'Propriedade do Cliente Perdida ou Danificada', 'formulario', 'Operações', ['8.5.3'], 'norma', 'FR-006',
    { papel: 'propriedade_cliente', comoAtender: 'Formulário novo, curto: peça, cliente, o que houve, quando, a quem foi comunicado e quando. A 8.5.3 pede as duas coisas — comunicar ao cliente E reter o registro. Em quem jateia e pinta peça de terceiro, é o registro que falta com mais frequência.' }),
  d('mudanca_producao', 'Análise Crítica de Mudanças na Produção', 'formulario', 'Operações', ['8.5.6'], 'norma', 'FR-007',
    { papel: 'mudanca_producao', comoAtender: 'Formulário novo: o que mudou no processo, por quê, quem analisou, quem autorizou e o que foi verificado depois. Trocar de tinta, de abrasivo ou de esquema no meio de uma obra é exatamente isto.' }),
  d('liberacao_produto', 'Liberação de Produto e Serviço', 'formulario', 'Qualidade', ['8.6'], 'norma', 'FR-008',
    { nota: 'Tem de trazer a evidência de conformidade E quem autorizou a liberação. É o que falta quando um laudo sai assinado sem conferência.' }),
  d('saida_nao_conforme', 'Controle de Saída Não Conforme', 'formulario', 'Qualidade', ['8.7.2'], 'norma', 'FR-009',
    { comoAtender: 'Talvez já exista: confira se o formulário de RNC tem os quatro campos que a 8.7.2 pede — descrição da não conformidade, ações tomadas, concessão obtida e quem decidiu. Se tiver, é só apontar a chave para ele. Se faltar campo, acrescente.' }),
  d('monitoramento_medicao', 'Resultados de Monitoramento e Medição', 'formulario', 'Qualidade', ['9.1.1'], 'norma', 'FR-010',
    { papel: 'monitoramento_sgq', comoAtender: 'Parte já existe no relatório de inspeção, que mede o produto. O que falta é o registro dos indicadores do SGQ — o número que a análise crítica pela direção consome. Uma planilha por período resolve.' }),
  d('auditoria_interna', 'Programa e Resultados de Auditoria Interna', 'formulario', 'Gestão da Qualidade', ['9.2.2'], 'norma', 'FR-011',
    { papel: 'plano_auditoria' }),
  d('analise_critica_direcao', 'Resultados da Análise Crítica pela Direção', 'formulario', 'Gestão da Qualidade', ['9.3.3'], 'norma', 'FR-012'),
  d('nao_conformidade', 'Não Conformidade e Ação Corretiva', 'formulario', 'Gestão da Qualidade', ['10.2.2'], 'norma', 'FR-013',
    { papel: 'nao_conformidade' }),

  // — Prática consolidada: a norma NÃO exige, e muita gente escreve achando que exige —
  d('manual_qualidade', 'Manual da Qualidade', 'manual', 'Gestão da Qualidade', ['4', '5', '6', '7', '8', '9', '10'], 'pratica', 'MQ-004',
    { nota: 'A ISO 9001:2015 deixou de exigir manual. Continua útil como porta de entrada do sistema, mas é escolha — ninguém é reprovado por não ter.' }),
  d('controle_documentos', 'Controle de Informação Documentada', 'procedimento', 'Gestão da Qualidade', ['7.5'], 'pratica', 'PR-002',
    { nota: 'A norma exige o CONTROLE (identificação, revisão, acesso, retenção), não um procedimento escrito sobre ele.' }),
  d('riscos_oportunidades', 'Riscos e Oportunidades', 'procedimento', 'Gestão da Qualidade', ['6.1'], 'pratica', 'PR-003',
    { nota: 'A norma manda considerar riscos e oportunidades. Não manda documentar a análise.' }),
  d('contexto_partes_interessadas', 'Contexto da Organização e Partes Interessadas', 'formulario', 'Gestão da Qualidade', ['4.1', '4.2'], 'pratica', 'FR-014',
    { nota: 'Matriz SWOT costuma ocupar este lugar.' }),
  d('satisfacao_cliente', 'Percepção do Cliente', 'formulario', 'Comercial', ['9.1.2'], 'pratica', 'FR-015',
    { papel: 'pesquisa_satisfacao', nota: 'A norma exige monitorar a percepção do cliente. Pesquisa é um jeito, não o jeito.' }),
  d('plano_acao', 'Plano de Ação', 'formulario', 'Gestão da Qualidade', ['10.2'], 'pratica', 'FR-016',
    { papel: 'plano_acao' }),
  d('competencia_treinamento', 'Competência, Treinamento e Conscientização', 'procedimento', 'Pessoas', ['7.2', '7.3'], 'pratica', 'PR-004'),
  d('conscientizacao', 'Integração e Conscientização', 'procedimento', 'Pessoas', ['7.3'], 'pratica', 'PR-005'),
  d('determinacao_requisitos', 'Determinação de Requisitos e Orçamento', 'procedimento', 'Comercial', ['8.2.2'], 'pratica', 'PR-006',
    { nota: 'É no orçamento que a especificação do cliente entra. Tudo que a ordem de serviço carrega depois nasce aqui.' }),
  d('comunicacao_cliente', 'Comunicação com o Cliente', 'procedimento', 'Comercial', ['8.2.1'], 'pratica', 'PR-007'),
  d('controle_insumos', 'Controle de Materiais e Insumos', 'procedimento', 'Compras', ['8.4.3'], 'pratica', 'PR-008'),
  d('compras', 'Compras e Requisição de Materiais', 'formulario', 'Compras', ['8.4'], 'pratica', 'FR-017',
    { papel: 'pedido_compra' }),
  d('recebimento', 'Recebimento e Inspeção de Entrada', 'formulario', 'Logística', ['8.4.3'], 'pratica', 'FR-018',
    { papel: 'recebimento' }),
  d('expedicao', 'Expedição e Romaneio', 'formulario', 'Logística', ['8.5.4'], 'pratica', 'FR-019',
    { papel: 'romaneio' }),
  d('controle_cargas', 'Controle de Entrada e Saída de Cargas', 'formulario', 'Logística', ['8.5.4'], 'pratica', 'FR-020',
    { papel: 'controle_cargas',
      nota: 'O livro da portaria. Não substitui o recebimento nem o romaneio: aqueles inspecionam a carga, este registra o veículo passando pelo portão.' }),
];

/* ══ MÓDULO surface-treatment — só para quem jateia e pinta ══════════════════════════════════ */

const ST = 'surface-treatment';
const st = (
  chave: string, titulo: string, natureza: Natureza, categoria: string,
  clausulas: string[], exigencia: Exigencia, codigoSugerido: string,
  extra: Partial<DocumentoPadrao> = {},
): DocumentoPadrao => ({
  chave, titulo, natureza, categoria, clausulas, exigencia, codigoSugerido,
  retencao: natureza === 'formulario' || natureza === 'registro' ? 'reter' : 'manter',
  origem: ST, ...extra,
});

const SURFACE_TREATMENT: DocumentoPadrao[] = [
  st('st_ordem_servico', 'Ordem de Serviço / Plano de Serviço', 'formulario', 'Operações', ['8.5.1'], 'norma', 'FR-101',
    { papel: 'ordem_servico', nota: 'Carrega a especificação contratada e o registro de execução. É a informação documentada do 8.5.1 para este setor.' }),
  st('st_relatorio_inspecao', 'Relatório de Inspeção de Jateamento e Pintura', 'formulario', 'Qualidade', ['8.6'], 'norma', 'FR-102',
    { papel: 'relatorio_inspecao', nota: 'A liberação do 8.6 para este setor. Deve ser gerado da ordem de serviço, nunca redigitado.' }),
  st('st_jateamento', 'Jateamento Abrasivo', 'procedimento', 'Operações', ['8.5.1'], 'pratica', 'PR-101',
    { nota: 'Ref. ISO 8501-1 / SSPC-SP.' }),
  st('st_aplicacao_tinta', 'Aplicação de Tinta', 'procedimento', 'Operações', ['8.5.1'], 'pratica', 'PR-102'),
  st('st_medicao_espessura', 'Medição de Espessura de Película Seca', 'procedimento', 'Qualidade', ['8.6'], 'pratica', 'PR-103',
    { nota: 'Ref. ABNT NBR 10443. É onde a tolerância combinada com o cliente precisa estar escrita.' }),
  st('st_aderencia', 'Ensaio de Aderência', 'procedimento', 'Qualidade', ['8.6'], 'pratica', 'PR-104',
    { nota: 'Ref. ABNT NBR 11003.' }),
  st('st_rugosidade', 'Leitura de Perfil de Rugosidade', 'instrucao', 'Qualidade', ['8.6'], 'pratica', 'IT-101'),
  st('st_cura', 'Cura e Secagem', 'procedimento', 'Operações', ['8.5.1'], 'pratica', 'PR-105'),
  st('st_inspecao_jateamento', 'Inspeção de Jateamento', 'procedimento', 'Qualidade', ['8.6'], 'pratica', 'PR-106',
    { nota: 'Ref. ABNT NBR 7348.' }),
  st('st_inspecao_pintura', 'Inspeção de Pintura', 'procedimento', 'Qualidade', ['8.6'], 'pratica', 'PR-107',
    { nota: 'Ref. ABNT NBR 12321.' }),
  st('st_it_jateamento', 'Instrução — Equipamento de Jateamento', 'instrucao', 'Operações', ['8.5.1'], 'pratica', 'IT-102'),
  st('st_it_aplicacao', 'Instrução — Equipamento e Preparo de Tinta', 'instrucao', 'Operações', ['8.5.1'], 'pratica', 'IT-103'),
  st('st_it_medicao', 'Instrução — Instrumento de Medição', 'instrucao', 'Qualidade', ['7.1.5'], 'pratica', 'IT-104'),
];

/* ══ MÓDULO ssma — segurança e meio ambiente. Não é ISO 9001; é lei. ═════════════════════════ */

const SSMA = 'ssma';
const ssma = (
  chave: string, titulo: string, categoria: string, clausulas: string[],
  codigoSugerido: string, nota: string,
): DocumentoPadrao => ({
  chave, titulo, natureza: 'procedimento', categoria, clausulas,
  exigencia: 'legal', retencao: 'manter', origem: SSMA, codigoSugerido, nota,
});

const SSMA_DOCS: DocumentoPadrao[] = [
  ssma('ssma_epi', 'Controle de EPI e EPC', 'SSMA', ['7.1.4'], 'PR-201', 'Ref. NR-6. A ISO 9001 só pede ambiente adequado (7.1.4); quem exige o controle de EPI é a NR.'),
  ssma('ssma_residuos', 'Gestão de Resíduos Industriais', 'SSMA', ['8.5.1'], 'PR-202', 'Ref. CONAMA 313. Jateamento gera resíduo de abrasivo e de tinta.'),
  ssma('ssma_quimicos', 'Controle de Produtos Químicos e FISPQ', 'SSMA', ['7.1.4'], 'PR-203', 'Ref. NR-26 e ABNT NBR 14725.'),
];

const TODOS = [...NUCLEO_DOCS, ...SURFACE_TREATMENT, ...SSMA_DOCS];

/* ── Consulta ─────────────────────────────────────────────────────────────────────────────── */

/** O catálogo que vale para uma empresa: o núcleo mais os módulos que ela usa. */
export function catalogoPara(modulos: string[]): DocumentoPadrao[] {
  return TODOS.filter((x) => x.origem === NUCLEO || modulos.includes(x.origem));
}

export function padraoPorChave(chave: string): DocumentoPadrao | null {
  return TODOS.find((x) => x.chave === chave) ?? null;
}

/** Os módulos que o catálogo conhece, fora o núcleo. */
export function modulosDisponiveis(): string[] {
  return [...new Set(TODOS.map((x) => x.origem))].filter((o) => o !== NUCLEO);
}

export { NUCLEO_DOCS, SURFACE_TREATMENT, SSMA_DOCS, TODOS };

/* ── Cobertura ────────────────────────────────────────────────────────────────────────────────
   O que a empresa tem, o que falta e o que sobra, medido contra o padrão. É o diagnóstico que a
   consultoria entrega — e é o mesmo cálculo para qualquer cliente.                              */


export interface Cobertura {
  /** Padrões que a empresa já tem, com os documentos locais que os cumprem.
   *  São VÁRIOS de propósito: o procedimento diz como se faz, o formulário é o registro, a
   *  instrução é o passo a passo na máquina. Os três cumprem o mesmo padrão, e forçar um só
   *  era o que jogava procedimento legítimo para fora. */
  atendidos: { padrao: DocumentoPadrao; locais: DocumentoMestre[] }[];
  /** Padrões sem nenhum documento local. Os de exigência 'norma' são não conformidade. */
  faltando: DocumentoPadrao[];
  /** Documentos locais que não correspondem a nenhum padrão. Nem sempre é problema — pode ser
   *  requisito legal ou do cliente. Mas precisa ser olhado um por um. */
  extras: DocumentoMestre[];
}

export function cobertura(documentos: DocumentoMestre[], modulos: string[]): Cobertura {
  const catalogo = catalogoPara(modulos);
  const porChave = new Map<string, DocumentoMestre[]>();
  for (const doc of documentos) {
    for (const chave of doc.padroes ?? []) {
      porChave.set(chave, [...(porChave.get(chave) ?? []), doc]);
    }
  }

  const atendidos: Cobertura['atendidos'] = [];
  const faltando: DocumentoPadrao[] = [];
  for (const padrao of catalogo) {
    const locais = porChave.get(padrao.chave);
    if (locais?.length) atendidos.push({ padrao, locais });
    else faltando.push(padrao);
  }

  return {
    atendidos,
    faltando,
    extras: documentos.filter((doc) => !doc.padroes?.length && !doc.codigo.startsWith('SEM-CODIGO')),
  };
}

/** Só o que a norma exige e a empresa não tem. É a lista que vira não conformidade em auditoria. */
export function faltasDeNorma(c: Cobertura): DocumentoPadrao[] {
  return c.faltando.filter((x) => x.exigencia === 'norma');
}

/** Quanto do padrão está coberto, de 0 a 1. Null quando o catálogo está vazio. */
export function percentualCoberto(c: Cobertura): number | null {
  const total = c.atendidos.length + c.faltando.length;
  return total === 0 ? null : Math.round((c.atendidos.length / total) * 100) / 100;
}
