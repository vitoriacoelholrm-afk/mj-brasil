// A ISO 9001:2015, em árvore.
//
// As sete seções e as cláusulas de cada uma. Isto não é de empresa nenhuma: a 8.5.3 se chama
// "Propriedade de clientes ou provedores externos" em qualquer certificado do mundo. Estava
// escondido dentro do diagnóstico de um cliente, misturado com a avaliação dele — o título da
// cláusula é da norma, a nota é da empresa, e os dois moravam na mesma linha.
//
// As seções 1, 2 e 3 (escopo, referências e termos) ficam de fora de propósito: não são
// requisitos, não se auditam e não geram documento. O sistema começa na 4.
export interface Secao {
  numero: string;
  titulo: string;
  /** O que a seção cobra, em uma frase — é o que a tela mostra antes de abrir a lista. */
  resumo: string;
}

export interface ClausulaDaNorma {
  ref: string;
  titulo: string;
  secao: string;
}

export const SECOES: Secao[] = [
  { numero: '4', titulo: 'Contexto da organização', resumo: 'Quem é a empresa, para quem trabalha, o que entra no sistema e como os processos se ligam.' },
  { numero: '5', titulo: 'Liderança', resumo: 'O que a direção assume, a política que ela assina e quem responde por quê.' },
  { numero: '6', titulo: 'Planejamento', resumo: 'Riscos, objetivos e como se muda o sistema sem quebrá-lo.' },
  { numero: '7', titulo: 'Apoio', resumo: 'Pessoas, equipamentos, competência, comunicação e o controle dos documentos.' },
  { numero: '8', titulo: 'Operação', resumo: 'O serviço em si: o que o cliente pediu, como se produz, como se libera e o que se faz quando sai errado.' },
  { numero: '9', titulo: 'Avaliação de desempenho', resumo: 'Medir, auditar e a direção olhar o conjunto.' },
  { numero: '10', titulo: 'Melhoria', resumo: 'Tratar a não conformidade para não repetir, e melhorar o que já funciona.' },
];

export const CLAUSULAS: ClausulaDaNorma[] = [
  { ref: '4.1', titulo: 'Entendendo a organização e seu contexto', secao: '4' },
  { ref: '4.2', titulo: 'Necessidades e expectativas de partes interessadas', secao: '4' },
  { ref: '4.3', titulo: 'Determinando o escopo do SGQ', secao: '4' },
  { ref: '4.4', titulo: 'SGQ e seus processos', secao: '4' },

  { ref: '5.1', titulo: 'Liderança e comprometimento', secao: '5' },
  { ref: '5.2', titulo: 'Política da qualidade', secao: '5' },
  { ref: '5.3', titulo: 'Papéis, responsabilidades e autoridades', secao: '5' },

  { ref: '6.1', titulo: 'Ações para abordar riscos e oportunidades', secao: '6' },
  { ref: '6.2', titulo: 'Objetivos da qualidade e planejamento', secao: '6' },
  { ref: '6.3', titulo: 'Planejamento de mudanças', secao: '6' },

  { ref: '7.1', titulo: 'Recursos, pessoas, infraestrutura e ambiente', secao: '7' },
  { ref: '7.1.5', titulo: 'Recursos de monitoramento e medição', secao: '7' },
  { ref: '7.1.6', titulo: 'Conhecimento organizacional', secao: '7' },
  { ref: '7.2', titulo: 'Competência', secao: '7' },
  { ref: '7.3', titulo: 'Conscientização', secao: '7' },
  { ref: '7.4', titulo: 'Comunicação', secao: '7' },
  { ref: '7.5', titulo: 'Informação documentada', secao: '7' },

  { ref: '8.1', titulo: 'Planejamento e controle operacionais', secao: '8' },
  { ref: '8.2', titulo: 'Requisitos para produtos e serviços', secao: '8' },
  { ref: '8.3', titulo: 'Projeto e desenvolvimento', secao: '8' },
  { ref: '8.4', titulo: 'Controle de processos e provedores externos', secao: '8' },
  { ref: '8.5.1', titulo: 'Controle de produção e provisão de serviço', secao: '8' },
  { ref: '8.5.2', titulo: 'Identificação e rastreabilidade', secao: '8' },
  { ref: '8.5.3', titulo: 'Propriedade de clientes ou provedores externos', secao: '8' },
  { ref: '8.5.4', titulo: 'Preservação', secao: '8' },
  { ref: '8.5.5', titulo: 'Atividades pós-entrega', secao: '8' },
  { ref: '8.5.6', titulo: 'Controle de mudanças', secao: '8' },
  { ref: '8.6', titulo: 'Liberação de produtos e serviços', secao: '8' },
  { ref: '8.7', titulo: 'Controle de saídas não conformes', secao: '8' },

  { ref: '9.1.1', titulo: 'Monitoramento e medição — generalidades', secao: '9' },
  { ref: '9.1.2', titulo: 'Satisfação do cliente', secao: '9' },
  { ref: '9.1.3', titulo: 'Análise e avaliação', secao: '9' },
  { ref: '9.2', titulo: 'Auditoria interna', secao: '9' },
  { ref: '9.3', titulo: 'Análise crítica pela direção', secao: '9' },

  { ref: '10.1', titulo: 'Melhoria — generalidades', secao: '10' },
  { ref: '10.2', titulo: 'Não conformidade e ação corretiva', secao: '10' },
  { ref: '10.3', titulo: 'Melhoria contínua', secao: '10' },
];

export const clausulaPorRef = (ref: string): ClausulaDaNorma | null =>
  CLAUSULAS.find((x) => x.ref === ref) ?? null;

export const clausulasDaSecao = (secao: string): ClausulaDaNorma[] =>
  CLAUSULAS.filter((x) => x.secao === secao);

/** Tira as referências de um texto livre.
 *
 *  Existe porque um formulário declara a cláusula como o auditor fala: "8.7.2 e 10.2.2",
 *  "8.5.3 e 8.5.4". São duas cláusulas numa frase, e sem separá-las o manual acharia zero. */
export function refsNoTexto(texto: string): string[] {
  return texto.match(/\d+(?:\.\d+)*/g) ?? [];
}

/** A cláusula da norma a que uma referência pertence — ou null quando não pertence a nenhuma.
 *
 *  Vale a MAIS ESPECÍFICA que couber: `9.1.1` cai em 9.1.1, que existe na árvore; `8.7.2` cai em
 *  8.7, porque a norma não desdobra o 8.7 na lista de requisitos. Pegar sempre a raiz jogaria a
 *  satisfação do cliente (9.1.2) no mesmo balde da medição, e são coisas diferentes. */
export function clausulaDe(ref: string): ClausulaDaNorma | null {
  let melhor: ClausulaDaNorma | null = null;
  for (const c of CLAUSULAS) {
    if (ref !== c.ref && !ref.startsWith(`${c.ref}.`)) continue;
    if (!melhor || c.ref.length > melhor.ref.length) melhor = c;
  }
  return melhor;
}

/** Verdadeiro quando um texto de cláusula (de documento ou formulário) toca esta cláusula. */
export function tocaClausula(texto: string, ref: string): boolean {
  return refsNoTexto(texto).some((r) => clausulaDe(r)?.ref === ref);
}
