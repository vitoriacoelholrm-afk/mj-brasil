// O diagnóstico documental da Minasjato — rascunho de 16/09/2026, aguardando revisão da Vitória.
//
// LIMITE: montado lendo documentos, sem visita e sem entrevista. 19 das 37 cláusulas entram como
// NÃO AVALIADAS (avaliacao: null) em vez de "parcial" — uma cláusula pode estar plenamente
// atendida na prática com documentação fraca, e o contrário também.
import type { ItemParaGap } from './regras';

export const ITENS_MINASJATO: ItemParaGap[] = [
  // ── 4. Contexto ────────────────────────────────────────────────────────────────────────────
  { clausulaRef: '4.1', clausulaTitulo: 'Entendendo a organização e seu contexto', avaliacao: 'atende_parcial' },
  { clausulaRef: '4.2', clausulaTitulo: 'Necessidades e expectativas de partes interessadas', avaliacao: null },
  { clausulaRef: '4.3', clausulaTitulo: 'Determinando o escopo do SGQ', avaliacao: 'atende_parcial', peso: 'alto' },
  { clausulaRef: '4.4', clausulaTitulo: 'SGQ e seus processos', avaliacao: 'atende' },

  // ── 5. Liderança ───────────────────────────────────────────────────────────────────────────
  { clausulaRef: '5.1', clausulaTitulo: 'Liderança e comprometimento', avaliacao: null },
  { clausulaRef: '5.2', clausulaTitulo: 'Política da qualidade', avaliacao: 'atende' },
  { clausulaRef: '5.3', clausulaTitulo: 'Papéis, responsabilidades e autoridades', avaliacao: 'atende_parcial' },

  // ── 6. Planejamento ────────────────────────────────────────────────────────────────────────
  { clausulaRef: '6.1', clausulaTitulo: 'Ações para abordar riscos e oportunidades', avaliacao: 'atende_parcial' },
  { clausulaRef: '6.2', clausulaTitulo: 'Objetivos da qualidade e planejamento', avaliacao: 'atende_parcial' },
  { clausulaRef: '6.3', clausulaTitulo: 'Planejamento de mudanças', avaliacao: null },

  // ── 7. Apoio ───────────────────────────────────────────────────────────────────────────────
  { clausulaRef: '7.1', clausulaTitulo: 'Recursos, pessoas, infraestrutura e ambiente', avaliacao: 'atende' },
  { clausulaRef: '7.1.5', clausulaTitulo: 'Recursos de monitoramento e medição', avaliacao: 'atende_parcial', peso: 'alto' },
  { clausulaRef: '7.1.6', clausulaTitulo: 'Conhecimento organizacional', avaliacao: null },
  { clausulaRef: '7.2', clausulaTitulo: 'Competência', avaliacao: 'atende_parcial' },
  { clausulaRef: '7.3', clausulaTitulo: 'Conscientização', avaliacao: null },
  { clausulaRef: '7.4', clausulaTitulo: 'Comunicação', avaliacao: null },
  { clausulaRef: '7.5', clausulaTitulo: 'Informação documentada', avaliacao: 'nao_atende', peso: 'alto' },

  // ── 8. Operação ────────────────────────────────────────────────────────────────────────────
  { clausulaRef: '8.1', clausulaTitulo: 'Planejamento e controle operacionais', avaliacao: null },
  { clausulaRef: '8.2', clausulaTitulo: 'Requisitos para produtos e serviços', avaliacao: null },
  { clausulaRef: '8.3', clausulaTitulo: 'Projeto e desenvolvimento', avaliacao: 'nao_aplicavel',
    justificativaNa: 'A Minasjato não desenvolve especificações de pintura; executa conforme requisitos definidos pelo contratante. Exclusão declarada no Manual do SGQ §8.3.' },
  { clausulaRef: '8.4', clausulaTitulo: 'Controle de processos e provedores externos', avaliacao: null },
  { clausulaRef: '8.5.1', clausulaTitulo: 'Controle de produção e provisão de serviço', avaliacao: 'atende' },
  { clausulaRef: '8.5.2', clausulaTitulo: 'Identificação e rastreabilidade', avaliacao: 'atende_parcial', peso: 'alto' },
  { clausulaRef: '8.5.3', clausulaTitulo: 'Propriedade de clientes ou provedores externos', avaliacao: null },
  { clausulaRef: '8.5.4', clausulaTitulo: 'Preservação', avaliacao: null },
  { clausulaRef: '8.5.5', clausulaTitulo: 'Atividades pós-entrega', avaliacao: null },
  { clausulaRef: '8.5.6', clausulaTitulo: 'Controle de mudanças', avaliacao: null },
  { clausulaRef: '8.6', clausulaTitulo: 'Liberação de produtos e serviços', avaliacao: 'atende_parcial' },
  { clausulaRef: '8.7', clausulaTitulo: 'Controle de saídas não conformes', avaliacao: 'atende_parcial' },

  // ── 9. Avaliação de desempenho ─────────────────────────────────────────────────────────────
  { clausulaRef: '9.1.1', clausulaTitulo: 'Monitoramento e medição — generalidades', avaliacao: null },
  { clausulaRef: '9.1.2', clausulaTitulo: 'Satisfação do cliente', avaliacao: null },
  { clausulaRef: '9.1.3', clausulaTitulo: 'Análise e avaliação', avaliacao: 'nao_atende' },
  { clausulaRef: '9.2', clausulaTitulo: 'Auditoria interna', avaliacao: 'nao_atende', peso: 'alto' },
  { clausulaRef: '9.3', clausulaTitulo: 'Análise crítica pela direção', avaliacao: null },

  // ── 10. Melhoria ───────────────────────────────────────────────────────────────────────────
  { clausulaRef: '10.1', clausulaTitulo: 'Melhoria — generalidades', avaliacao: null },
  { clausulaRef: '10.2', clausulaTitulo: 'Não conformidade e ação corretiva', avaliacao: null },
  { clausulaRef: '10.3', clausulaTitulo: 'Melhoria contínua', avaliacao: null },
];
