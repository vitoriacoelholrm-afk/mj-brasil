// O QUE A EMPRESA CONTRATOU — e é isto que decide se o sistema é livro ou é ferramenta.
//
// O BraMex se vende de três formas, e elas não são três tamanhos do mesmo produto: são três
// relações diferentes com o documento.
//
//   · AUDITORIA — a consultoria implanta e audita. O sistema é a EVIDÊNCIA: mostra o que a
//     empresa escreveu e assinou, cruza com a norma, aponta o que falta. Ninguém edita o manual
//     do cliente por aqui, e é de propósito: registro escrito por quem confere deixa de ser
//     evidência da empresa e vira evidência de quem conferiu — some a independência da §9.2.
//
//   · GESTÃO — a empresa opera o próprio sistema. Aqui o Coordenador da Qualidade é POSTO DELA,
//     não assento da consultoria, e escrever o manual é o trabalho dele. Travar isso seria
//     vender um sistema da qualidade em que a empresa não pode manter o próprio manual.
//
//   · AUDITORIA + GESTÃO — as duas coisas. É o que a empresa 01 tem.
//
// A confusão que isto desfaz: `coordenacao_qualidade` era um papel só cumprindo dois ofícios —
// o auditor externo e o coordenador interno. Enquanto havia um cliente e a consultoria ocupava o
// posto, os dois coincidiam. Não coincidem mais, e quem os separa é o que foi contratado.

export type ModoDeContratacao = 'auditoria' | 'gestao' | 'auditoria_e_gestao';

export const MODOS: ModoDeContratacao[] = ['auditoria', 'gestao', 'auditoria_e_gestao'];

export const MODO_ROTULO: Record<ModoDeContratacao, string> = {
  auditoria: 'Auditoria',
  gestao: 'Gestão e uso pela empresa',
  auditoria_e_gestao: 'Auditoria + gestão e uso pela empresa',
};

export const MODO_DESCRICAO: Record<ModoDeContratacao, string> = {
  auditoria: 'A consultoria implanta e audita. O sistema apresenta o que a empresa emitiu e aponta o que falta; o documento do cliente não se escreve por aqui.',
  gestao: 'A empresa opera o próprio sistema da qualidade: mantém o manual, os documentos e os registros pela tela.',
  auditoria_e_gestao: 'As duas: a empresa opera o sistema no dia a dia e a consultoria acompanha, audita e aponta o que falta.',
};

/** Verdadeiro quando o contrato inclui a empresa OPERAR o sistema — manter manual, documento e
 *  registro pela tela. É o que abre a escrita. */
export function temGestao(modo: ModoDeContratacao): boolean {
  return modo === 'gestao' || modo === 'auditoria_e_gestao';
}

/** Verdadeiro quando o contrato inclui a consultoria CONFERIR — diagnóstico, achados, o que a
 *  norma pede e ainda não existe. */
export function temAuditoria(modo: ModoDeContratacao): boolean {
  return modo === 'auditoria' || modo === 'auditoria_e_gestao';
}
