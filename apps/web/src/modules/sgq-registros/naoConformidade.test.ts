// O que a não conformidade cobra DEPOIS de registrada.
//
// Estes testes guardam a diferença entre as duas cláusulas: a 8.7.2 fecha quando se diz o que foi
// feito com a peça; a 10.2.2 só fecha quando se diz por que aconteceu, o que se fez para não
// repetir, e que alguém verificou se funcionou. Um sistema que confunde as duas registra muita
// não conformidade e não trata nenhuma — e é assim que a auditoria encontra.
import { describe, it, expect } from 'vitest';
import type { Registro, Valores } from '@/plataforma/formularios';
import { faltaNaTratativa, resumoDasNcs, semTratativa } from './naoConformidade';

let seq = 0;
const nc = (valores: Valores): Registro => ({
  id: `r-${++seq}`, papel: 'nao_conformidade', valores, anexos: [],
  criadoEm: '2026-09-21', criadoPor: 'Ana Ribeiro',
});

/** A 8.7.2 inteira: peça resolvida, autoridade identificada. Nada da 10.2.2. */
const REGISTRADA: Valores = {
  detectadaEm: '2026-09-18', detectadaPor: 'Marcos Teixeira', origem: 'Inspeção final',
  peca: 'Câmara MOD-250 nº 14',
  descricao: 'Espessura de 62 µm no ponto 4; especificado 100 µm.',
  disposicao: 'Sucateamento', acoesTomadas: 'Peça segregada e descartada.',
  concessao: 'Não', autoridade: 'Sofia Lima',
};

const TRATADA: Valores = {
  ...REGISTRADA,
  causa: 'Pistola regulada abaixo da vazão do procedimento.',
  acaoCorretiva: 'Regulagem incluída na conferência de início de turno.',
  eficaciaVerificadaPor: 'Sofia Lima', eficaciaEm: '2026-09-20',
};

describe('registrar não é tratar', () => {
  it('a NC com a 8.7.2 completa continua em aberto pela 10.2.2', () => {
    expect(semTratativa(nc(REGISTRADA))).toBe(true);
    expect(faltaNaTratativa(nc(REGISTRADA)))
      .toEqual(['a causa', 'a ação corretiva', 'a verificação da eficácia']);
  });

  it('só fecha com causa, ação e eficácia verificada', () => {
    expect(semTratativa(nc(TRATADA))).toBe(false);
    expect(faltaNaTratativa(nc(TRATADA))).toEqual([]);
  });

  it('ação escrita e não verificada não fecha — ninguém sabe se funcionou', () => {
    // É o caso mais comum: a ação está lá, bonita, e ninguém voltou para ver. A norma pede a
    // análise da eficácia, não a execução.
    const semVerificar = { ...TRATADA, eficaciaVerificadaPor: '' };
    expect(faltaNaTratativa(nc(semVerificar))).toEqual(['a verificação da eficácia']);
  });

  it('campo preenchido só com espaço não conta como preenchido', () => {
    expect(faltaNaTratativa(nc({ ...TRATADA, causa: '   ' }))).toEqual(['a causa']);
  });
});

describe('o veredito do painel', () => {
  it('conta quantas há e quantas ainda não foram tratadas', () => {
    const resumo = resumoDasNcs([nc(TRATADA), nc(REGISTRADA), nc(REGISTRADA)]);
    expect(resumo.total).toBe(3);
    expect(resumo.semTratativa).toBe(2);
  });

  it('sem nenhuma registrada, não há nada em aberto', () => {
    expect(resumoDasNcs([])).toMatchObject({ total: 0, semTratativa: 0, maisAntiga: null });
  });

  it('a mais antiga sem tratativa é a que o auditor pergunta primeiro', () => {
    // A lista vem do banco da mais nova para a mais velha; a mais antiga é a última.
    const nova = nc({ ...REGISTRADA, peca: 'a mais nova' });
    const velha = nc({ ...REGISTRADA, peca: 'a mais velha' });
    expect(resumoDasNcs([nova, nc(TRATADA), velha]).maisAntiga?.valores.peca).toBe('a mais velha');
  });
});
