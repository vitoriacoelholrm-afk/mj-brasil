// A NÃO CONFORMIDADE DEPOIS DE REGISTRADA.
//
// Registrar a NC é a §8.7.2 — o que se fez com a PEÇA. Não deixar acontecer de novo é a §10.2.2,
// e é outro assunto: causa, ação corretiva e verificação de que a ação funcionou.
//
// O formulário não exige a segunda parte na hora de abrir, de propósito: obrigar a escrever a
// causa no momento em que a peça ainda está na bancada faz a pessoa inventar uma para conseguir
// salvar. Mas o que não é exigido na hora tem de ser cobrado depois, senão nunca acontece — e o
// achado de auditoria não é "faltou o campo", é "a empresa registra não conformidade e não trata".
//
// Por isso a conta mora aqui: é ela que o painel mostra, e é calculada, não marcada.
import type { Registro } from './formularios';

const vazio = (v: string | undefined) => !v || v.trim() === '';

/** O que falta para a 10.2.2 estar cumprida neste registro. Lista vazia = fechada. */
export function faltaNaTratativa(r: Registro): string[] {
  const v = r.valores;
  const falta: string[] = [];
  if (vazio(v.causa)) falta.push('a causa');
  if (vazio(v.acaoCorretiva)) falta.push('a ação corretiva');
  // Ação escrita e não verificada é ação que ninguém sabe se funcionou. A norma pede a análise
  // da eficácia, não a execução.
  if (vazio(v.eficaciaVerificadaPor)) falta.push('a verificação da eficácia');
  return falta;
}

export const semTratativa = (r: Registro) => faltaNaTratativa(r).length > 0;

/** O veredito do painel: quantas foram registradas e quantas ainda não foram tratadas. */
export function resumoDasNcs(registros: Registro[]) {
  const abertas = registros.filter(semTratativa);
  return {
    total: registros.length,
    semTratativa: abertas.length,
    /** A mais antiga sem tratativa — é por ela que o auditor começa. */
    maisAntiga: abertas.length ? abertas[abertas.length - 1] : null,
  };
}
