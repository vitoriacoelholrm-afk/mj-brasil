// O QUE DA NORMA SE APLICA A ESTA EMPRESA.
//
// A ISO 9001:2015 é a mesma para todo mundo — as 37 cláusulas de `norma.ts` não são de empresa
// nenhuma. O que muda de cliente para cliente é QUAIS DELAS ELE PRECISA ATENDER: a §4.3 manda a
// organização aplicar todos os requisitos que forem aplicáveis dentro do escopo e, quando um não
// for, determinar isso e JUSTIFICAR.
//
// Por isso a não aplicabilidade mora no perfil da empresa e não na norma. Uma empresa que executa
// conforme a especificação do contratante exclui a 8.3; a seguinte pode desenvolver projeto, e aí
// a 8.3 é requisito dela como qualquer outro. Apagar a cláusula da árvore resolveria o primeiro
// cliente e quebraria o segundo — que é o erro que a separação em camadas existe para impedir.
//
// O QUE ISTO NÃO FAZ: não some com a cláusula da tela. A exclusão É informação documentada — a
// norma exige que ela esteja escrita, com a justificativa, disponível ao auditor. Uma cláusula
// excluída aparece dizendo que não se aplica e por quê, e deixa de ser cobrada. Sumir seria
// esconder do auditor justamente a parte que ele vai querer ler.

/** Um requisito da norma que ESTA empresa determinou não ser aplicável.
 *
 *  Os três campos são obrigatórios de propósito. Exclusão sem justificativa é lacuna, não
 *  exclusão; e justificativa que não está em documento nenhum não se apresenta a auditor. */
export interface ExclusaoDeRequisito {
  /** A cláusula, como a norma a numera — '8.3'. Excluir a mãe exclui as filhas. */
  clausula: string;
  /** Por que não se aplica. É o texto que o auditor lê. */
  justificativa: string;
  /** Onde a exclusão está declarada — 'MQ-001 §8.3'. É a informação documentada da §4.3. */
  declaradaEm: string;
  /** Quando a empresa determinou isto. Exclusão é decisão datada: o que hoje não se aplica passa
   *  a se aplicar no dia em que a empresa muda de negócio. */
  desde?: string;
}

/** A exclusão que cobre esta cláusula, ou null quando ela se aplica.
 *
 *  Casa para BAIXO e só para baixo: quem exclui a 8.3 exclui a 8.3.2, porque a filha é parte do
 *  requisito excluído. Não sobe — excluir a 8.3 não exclui a seção 8 — e não pega irmã: '8.30'
 *  não é filha de '8.3', e por isso a comparação usa o ponto. */
export function exclusaoDe(
  ref: string, exclusoes: readonly ExclusaoDeRequisito[] = [],
): ExclusaoDeRequisito | null {
  return exclusoes.find((x) => ref === x.clausula || ref.startsWith(`${x.clausula}.`)) ?? null;
}

/** Verdadeiro quando a cláusula é requisito desta empresa. Sem exclusão declarada, tudo se
 *  aplica — que é o estado de todo cliente novo e o padrão certo: a norma inteira vale até
 *  alguém dizer, por escrito, qual pedaço não vale. */
export function seAplica(ref: string, exclusoes: readonly ExclusaoDeRequisito[] = []): boolean {
  return exclusaoDe(ref, exclusoes) === null;
}

/** Só as cláusulas que esta empresa precisa atender. É esta lista que as contagens usam: contar
 *  uma cláusula excluída como pendência é cobrar da empresa o que ela já declarou não fazer. */
export function aplicaveis<T extends { ref: string }>(
  clausulas: readonly T[], exclusoes: readonly ExclusaoDeRequisito[] = [],
): T[] {
  return clausulas.filter((x) => seAplica(x.ref, exclusoes));
}
