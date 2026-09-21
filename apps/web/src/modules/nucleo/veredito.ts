// O VEREDITO DA HOME — a regra por trás de "estamos em dia?".
//
// Sai da tela porque é a única coisa naquela página que pode MENTIR, e mentira aqui é cara: a
// home é o que alguém olha de relance antes de decidir não ir olhar mais nada.
//
// TRÊS ESTADOS, E O TERCEIRO É O QUE FALTAVA
//
// Em dia, com atenção, e SEM LEITURA. Antes eram dois, e o erro devolvia a tela inteira como uma
// faixa vermelha — a home sumia junto com o que não depende do banco.
//
// O conserto ingênuo seria só deixar a tela desenhar. Não serve: a contagem de itens em atenção é
// zero quando não há dado, e o veredito passaria a anunciar "Estamos em dia" exatamente quando não
// sabe de nada. Num sistema da qualidade, dizer que está tudo certo sem ter lido é pior do que não
// dizer nada — silêncio manda conferir, e afirmação manda ir embora.

export type Veredito = 'em_dia' | 'atencao' | 'sem_leitura';

export interface ContagemDeVencimentos {
  expired?: number;
  d7?: number;
  d15?: number;
  d30?: number;
  later?: number;
}

/** Quantos itens pedem atenção: vencidos e os que vencem em até 30 dias. `later` fica de fora —
 *  é o que está controlado e em dia, que é o caso da maioria. */
export function quantosEmAtencao(cont: ContagemDeVencimentos): number {
  return (cont.expired ?? 0) + (cont.d7 ?? 0) + (cont.d15 ?? 0) + (cont.d30 ?? 0);
}

/** O veredito. `erro` vence qualquer contagem: sem leitura não há o que afirmar. */
export function vereditoDe(erro: string | null | undefined, cont: ContagemDeVencimentos): Veredito {
  if (erro) return 'sem_leitura';
  return quantosEmAtencao(cont) === 0 ? 'em_dia' : 'atencao';
}

/** A falha em português, para quem não escreve software.
 *
 *  A mensagem crua do navegador — "Unexpected token '<', "<!doctype"... is not valid JSON" — é
 *  exata e não diz nada a quem usa. Ela continua à vista embaixo, porque quem vai consertar
 *  precisa dela; o que muda é que agora vem uma frase antes.
 */
export function motivoLegivel(erro: string): string {
  if (/not valid JSON|Unexpected token|SyntaxError/i.test(erro)) {
    return 'O endereço respondeu, mas não com dado — normalmente quer dizer que não há servidor por trás desta página.';
  }
  if (/Failed to fetch|NetworkError|ERR_|ECONNREFUSED|timeout/i.test(erro)) {
    return 'O servidor não respondeu.';
  }
  if (/UNAUTHORIZED|no active membership|FORBIDDEN/i.test(erro)) {
    return 'O servidor não aceitou esta sessão.';
  }
  return 'O banco não pôde ser lido.';
}
