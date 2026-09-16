// O catálogo padrão e a cobertura.
//
// O que estes testes provam: a identidade de um documento é a CHAVE, não o código. Duas empresas
// com codificações diferentes apontam para a mesma chave, e daí sai a comparação.
import { describe, it, expect } from 'vitest';
import {
  LEGENDA_PADRAO, NUCLEO, TODOS,
  catalogoPara, cobertura, faltasDeNorma, modulosDisponiveis, padraoPorChave, percentualCoberto,
} from './catalogoPadrao';
import { MINASJATO } from '@/empresas/minasjato';
import { MODELO } from '@/empresas/modelo';

/* ══ 1. O catálogo ═══════════════════════════════════════════════════════════════════════════ */

describe('o catálogo padrão', () => {
  it('toda chave é única — é a identidade, não pode repetir', () => {
    const chaves = TODOS.map((x) => x.chave);
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it('todo código sugerido é único e usa um prefixo da legenda padrão', () => {
    const codigos = TODOS.map((x) => x.codigoSugerido);
    expect(new Set(codigos).size).toBe(codigos.length);
    for (const x of TODOS) {
      expect(Object.keys(LEGENDA_PADRAO), x.codigoSugerido).toContain(x.codigoSugerido.split('-')[0]);
    }
  });

  it('a legenda tem quatro prefixos, não dez — a área é campo, não prefixo', () => {
    // Codificar a área no prefixo é o que faz a lista ficar sem espaço e alguém inventar um por
    // fora. Foi o que aconteceu com o TR-001.
    expect(Object.keys(LEGENDA_PADRAO)).toEqual(['MQ', 'PR', 'IT', 'FR']);
  });

  it('separa o que a norma exige do que é só prática', () => {
    const exigidos = TODOS.filter((x) => x.exigencia === 'norma');
    const praticas = TODOS.filter((x) => x.exigencia === 'pratica');
    expect(exigidos.length).toBeGreaterThan(10);
    expect(praticas.length).toBeGreaterThan(5);

    // O manual saiu da lista de exigências na versão 2015, e muita gente ainda escreve achando
    // que é obrigatório.
    expect(padraoPorChave('manual_qualidade')!.exigencia).toBe('pratica');
    expect(padraoPorChave('escopo_sgq')!.exigencia).toBe('norma');
  });

  it('todo documento exigido cita a cláusula que o exige', () => {
    for (const x of TODOS.filter((y) => y.exigencia === 'norma')) {
      expect(x.clausulas.length, x.chave).toBeGreaterThan(0);
    }
  });
});

/* ══ 2. Modular: quem não jateia não recebe procedimento de jateamento ═══════════════════════ */

describe('o catálogo é modular', () => {
  it('sem módulo nenhum, só o núcleo', () => {
    const so = catalogoPara([]);
    expect(so.every((x) => x.origem === NUCLEO)).toBe(true);
    expect(so.some((x) => x.chave === 'st_jateamento')).toBe(false);
  });

  it('com o módulo de tratamento de superfície, entram os documentos dele', () => {
    const com = catalogoPara(['surface-treatment']);
    expect(com.length).toBeGreaterThan(catalogoPara([]).length);
    expect(com.some((x) => x.chave === 'st_jateamento')).toBe(true);
    expect(com.find((x) => x.chave === 'st_ordem_servico')!.papel).toBe('ordem_servico');
  });

  it('módulo que não existe não traz nada de novo', () => {
    expect(catalogoPara(['setor-inexistente'])).toEqual(catalogoPara([]));
    expect(modulosDisponiveis()).toContain('surface-treatment');
  });
});

/* ══ 3. A empresa modelo nasce do catálogo ═══════════════════════════════════════════════════ */

describe('abrir um cliente novo é escolher módulos, não digitar lista', () => {
  it('a lista mestra da empresa modelo é o catálogo, documento por documento', () => {
    const esperado = catalogoPara(MODELO.modulos);
    expect(MODELO.documentacao.documentos).toHaveLength(esperado.length);
    expect(MODELO.documentacao.documentos.flatMap((d) => d.padroes ?? []).sort())
      .toEqual(esperado.map((p) => p.chave).sort());
  });

  it('e o mapa de formulários também sai do catálogo, sem ninguém digitar', () => {
    expect(MODELO.formularios.ordem_servico).toBe('FR-101');
    expect(MODELO.formularios.relatorio_inspecao).toBe('FR-102');
    expect(MODELO.formularios.nao_conformidade).toBe('FR-013');
  });

  it('quem nasce do padrão nasce com cobertura total', () => {
    const c = cobertura(MODELO.documentacao.documentos, MODELO.modulos);
    expect(c.faltando).toEqual([]);
    expect(c.extras).toEqual([]);
    expect(percentualCoberto(c)).toBe(1);
  });
});

/* ══ 4. A cobertura de quem já existia ═══════════════════════════════════════════════════════ */

describe('a Minasjato medida contra o padrão', () => {
  const c = cobertura(MINASJATO.documentacao.documentos, MINASJATO.modulos);

  it('depois do alinhamento, todo documento dela aponta para um padrão', () => {
    expect(c.atendidos.length).toBe(45);
    expect(percentualCoberto(c)!).toBeGreaterThan(0.95);
  });

  it('o manual sozinho atende três padrões: ele mesmo, o escopo e a política', () => {
    // Os textos estão nele por extenso. Era o modelo de um-padrão-por-documento que os
    // fazia aparecer como falta.
    const manual = MINASJATO.documentacao.documentos.find((d) => d.codigo === 'MQ-001')!;
    expect(manual.padroes).toEqual(['manual_qualidade', 'escopo_sgq', 'politica_qualidade']);
    expect(manual.revisao).toBe('00');
    expect(manual.exclusoes?.[0].requisito).toContain('8.3');
  });

  it('o que falta é tudo coisa que a norma exige — nenhuma falta é de prática', () => {
    expect(faltasDeNorma(c).map((x) => x.chave)).toEqual([
      'saida_nao_conforme', 'monitoramento_medicao',
    ]);
    // E todas as quatro são RETER — registro que nasce do fato, não texto que se escreve.
    expect(faltasDeNorma(c).every((x) => x.retencao === 'reter')).toBe(true);
    expect(faltasDeNorma(c).every((x) => Boolean(x.comoAtender))).toBe(true);
    expect(c.faltando.filter((x) => x.exigencia === 'pratica')).toEqual([]);
  });

  it('não sobra nada: até o que é de outra norma achou lugar', () => {
    // Os documentos de SSMA não são ISO 9001 — são NR-6, CONAMA 313, NR-26. Entraram como
    // módulo próprio, com exigência 'legal', em vez de ficarem soltos como "extras".
    expect(c.extras).toEqual([]);
    const ssma = c.atendidos.find((a) => a.padrao.chave === 'ssma_epi')!;
    expect(ssma.locais[0].codigo).toBe('PSSMA-001');
    expect(ssma.padrao.exigencia).toBe('legal');
  });

  it('o código é apelido: a mesma chave tem código diferente em cada empresa', () => {
    const achar = (docs: typeof MINASJATO.documentacao.documentos) =>
      docs.find((d) => d.padroes?.includes('st_ordem_servico'))!;
    const mj = achar(MINASJATO.documentacao.documentos);
    const mod = achar(MODELO.documentacao.documentos);
    expect(mj.codigo).toBe('FM-001');
    expect(mod.codigo).toBe('FR-101');
    expect(mj.padroes).toEqual(mod.padroes);
  });
});
