// O FEITIO DO MENU — o que cada papel tem NA FRENTE, que não é a mesma coisa que o que ele PODE.
//
// Até aqui o menu era a permissão desenhada: tudo que o papel enxerga virava item de coluna. Deu
// quinze itens para quem usa três. A decisão dela em 21/09/2026 foi outra: "deixar ativo no login
// do usuário apenas o que ele vai usar".
//
// SÃO DUAS RÉGUAS DIFERENTES, e confundi-las é o erro caro:
//   · PERMISSÃO é norma — quem pode abrir e quem pode escrever. Mexer nela muda a evidência de
//     auditoria, e é `acesso.ts`.
//   · MENU é ofício — o que a pessoa faz no dia. Mexer aqui não tira acesso de ninguém: a rota
//     continua existindo e continua resolvendo. Some o atalho, não a porta.
//
// É por isso que este arquivo não decide nada sobre poder. Ele reordena, esconde e junta o que a
// permissão já liberou. Quem não tem permissão nem chega aqui.
import type { Papel } from './acesso';
import type { Modulo, Rota } from './modulo';

/** Um item de menu que abre uma LISTA de telas, em vez de uma tela.
 *
 *  Existe para o que a pessoa consulta sem usar todo dia. Manual e lista mestra, para quem executa
 *  o serviço, são isso: ele não abre de manhã, abre quando precisa achar um procedimento. Como
 *  itens soltos, ocupam duas linhas da coluna todos os dias para servir uma vez por semana.
 *
 *  Custa um clique a mais e não custa acesso nenhum. */
export interface PortaDeMenu {
  /** A rota da própria porta. Não é de módulo nenhum: ela só existe no menu. */
  rota: Rota;
  rotulo: string;
  /** Uma linha dizendo o que há atrás dela. */
  sub: string;
  /** As telas que ela abre, na ordem em que aparecem. */
  telas: Rota[];
}

/** O feitio do menu de um papel: o que sai da frente, o que se junta, e em que ordem. */
export interface FeitioDeMenu {
  /** Rotas que somem da coluna. Continuam alcançáveis — pela porta, ou por quem tiver o endereço.
   *
   *  A regra para entrar nesta lista é uma só: a pessoa NÃO PREENCHE aquilo e não o consulta na
   *  rotina. Tela que ela preenche nunca sai. */
  fora?: Rota[];
  porta?: PortaDeMenu;
  /** A ordem dos domínios, de cima para baixo. Domínio que não estiver aqui vai para o fim, na
   *  ordem em que o registro dos módulos o declarou. A porta fica sempre por último: é consulta. */
  ordem?: string[];
}

/** O feitio de cada papel. Papel que não estiver aqui usa o menu inteiro, como sempre foi.
 *
 *  Acrescentar um papel aqui é uma decisão DELA, tela a tela — não é ajuste de desenho. A matriz
 *  onde ela marca vive fora do código. */
export const FEITIO: Partial<Record<Papel, FeitioDeMenu>> = {
  // EXECUÇÃO E INSPEÇÃO — aprovado por ela em 21/09/2026, olhando o menu de hoje ao lado da
  // proposta. Quinze itens viraram onze.
  //
  // Os três que saem são do APOIO desde hoje de manhã: comunicação, satisfação do cliente e
  // indicadores. Quem executa o serviço abre, olha e não pode escrever — três portas que só
  // servem para ele se perder. Não perdeu acesso: se precisar mostrar o número a alguém, a rota
  // responde.
  //
  // A ordem mudou junto, e por um motivo simples: o dia dele começa na ordem de serviço, e ela
  // era o segundo item porque o registro dos módulos põe o manual primeiro. Menu é ofício.
  inspecao: {
    fora: ['comunicacao', 'satisfacao', 'indicadores'],
    porta: {
      rota: 'documentos',
      rotulo: 'Documentos',
      sub: 'O manual do sistema e a lista mestra — o que consultar quando precisar achar um procedimento.',
      telas: ['manual', 'lista-mestra'],
    },
    ordem: ['Ordens de Serviço', 'Registros', 'Monitoramento', 'Cadastros'],
  },
};

export const feitioDe = (papel: Papel): FeitioDeMenu => FEITIO[papel] ?? {};

/** Verdadeiro quando esta rota sai da coluna para este papel — por estar fora ou por estar atrás
 *  de uma porta. Não diz nada sobre poder abrir: isso é `acesso.ts`. */
export function foraDaColuna(papel: Papel, rota: Rota): boolean {
  const f = feitioDe(papel);
  return (f.fora?.includes(rota) ?? false) || (f.porta?.telas.includes(rota) ?? false);
}

/** Uma seção da coluna: o rótulo do domínio e as telas que sobraram nele. */
export interface GrupoDeMenu {
  rotulo: string;
  telas: Modulo['telas'];
}

/** A COLUNA DESTE PAPEL, montada: os domínios com o feitio aplicado, na ordem do ofício dele.
 *
 *  Recebe os módulos que ele JÁ ENXERGA — o corte de permissão aconteceu antes, em
 *  `modulosVisiveis`. Aqui não se decide poder, se decide o que fica na frente.
 *
 *  Domínio que fica sem tela SOME: título vazio anuncia alguma coisa e não entrega nada. */
export function colunaDe(modulos: Modulo[], papel: Papel): GrupoDeMenu[] {
  const ordem: string[] = [];
  const por = new Map<string, Modulo['telas']>();
  for (const m of modulos) {
    const telas = m.telas.filter((t) => !foraDaColuna(papel, t.rota));
    if (!telas.length) continue;
    if (!por.has(m.dominio)) { por.set(m.dominio, []); ordem.push(m.dominio); }
    por.get(m.dominio)!.push(...telas);
  }
  const pedida = feitioDe(papel).ordem ?? [];
  // Domínio não pedido vai para o fim, na ordem em que o registro dos módulos o declarou — o
  // `sort` do JS é estável, então empate preserva a ordem de entrada.
  ordem.sort((a, b) => posicao(pedida, a) - posicao(pedida, b));
  return ordem.map((rotulo) => ({ rotulo, telas: por.get(rotulo)! }));
}

const posicao = (pedida: string[], dominio: string) => {
  const i = pedida.indexOf(dominio);
  return i === -1 ? pedida.length : i;
};
