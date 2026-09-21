// O QUE É UM INDICADOR — só a forma, sem nenhuma conta.
//
// Mora na plataforma porque o PERFIL DA EMPRESA carrega os indicadores dela: sem o tipo aqui, o
// perfil teria de importar de um módulo, e a seta aponta ao contrário — módulo importa
// plataforma, nunca o inverso.
//
// As contas (resultado, se atingiu a meta, o que não fecha na série) vivem em
// `modules/sgq-indicadores/calculo.ts`, que é de quem instala o módulo.

export type Sentido = 'maior_melhor' | 'menor_melhor';

export interface Indicador {
  chave: string;
  nome: string;
  /** Como o número se lê. 'proporcao' é fração de 0 a 1 mostrada como %. */
  unidade: 'proporcao' | 'percentual_variacao';
  meta: number;
  sentido: Sentido;
  /** O máximo que o indicador PODE valer. Proporção de um subconjunto sobre um total não passa
   *  de 1 — e passar é erro de apuração, não desempenho excepcional. */
  teto?: number;
  numeradorRotulo?: string;
  denominadorRotulo?: string;
  /** Por que este indicador existe, ou de onde sai o número. Vai na tela. */
  nota?: string;
}

export interface Apuracao {
  indicador: string;
  /** 'AAAA-MM'. Mês é o recorte que ela usa, e comparar exige o mesmo recorte sempre. */
  periodo: string;
  numerador?: number;
  denominador?: number;
  /** O resultado como está na planilha de origem. Guardado mesmo quando os componentes existem,
   *  justamente para dar para conferir um contra o outro. */
  naPlanilha?: number;
}

/* ── O resultado, e de onde ele veio ───────────────────────────────────────────────────────── */
