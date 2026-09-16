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
    expect(MODELO.documentacao.documentos.map((d) => d.padrao).sort())
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

  it('a maior parte já está coberta', () => {
    expect(c.atendidos.length).toBe(28);
    expect(percentualCoberto(c)!).toBeGreaterThan(0.8);
  });

  it('o que falta é tudo coisa que a norma exige — nenhuma falta é de prática', () => {
    expect(faltasDeNorma(c).map((x) => x.chave)).toEqual([
      'escopo_sgq', 'politica_qualidade', 'propriedade_cliente',
      'mudanca_producao', 'saida_nao_conforme', 'monitoramento_medicao',
    ]);
    expect(c.faltando.filter((x) => x.exigencia === 'pratica')).toEqual([]);
  });

  it('e sobram documentos sem correspondente no padrão', () => {
    // Não é defeito por si: pode ser requisito legal ou do cliente. Mas cada um precisa ser
    // olhado, porque também é assim que nasce documento que ninguém usa.
    expect(c.extras.length).toBeGreaterThan(15);
    expect(c.extras.map((x) => x.codigo)).toContain('PSSMA-001');
  });

  it('o código é apelido: a mesma chave tem código diferente em cada empresa', () => {
    const mj = MINASJATO.documentacao.documentos.find((d) => d.padrao === 'st_ordem_servico')!;
    const mod = MODELO.documentacao.documentos.find((d) => d.padrao === 'st_ordem_servico')!;
    expect(mj.codigo).toBe('FM-001');
    expect(mod.codigo).toBe('FR-101');
    expect(mj.padrao).toBe(mod.padrao);
  });
});
