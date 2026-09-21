// AS CONTAS DO INDICADOR — e o que não fecha nelas.
//
// O veredito é calculado, nunca marcado. Um indicador em que alguém digita "atingiu: sim" não é
// indicador, é opinião com um número do lado — e foi exatamente o que apareceu na planilha de
// 2025 quando estas contas rodaram sobre ela pela primeira vez.
import type { Apuracao, Indicador, Sentido } from '@/plataforma/indicadores';
export type { Apuracao, Indicador, Sentido };

/** O resultado que vale: calculado dos componentes quando eles existem, senão o da planilha.
 *  Os componentes ganham porque são o fato; o resultado da planilha é uma conta sobre o fato. */
export function resultado(ap: Apuracao): number | null {
  if (ap.numerador !== undefined && ap.denominador) return ap.numerador / ap.denominador;
  return ap.naPlanilha ?? null;
}

/** Diferença entre o que os componentes dão e o que a planilha registrou. Null quando não dá
 *  para comparar. Tolerância de meio centésimo de ponto percentual, que é arredondamento. */
export function divergencia(ap: Apuracao): number | null {
  if (ap.numerador === undefined || !ap.denominador || ap.naPlanilha === undefined) return null;
  const calculado = ap.numerador / ap.denominador;
  const diferenca = calculado - ap.naPlanilha;
  return Math.abs(diferenca) < 0.00005 ? null : diferenca;
}

/* ── O veredito ────────────────────────────────────────────────────────────────────────────── */

export type Situacao = 'boa' | 'limite' | 'ruim' | 'sem_dado';

/** Bateu a meta? Empate conta como atingido — a meta é o piso, não o que se tem de superar. */
export function atingiu(ind: Indicador, valor: number): boolean {
  return ind.sentido === 'maior_melhor' ? valor >= ind.meta : valor <= ind.meta;
}

/** 'limite' é bater a meta exatamente: atendeu, e não sobra folga nenhuma para o mês que vem.
 *  A planilha dela chama isso de "Requer Atenção", e a distinção é útil o bastante para ficar. */
export function situacao(ind: Indicador, ap: Apuracao): Situacao {
  const valor = resultado(ap);
  if (valor === null) return 'sem_dado';
  if (!atingiu(ind, valor)) return 'ruim';
  return valor === ind.meta ? 'limite' : 'boa';
}

export const ROTULO_SITUACAO: Record<Situacao, string> = {
  boa: 'Objetivo alcançado',
  limite: 'No limite da meta',
  ruim: 'Objetivo não alcançado',
  sem_dado: 'Sem apuração',
};

/* ── O que não fecha ───────────────────────────────────────────────────────────────────────── */

export type TipoProblema = 'acima_do_teto' | 'parte_maior_que_o_todo' | 'conta_nao_bate'
  | 'sem_componentes' | 'serie_interrompida';

export interface Problema {
  tipo: TipoProblema;
  indicador: string;
  periodo?: string;
  detalhe: string;
}

/** Os erros que aparecem dentro de UMA apuração. São de aritmética, não de desempenho: nenhum
 *  deles depende de a empresa ir bem ou mal, e todos impedem o número de servir de evidência. */
export function problemasDaApuracao(ind: Indicador, ap: Apuracao): Problema[] {
  const achados: Problema[] = [];
  const base = { indicador: ind.chave, periodo: ap.periodo };
  const valor = resultado(ap);

  if (ap.numerador !== undefined && ap.denominador !== undefined
      && ap.numerador > ap.denominador && ind.teto === 1) {
    achados.push({ ...base, tipo: 'parte_maior_que_o_todo',
      detalhe: `${ind.numeradorRotulo}: ${ap.numerador}; ${ind.denominadorRotulo}: ${ap.denominador}. A parte não pode ser maior que o todo.` });
  }

  if (valor !== null && ind.teto !== undefined && valor > ind.teto) {
    achados.push({ ...base, tipo: 'acima_do_teto',
      detalhe: `${(valor * 100).toFixed(1)}% num indicador que não passa de ${ind.teto * 100}%.` });
  }

  const dif = divergencia(ap);
  if (dif !== null) {
    achados.push({ ...base, tipo: 'conta_nao_bate',
      detalhe: `Os componentes dão ${((ap.numerador! / ap.denominador!) * 100).toFixed(2)}% e a planilha registrou ${(ap.naPlanilha! * 100).toFixed(2)}%.` });
  }

  return achados;
}

/** Os erros que só aparecem olhando a SÉRIE: um indicador que parou de ser apurado no meio do
 *  ano continua com cara de saudável, porque o último número dele foi bom. */
export function problemasDaSerie(ind: Indicador, apuracoes: Apuracao[], ate: string): Problema[] {
  const minhas = apuracoes.filter((a) => a.indicador === ind.chave);
  const achados: Problema[] = [];

  // A planilha declara de que conta o indicador sai e não guarda os dois números: fica só o
  // resultado, digitado. Quem auditar não tem como refazer a conta, e quem apurar no mês que
  // vem não tem como apurar igual.
  if (ind.numeradorRotulo && minhas.length && minhas.every((a) => a.numerador === undefined)) {
    achados.push({ tipo: 'sem_componentes', indicador: ind.chave,
      detalhe: `Declara sair de ${ind.numeradorRotulo.toLowerCase()} sobre ${(ind.denominadorRotulo ?? 'um total').toLowerCase()}, mas só o resultado foi registrado.` });
  }

  const periodosDele = minhas.map((a) => a.periodo).sort();
  if (!periodosDele.length) return achados;
  const ultimo = periodosDele[periodosDele.length - 1];
  if (ultimo >= ate) return achados;
  achados.push({ tipo: 'serie_interrompida', indicador: ind.chave,
    detalhe: `Apurado até ${ultimo}; os demais indicadores vão até ${ate}.` });
  return achados;
}

/** Tudo que não fecha, no conjunto inteiro. `ate` é o período mais recente apurado na casa. */
export function problemas(indicadores: Indicador[], apuracoes: Apuracao[]): Problema[] {
  const periodos = apuracoes.map((a) => a.periodo).sort();
  const ate = periodos[periodos.length - 1] ?? '';
  const porChave = new Map(indicadores.map((i) => [i.chave, i]));
  const achados: Problema[] = [];

  for (const ap of apuracoes) {
    const ind = porChave.get(ap.indicador);
    if (ind) achados.push(...problemasDaApuracao(ind, ap));
  }
  for (const ind of indicadores) achados.push(...problemasDaSerie(ind, apuracoes, ate));

  return achados;
}

/* ── Duas séries que andam idênticas ───────────────────────────────────────────────────────── */

/** Indicadores diferentes com a MESMA série, mês a mês. Não é erro por si: pode ser coincidência
 *  num mês. Em sete, não é — ou uma aba copia a outra, ou os dois medem a mesma coisa com nomes
 *  diferentes, e a direção acha que está olhando dois sinais quando está olhando um. */
export function seriesIguais(indicadores: Indicador[], apuracoes: Apuracao[], minimo = 4): [string, string][] {
  const serie = (chave: string) => apuracoes
    .filter((a) => a.indicador === chave)
    .sort((x, y) => x.periodo.localeCompare(y.periodo))
    .map((a) => `${a.periodo}:${resultado(a)}`);

  const pares: [string, string][] = [];
  for (let i = 0; i < indicadores.length; i++) {
    for (let j = i + 1; j < indicadores.length; j++) {
      const a = serie(indicadores[i].chave);
      const b = serie(indicadores[j].chave);
      // Série constante não diz nada: dois indicadores zerados o ano inteiro são dois
      // indicadores zerados, não uma aba copiando a outra. Só conta quando o desenho varia.
      const varia = new Set(a.map((x) => x.split(":")[1])).size > 1;
      if (varia && a.length >= minimo && a.length === b.length && a.every((v, k) => v === b[k])) {
        pares.push([indicadores[i].chave, indicadores[j].chave]);
      }
    }
  }
  return pares;
}

/* ── Leitura ───────────────────────────────────────────────────────────────────────────────── */

export function ultimaApuracao(chave: string, apuracoes: Apuracao[]): Apuracao | null {
  const minhas = apuracoes.filter((a) => a.indicador === chave)
    .sort((x, y) => x.periodo.localeCompare(y.periodo));
  return minhas[minhas.length - 1] ?? null;
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function nomeDoPeriodo(periodo: string): string {
  const [ano, mes] = periodo.split('-');
  return `${MESES[+mes - 1]} de ${ano}`;
}

export function comoTexto(ind: Indicador, valor: number | null): string {
  if (valor === null) return '—';
  if (ind.unidade === 'percentual_variacao') {
    return `${valor >= 0 ? '+' : ''}${(valor * 100).toFixed(1)}%`;
  }
  return `${(valor * 100).toFixed(1)}%`;
}
