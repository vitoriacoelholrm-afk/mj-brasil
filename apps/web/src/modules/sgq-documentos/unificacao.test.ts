// O plano de unificação. O que importa aqui é o que ele NÃO propõe.
import { describe, it, expect } from 'vitest';
import { planoDeUnificacao, resumoDoPlano } from './unificacao';
import { MINASJATO } from '@/empresas/minasjato';
import { MODELO } from '@/empresas/modelo';
import { cobertura } from './catalogoPadrao';

const plano = planoDeUnificacao(MINASJATO.documentacao, MINASJATO.modulos);
const de = (codigo: string) => plano.propostas.find((p) => p.de.startsWith(codigo));

describe('cada duplicidade vira uma decisão com código concreto', () => {
  it('a SWOT saiu da lista de propostas porque a proposta foi EXECUTADA', () => {
    // O plano dizia: tire a SWOT do FM-011 e dê a ela o FM-024 — segue do maior, não preenche
    // buraco. Em 21/09/2026 isso foi feito no perfil da empresa, e a proposta some sozinha.
    // É o teste de que o plano mede a realidade e não uma lista fixa: resolver uma pendência
    // tem de tirá-la da fila sem ninguém apagar nada.
    expect(de('FM-011')).toBeUndefined();
  });

  it('o que usa prefixo de fora entra na numeração da casa', () => {
    expect(de('TR-001')).toMatchObject({ tipo: 'renumerar', para: 'FM-025' });
    expect(de('MJ-FORM-CAL-02')).toMatchObject({ tipo: 'renumerar', para: 'FM-026' });
  });

  it('os cinco registros sem código recebem código, um cada', () => {
    const cadastros = plano.propostas.filter((p) => p.tipo === 'cadastrar');
    expect(cadastros).toHaveLength(5);
    expect(cadastros.map((p) => p.para)).toEqual(['FM-027', 'FM-028', 'FM-029', 'FM-030', 'FM-031']);
  });

  it('nenhum código proposto colide com um que já existe', () => {
    const existentes = new Set(MINASJATO.documentacao.documentos.map((d) => d.codigo));
    // 'fundir' e 'aposentar_codigo' MANTÊM um código existente — só 'renumerar' e 'cadastrar'
    // pedem código novo.
    const novos = plano.propostas.filter((p) => p.tipo === 'renumerar' || p.tipo === 'cadastrar');
    for (const p of novos) expect(existentes.has(p.para), p.para).toBe(false);
    expect(new Set(novos.map((p) => p.para)).size).toBe(novos.length);
  });

  it('o código MJ-* paralelo sai e fica o da lista mestra', () => {
    const p = plano.propostas.find((x) => x.de.includes('MJ-OP-01'))!;
    expect(p.tipo).toBe('aposentar_codigo');
    expect(p.para).toBe('FM-001');
  });

  it('a própria lista mestra deixa de responder por três códigos', () => {
    const p = plano.propostas.find((x) => x.titulo.includes('própria lista'))!;
    expect(p.para).toBe('LM-SGQ-001');
    expect(p.de).toContain('MJ-REG-LMD-01');
  });

  it('a revisão do manual é conciliada emitindo a próxima', () => {
    const p = plano.propostas.find((x) => x.tipo === 'conciliar_revisao')!;
    expect(p.titulo).toContain('Manual');
    expect(p.de).toBe('planilha: rev. 01');
    expect(p.para).toBe('rev. 00');   // corrige-se a planilha, não o documento
  });
});

describe('o que o plano se recusa a propor', () => {
  it('só funde o que tem prova: dois arquivos reais disputando o mesmo código', () => {
    const fusoes = plano.propostas.filter((p) => p.tipo === 'fundir');
    expect(fusoes).toHaveLength(1);
    expect(fusoes[0].de).toBe('MJ-FORM-NC-01 e MJ-FORM-RNC');
    expect(fusoes[0].para).toBe('FM-003');
  });

  it('NÃO funde procedimento com formulário — é o par que a norma espera', () => {
    const naoConformidade = plano.agrupados.find((a) => a.padrao.chave === 'nao_conformidade')!;
    expect(naoConformidade.naturezas.sort()).toEqual(['formulario', 'procedimento']);
    expect(plano.propostas.some((p) => p.tipo === 'fundir' && p.de.includes('PG-005'))).toBe(false);
  });

  it('NÃO funde a demão de fundo com a de acabamento só porque cumprem o mesmo padrão', () => {
    const tinta = plano.agrupados.find((a) => a.padrao.chave === 'st_aplicacao_tinta')!;
    expect(tinta.documentos.map((d) => d.codigo)).toEqual(['PO-004', 'PO-005']);
    expect(plano.propostas.some((p) => p.de.includes('PO-004'))).toBe(false);
  });

  it('NÃO funde o levantamento de treinamento com a lista de presença', () => {
    // Um diz de que treinamento se precisa; o outro registra quem esteve na sala.
    const comp = plano.agrupados.find((a) => a.padrao.chave === 'evidencia_competencia')!;
    expect(comp.documentos.map((d) => d.codigo).sort()).toEqual(['FM-009', 'TR-001']);
    expect(plano.propostas.some((p) => p.tipo === 'fundir' && p.de.includes('FM-009'))).toBe(false);
  });
});

describe('depois do alinhamento', () => {
  it('nenhum documento da Minasjato ficou fora do catálogo padrão', () => {
    const c = cobertura(MINASJATO.documentacao.documentos, MINASJATO.modulos);
    expect(c.extras).toEqual([]);
    expect(c.atendidos.length).toBe(48);
  });

  it('das seis faltas de 16/09 nenhuma voltou — as duas de agora são perguntas novas', () => {
    const c = cobertura(MINASJATO.documentacao.documentos, MINASJATO.modulos);
    // Eram 6 em 16/09 de manhã. Fecharam em três rodadas: o manual, os dois formulários da
    // 8.5.3/8.5.6, e por último a 8.7.2 (no RNC que já existia) e a 9.1.1 (documento novo).
    for (const antiga of ['manual_qualidade', 'escopo_sgq', 'politica_qualidade',
      'propriedade_cliente', 'mudanca_producao', 'saida_nao_conforme', 'monitoramento_medicao']) {
      expect(c.faltando.map((x) => x.chave), antiga).not.toContain(antiga);
    }
    // As de 21/09 são da comunicação (7.4) e do pós-entrega (8.5.5, que pede política E
    // registro), e o catálogo passou a perguntar pelas três. Documento nenhum foi perdido: a
    // pergunta é que é nova.
    expect(c.faltando.map((x) => x.chave).sort())
      .toEqual(['atendimento_pos_entrega', 'comunicacao_sgq', 'pos_entrega']);
  });

  it('a Minasjato usa dois módulos: o do setor e o de segurança', () => {
    expect(MINASJATO.modulos).toEqual(['tratamento-superficie', 'ssma', 'portaria']);
  });

  it('quem nasce do padrão não tem nada a unificar', () => {
    const p = planoDeUnificacao(MODELO.documentacao, MODELO.modulos);
    expect(resumoDoPlano(p)).toEqual({ total: 0, graves: 0, agrupados: 0 });
  });
});
