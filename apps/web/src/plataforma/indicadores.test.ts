// Os indicadores do SGQ.
//
// A primeira metade testa o motor com indicadores inventados. A segunda passa o motor nos
// números reais da planilha de 2025 — e o que ela documenta são os achados: um por um, com o
// número que os denuncia. Se alguém corrigir a planilha, estes testes quebram, e é o que se
// espera deles.
import { describe, it, expect } from 'vitest';
import {
  atingiu, comoTexto, divergencia, nomeDoPeriodo, problemas, resultado, seriesIguais, situacao,
  ultimaApuracao, type Apuracao, type Indicador,
} from './indicadores';
import { APURACOES, INDICADORES } from '@/empresas/minasjato.indicadores';
import { MINASJATO } from '@/empresas/minasjato';
import { MODELO } from '@/empresas/modelo';

/* ══ 1. O veredito é calculado ═══════════════════════════════════════════════════════════════ */

const SOBE: Indicador = {
  chave: 'sobe', nome: 'Entrega no prazo', unidade: 'proporcao',
  meta: 0.85, sentido: 'maior_melhor', teto: 1,
};
const DESCE: Indicador = {
  chave: 'desce', nome: 'Devolução', unidade: 'proporcao',
  meta: 0.025, sentido: 'menor_melhor', teto: 1,
};
const ap = (valor: number): Apuracao => ({ indicador: 'x', periodo: '2025-01', naPlanilha: valor });

describe('bater a meta não é questão de opinião', () => {
  it('para onde o número tem de andar depende do indicador, não da tela', () => {
    expect(atingiu(SOBE, 0.9)).toBe(true);
    expect(atingiu(SOBE, 0.8)).toBe(false);
    expect(atingiu(DESCE, 0.01)).toBe(true);
    expect(atingiu(DESCE, 0.04)).toBe(false);
  });

  it('empate conta como atingido: a meta é o piso, não o que se tem de superar', () => {
    expect(atingiu(SOBE, 0.85)).toBe(true);
    expect(atingiu(DESCE, 0.025)).toBe(true);
  });

  it('mas bater exatamente a meta não é o mesmo que sobrar folga', () => {
    // A planilha dela já fazia essa distinção, e chamava de "Requer Atenção".
    expect(situacao(SOBE, ap(0.92))).toBe('boa');
    expect(situacao(SOBE, ap(0.85))).toBe('limite');
    expect(situacao(SOBE, ap(0.84))).toBe('ruim');
    expect(situacao(SOBE, { indicador: 'x', periodo: '2025-01' })).toBe('sem_dado');
  });
});

/* ══ 2. O que a planilha diz fica ao lado do que os números dizem ════════════════════════════ */

describe('o resultado vem do fato, não da conta sobre o fato', () => {
  it('havendo numerador e denominador, são eles que valem', () => {
    const a: Apuracao = { indicador: 'x', periodo: '2025-01', numerador: 1, denominador: 4, naPlanilha: 0.9 };
    expect(resultado(a)).toBe(0.25);
  });

  it('sem componentes, vale o que a planilha registrou', () => {
    expect(resultado({ indicador: 'x', periodo: '2025-01', naPlanilha: 0.9 })).toBe(0.9);
    expect(resultado({ indicador: 'x', periodo: '2025-01' })).toBe(null);
  });

  it('e a diferença entre os dois não some — é ela que vira achado', () => {
    const a: Apuracao = { indicador: 'x', periodo: '2025-01', numerador: 1, denominador: 4, naPlanilha: 0.9 };
    expect(divergencia(a)).toBeCloseTo(-0.65, 5);
    // Arredondamento não é divergência.
    expect(divergencia({ indicador: 'x', periodo: '2025-01', numerador: 1, denominador: 3, naPlanilha: 0.3333 })).toBe(null);
    expect(divergencia({ indicador: 'x', periodo: '2025-01', naPlanilha: 0.9 })).toBe(null);
  });
});

/* ══ 3. Os achados da planilha real de 2025 ══════════════════════════════════════════════════ */

const achados = problemas(INDICADORES, APURACOES);
const de = (chave: string, tipo?: string) =>
  achados.filter((p) => p.indicador === chave && (!tipo || p.tipo === tipo));

describe('o que o motor acha na planilha de 2025', () => {
  it('junho entregou 26 de 25: mais entregas no prazo do que entregas', () => {
    const p = de('eficiencia_entrega', 'parte_maior_que_o_todo');
    expect(p).toHaveLength(1);
    expect(p[0].periodo).toBe('2025-06');
    expect(p[0].detalhe).toContain('26');
    expect(p[0].detalhe).toContain('25');
    // E o mesmo mês estoura o teto, porque 26/25 dá 104%.
    expect(de('eficiencia_entrega', 'acima_do_teto')[0].periodo).toBe('2025-06');
  });

  it('treinamento tem dois meses com mais eficazes do que treinados', () => {
    expect(de('eficacia_treinamento', 'parte_maior_que_o_todo').map((p) => p.periodo))
      .toEqual(['2025-02', '2025-03']);
  });

  it('e em fevereiro a fórmula está invertida: 2/1 virou 50%', () => {
    // Março, com os mesmos números, deu 200%. Os dois meses não podem estar certos.
    const p = de('eficacia_treinamento', 'conta_nao_bate');
    expect(p).toHaveLength(1);
    expect(p[0].periodo).toBe('2025-02');
    expect(p[0].detalhe).toContain('200.00%');
    expect(p[0].detalhe).toContain('50.00%');
  });

  it('dois indicadores declaram de onde saem e não guardam os números', () => {
    expect(achados.filter((p) => p.tipo === 'sem_componentes').map((p) => p.indicador))
      .toEqual(['satisfacao_cliente', 'qualidade_fornecedor']);
  });

  it('três indicadores pararam em janeiro e continuam com cara de saudáveis', () => {
    // É o achado mais silencioso de todos: o painel mostra verde porque o último número foi bom,
    // e o último número é de sete meses atrás.
    const parados = achados.filter((p) => p.tipo === 'serie_interrompida');
    expect(parados.filter((p) => p.detalhe.includes('2025-01')).map((p) => p.indicador))
      .toEqual(['eficacia_comunicacao', 'eficacia_acoes', 'resposta_orcamento']);
    expect(parados.map((p) => p.indicador)).toContain('faturamento');
  });

  it('RNC e reclamação de cliente andam idênticos nos sete meses', () => {
    // Um RNC que a inspeção pega antes de sair não é reclamação de cliente. Se as duas séries
    // são iguais, ou só vira RNC o que o cliente reclamou, ou uma aba copia a outra.
    expect(seriesIguais(INDICADORES, APURACOES)).toEqual([
      ['reclamacao_cliente', 'produto_nao_conforme'],
    ]);
  });

  it('mas não acusa dois indicadores só porque os dois ficaram zerados', () => {
    // Devolução e custo de devolução são zero nos sete meses. Série constante não é prova de
    // cópia — e acusar isso enterraria o achado de verdade no meio do ruído.
    const zerados = seriesIguais(INDICADORES, APURACOES).flat();
    expect(zerados).not.toContain('custo_devolucao');
  });

  it('o faturamento é o único que a própria planilha já dava como não alcançado', () => {
    const ruins = INDICADORES.filter((i) => {
      const u = ultimaApuracao(i.chave, APURACOES);
      return u && situacao(i, u) === 'ruim';
    });
    expect(ruins.map((i) => i.chave)).toEqual(['faturamento']);
  });
});

/* ══ 4. O cadastro ═══════════════════════════════════════════════════════════════════════════ */

describe('os indicadores entram pelo perfil da empresa, não pela plataforma', () => {
  it('a Minasjato traz os treze da planilha dela', () => {
    expect(MINASJATO.indicadores).toHaveLength(13);
    expect(MINASJATO.apuracoes?.length).toBeGreaterThan(60);
  });

  it('toda apuração aponta para um indicador cadastrado', () => {
    const chaves = new Set(INDICADORES.map((i) => i.chave));
    for (const a of APURACOES) expect(chaves, a.indicador).toContain(a.indicador);
  });

  it('toda chave é única e toda meta é um número', () => {
    const chaves = INDICADORES.map((i) => i.chave);
    expect(new Set(chaves).size).toBe(chaves.length);
    for (const i of INDICADORES) expect(Number.isFinite(i.meta), i.chave).toBe(true);
  });

  it('nenhum valor de faturamento em reais entrou no sistema da qualidade', () => {
    // A 9.1.1 pede o resultado do que se monitora; o resultado é o percentual. O valor absoluto
    // é dado comercial e fica na planilha dela.
    for (const a of APURACOES) {
      for (const v of [a.numerador, a.denominador, a.naPlanilha]) {
        if (v !== undefined) expect(Math.abs(v), a.indicador).toBeLessThan(1000);
      }
    }
  });

  it('a empresa modelo não herda indicador de ninguém', () => {
    expect(MINASJATO.indicadores).toBeDefined();
    expect(MODELO.indicadores).toBeUndefined();
  });
});

/* ══ 5. Leitura ══════════════════════════════════════════════════════════════════════════════ */

describe('como o número chega à tela', () => {
  it('período vira mês por extenso', () => {
    expect(nomeDoPeriodo('2025-06')).toBe('junho de 2025');
  });

  it('proporção vira porcentagem; variação ganha sinal', () => {
    expect(comoTexto(SOBE, 0.9361702127659575)).toBe('93.6%');
    expect(comoTexto(SOBE, null)).toBe('—');
    const variacao: Indicador = { ...SOBE, unidade: 'percentual_variacao' };
    expect(comoTexto(variacao, -0.0875689204819020)).toBe('-8.8%');
    expect(comoTexto(variacao, 0.2933614043291533)).toBe('+29.3%');
  });
});
