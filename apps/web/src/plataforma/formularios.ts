// O MOTOR DE FORMULÁRIOS — o que um formulário É, e as contas sobre ele.
//
// Nenhuma definição mora aqui. A plataforma sabe DESENHAR qualquer formulário declarado; quais
// existem é cada módulo que diz, na pasta dele. Foi o que permitiu a portaria nascer sem tocar
// neste arquivo — e é o que permite o formulário do próximo cliente nascer do mesmo jeito.
//
// A escolha de declarar os campos em vez de escrever uma tela por formulário: digitalizar um
// formulário é acrescentar uma definição, não escrever uma tela. Era o que ela pediu lá atrás —
// "precisamos ter todos esses formulários dentro do aplicativo".
import type { PapelDeFormulario } from './empresa';
import type { Setor } from './acesso';
import { quantasFotos, type Anexo } from './anexos';

export type TipoCampo = 'texto' | 'texto_longo' | 'data' | 'hora' | 'escolha' | 'pessoa' | 'sim_nao';

export interface CampoDef {
  chave: string;
  rotulo: string;
  tipo: TipoCampo;
  opcoes?: string[];
  /** Sem ele o registro não fecha. A norma manda, não é preferência de tela. */
  obrigatorio?: boolean;
  /** Uma frase curta de ajuda, para quem preenche não ter de adivinhar. */
  ajuda?: string;
  /** Só aparece quando outro campo tem certo valor — ou um de vários.
   *
   *  A lista existe porque a mesma pergunta costuma valer para opções diferentes: peça do
   *  cliente e insumo do cliente são coisas distintas na carga e a mesma coisa na norma. */
  dependeDe?: { campo: string; valor: string | string[] };
  /** O que o sistema já sabe e por isso não deveria perguntar. Vale no registro novo, e a
   *  pessoa continua podendo corrigir.
   *
   *  Não é conveniência: um horário digitado é o horário de que alguém se lembrou, e num posto
   *  onde se registra carga atrás de carga a diferença aparece. O relógio responde sozinho. */
  preenchidoCom?: 'hoje' | 'agora' | 'quem_registra';
}

export interface FormularioDef {
  papel: PapelDeFormulario;
  /** A que setor este registro pertence. É o que decide quem preenche: a ficha de
   *  treinamento é do RH, a ocorrência com peça de cliente é de quem toca a ordem. */
  setor: Setor;
  titulo: string;
  clausula: string;
  /** Por que este formulário existe, em uma frase. Vai no topo da tela. */
  explicacao: string;
  campos: CampoDef[];
  /** Quando o registro precisa de foto ou arquivo junto. `minimoDeFotos` trava o registro
   *  do mesmo jeito que um campo obrigatório: há fato que texto nenhum prova. */
  anexos?: { titulo: string; vazio: string; minimoDeFotos?: number };
}

/* ── O registro preenchido ─────────────────────────────────────────────────────────────────── */

export type Valores = Record<string, string>;

export interface Registro {
  id: string;
  papel: PapelDeFormulario;
  /** O sequencial dentro do formulário e do ano, atribuído pelo banco na gravação. Null só em
   *  registro antigo que nunca foi numerado — a tela mostra assim em vez de inventar um número. */
  numero: number | null;
  ano: number | null;
  valores: Valores;
  anexos: Anexo[];
  criadoEm: string;
  criadoPor: string | null;
}

/** A identificação citável de um registro: "FM-010 nº 003/2026".
 *
 *  É o que o auditor pede — "me mostra o RNC 05" — e é o que se escreve num plano de ação, numa
 *  ata de análise crítica ou num e-mail ao cliente. O uuid identifica a linha no banco e não serve
 *  para nada disso: ninguém cita um uuid, e ninguém o confere numa pasta.
 *
 *  O código é da EMPRESA e entra por fora: a plataforma não sabe qual código cada cliente deu ao
 *  formulário, e não pode saber. Sem código, devolve só o número, que continua identificando. */
export function identificacaoDo(registro: Registro, codigo?: string | null): string {
  if (registro.numero === null || registro.ano === null) return codigo ?? 'sem número';
  const n = `nº ${String(registro.numero).padStart(3, '0')}/${registro.ano}`;
  return codigo ? `${codigo} ${n}` : n;
}

/** A data de hoje pelo relógio de quem está usando, no formato que o campo de data entende. */
export function hojeLocal(): string {
  const agora = new Date();
  const doisDigitos = (n: number) => String(n).padStart(2, '0');
  return [agora.getFullYear(), doisDigitos(agora.getMonth() + 1), doisDigitos(agora.getDate())].join('-');
}

/** O rascunho já nasce com o que o sistema sabe: data, hora e quem está registrando.
 *
 *  A data sai do relógio LOCAL, e não de `toISOString()`. No fuso daqui, às nove da noite o
 *  horário universal já é o dia seguinte — o registro sairia com a data de amanhã, e o erro só
 *  apareceria meses depois, numa auditoria, como carga que entrou antes de existir. */
export function valoresIniciais(def: FormularioDef, quem: string | null): Valores {
  const agora = new Date();
  const doisDigitos = (n: number) => String(n).padStart(2, '0');
  const hoje = hojeLocal();
  const hora = `${doisDigitos(agora.getHours())}:${doisDigitos(agora.getMinutes())}`;

  const valores: Valores = {};
  for (const campo of def.campos) {
    const pronto = campo.preenchidoCom === 'hoje' ? hoje
      : campo.preenchidoCom === 'agora' ? hora
      : campo.preenchidoCom === 'quem_registra' ? quem
      : null;
    if (pronto) valores[campo.chave] = pronto;
  }
  return valores;
}

/** Um campo só conta quando a condição dele está satisfeita. */
export function campoVisivel(campo: CampoDef, valores: Valores): boolean {
  if (!campo.dependeDe) return true;
  const { campo: pai, valor } = campo.dependeDe;
  const aceitos = Array.isArray(valor) ? valor : [valor];
  return aceitos.includes(valores[pai]);
}

/** Falta foto? Devolve a frase, ou null. Fica junto das pendências de campo porque é a mesma
 *  ideia: o registro não fecha enquanto não prova o que se propôs a provar. */
export function faltaFoto(def: FormularioDef, anexos: Anexo[]): string | null {
  const minimo = def.anexos?.minimoDeFotos ?? 0;
  if (!minimo) return null;
  const tem = quantasFotos(anexos);
  if (tem >= minimo) return null;
  return minimo === 1
    ? 'Falta a foto: este registro não fecha sem ela.'
    : `Faltam fotos: ${tem} de ${minimo}.`;
}

/** Quais obrigatórios ainda estão vazios. Vazio = o registro pode fechar. */
export function pendencias(def: FormularioDef, valores: Valores): CampoDef[] {
  return def.campos.filter(
    (c) => c.obrigatorio && campoVisivel(c, valores) && !valores[c.chave]?.trim(),
  );
}

/** Uma linha curta para a lista, montada dos primeiros campos preenchidos.
 *
 *  Data e hora ficam de fora: a lista já mostra a data em coluna própria, e um registro que
 *  começa pelo relógio gastaria as três vagas dizendo quando — quando é o que menos identifica.
 *  O que se procura numa linha é de quem era a carga, que peça era, qual o período. */
export function resumoDoRegistro(def: FormularioDef, valores: Valores): string {
  return def.campos
    .filter((c) => c.tipo !== 'texto_longo' && c.tipo !== 'data' && c.tipo !== 'hora')
    .filter((c) => valores[c.chave]?.trim())
    .slice(0, 3)
    .map((c) => valores[c.chave])
    .join(' · ');
}
