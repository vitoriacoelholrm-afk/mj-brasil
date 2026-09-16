// A prova de que a plataforma é genérica.
//
// Não adianta afirmar que o motor não sabe de quem é o dado — tem que dar para trocar a empresa
// ativa e ver o mesmo número receber outro veredito, sem nenhuma linha de regra mudar. É o que
// estes testes fazem: a mesma medição, duas empresas, duas respostas.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';

import '@/empresas/minasjato';
import '@/empresas/modelo';
import { definirEmpresaAtiva, empresaAtiva, empresas, toleranciaAtiva } from './empresa';
import { acharConflitos, acharDoc, proximoCodigoLivre, significadoDoPrefixo } from './documentos';
import { avaliarMedicao } from '@/os/regras';
import { faixaTolerada } from '@/os/vocabulario';
import { carimbo, carimboDoPapel, codigoDoPapel, conflitos, doc, listaMestraMeta } from '@/documentos/listaMestra';

afterEach(() => definirEmpresaAtiva('minasjato'));

const medicao = {
  grandeza: 'camada_seca', especificado: '100', encontrado: '126',
  dataInspecao: '2026-06-05', responsavelProcesso: 'a', responsavelInspecao: 'b',
  instrumentoCodigo: '232212',
};

/* ══ 1. O mesmo número, dois vereditos ═══════════════════════════════════════════════════════ */

describe('a mesma medição muda de resultado com a empresa', () => {
  it('126 µm sobre 100 passa na Minasjato e reprova na empresa modelo', () => {
    definirEmpresaAtiva('minasjato');
    expect(toleranciaAtiva()).toEqual({ abaixo: 0.10, acima: 0.40 });
    expect(avaliarMedicao(medicao).resultado).toBe('conforme');

    definirEmpresaAtiva('modelo');
    expect(toleranciaAtiva()).toEqual({ abaixo: 0.05, acima: 0.15 });
    const r = avaliarMedicao(medicao);
    expect(r.resultado).toBe('nao_conforme');
    expect(r.motivo).toContain('a tolerância acima é 15%');
  });

  it('a faixa aceita muda junto, e nenhuma regra foi tocada', () => {
    definirEmpresaAtiva('minasjato');
    expect(faixaTolerada(100)).toEqual({ min: 90, max: 140 });
    definirEmpresaAtiva('modelo');
    expect(faixaTolerada(100)).toEqual({ min: 95, max: 115 });
  });

  it('quem quiser ser puro passa a tolerância na mão e ignora a empresa ativa', () => {
    // É assim que o motor fica testável sem estado global.
    definirEmpresaAtiva('modelo');
    expect(avaliarMedicao(medicao, { abaixo: 0.10, acima: 0.40 }).resultado).toBe('conforme');
    expect(faixaTolerada(100, 100, { abaixo: 0, acima: 0 })).toEqual({ min: 100, max: 100 });
  });
});

/* ══ 2. Cada empresa tem a sua codificação ═══════════════════════════════════════════════════ */

describe('a codificação é da empresa, não da plataforma', () => {
  it('FM-001 existe na Minasjato e não existe na empresa modelo', () => {
    definirEmpresaAtiva('minasjato');
    expect(doc('FM-001').titulo).toContain('Ordem de Serviço');
    expect(carimbo('FM-001')).toBe('FM-001 rev. 00');

    definirEmpresaAtiva('modelo');
    expect(() => doc('FM-001')).toThrowError(/não está na lista mestra desta empresa/);
    expect(doc('FOR-001').titulo).toContain('Ordem de Serviço');
    expect(carimbo('FOR-001')).toBe('FOR-001 rev. 00');
  });

  it('a legenda de prefixos é outra, e o motor lê a de quem está ativa', () => {
    definirEmpresaAtiva('minasjato');
    expect(significadoDoPrefixo(empresaAtiva().documentacao.legenda, 'PSSMA-001')).toBe('Procedimento de SSMA');
    expect(significadoDoPrefixo(empresaAtiva().documentacao.legenda, 'POP-001')).toBeNull();

    definirEmpresaAtiva('modelo');
    expect(significadoDoPrefixo(empresaAtiva().documentacao.legenda, 'POP-001')).toBe('Procedimento Operacional Padrão');
    expect(significadoDoPrefixo(empresaAtiva().documentacao.legenda, 'PSSMA-001')).toBeNull();
  });

  it('o próximo código livre respeita a numeração de cada uma', () => {
    const docsMJ = empresas().find((e) => e.id === 'minasjato')!.documentacao.documentos;
    const docsModelo = empresas().find((e) => e.id === 'modelo')!.documentacao.documentos;
    expect(proximoCodigoLivre(docsMJ, 'FM')).toBe('FM-012');
    expect(proximoCodigoLivre(docsModelo, 'FOR')).toBe('FOR-002');
  });

  it('a tela pede o PAPEL do formulário, não o código — por isso serve as duas', () => {
    definirEmpresaAtiva('minasjato');
    expect(codigoDoPapel('ordem_servico')).toBe('FM-001');
    expect(carimboDoPapel('ordem_servico')).toBe('FM-001 rev. 00');
    expect(carimboDoPapel('relatorio_inspecao')).toBe('FM-002 rev. 00');

    definirEmpresaAtiva('modelo');
    expect(codigoDoPapel('ordem_servico')).toBe('FOR-001');
    expect(carimboDoPapel('ordem_servico')).toBe('FOR-001 rev. 00');
  });

  it('o papel que a empresa não tem devolve null, e a tela avisa em vez de quebrar', () => {
    definirEmpresaAtiva('modelo');
    expect(codigoDoPapel('relatorio_inspecao')).toBeNull();
    expect(carimboDoPapel('relatorio_inspecao')).toBeNull();
  });

  it('a lista mestra de cada uma tem código e norma próprios', () => {
    definirEmpresaAtiva('minasjato');
    expect(listaMestraMeta().codigo).toBe('LM-SGQ-001');
    definirEmpresaAtiva('modelo');
    expect(listaMestraMeta().codigo).toBe('LM-001');
  });
});

/* ══ 3. Os conflitos são dos dados, não do motor ═════════════════════════════════════════════ */

describe('as mesmas sete verificações, resultados diferentes', () => {
  it('a Minasjato acumula conflitos; a empresa modelo nasce limpa', () => {
    definirEmpresaAtiva('minasjato');
    const mj = conflitos(new Date('2026-09-16'));
    expect(mj.filter((x) => x.gravidade === 'alta').length).toBeGreaterThan(5);

    definirEmpresaAtiva('modelo');
    const modelo = conflitos(new Date('2026-09-16'));
    expect(modelo).toEqual([]);
  });

  it('o mesmo defeito aparece em qualquer empresa que o tiver', () => {
    // Dois documentos com o mesmo código: o motor acusa sem saber de quem é.
    const inventada = {
      meta: { ...listaMestraMeta(), codigo: 'X-001', codigosParalelos: [], aprovadoPor: 'a', elaboradoPor: 'b', proximaRevisao: '2099-01-01' },
      legenda: { AA: 'Alguma coisa' },
      documentos: [
        { codigo: 'AA-001', titulo: 'Um', natureza: 'formulario' as const, categoria: 'X', revisao: '00', emissao: null, proximaRevisao: null, situacao: 'vigente' as const, acesso: 'irrestrito' as const, responsavel: null, clausulas: [], local: null },
        { codigo: 'AA-001', titulo: 'Outro', natureza: 'formulario' as const, categoria: 'X', revisao: '00', emissao: null, proximaRevisao: null, situacao: 'vigente' as const, acesso: 'irrestrito' as const, responsavel: null, clausulas: [], local: null },
      ],
    };
    const cs = acharConflitos(inventada, new Date('2026-09-16'));
    expect(cs).toHaveLength(1);
    expect(cs[0].tipo).toBe('codigo_duplicado');
    expect(cs[0].codigo).toBe('AA-001');
  });

  it('acharDoc é puro: recebe os documentos, não vai buscar empresa nenhuma', () => {
    const docs = empresas().find((e) => e.id === 'modelo')!.documentacao.documentos;
    expect(acharDoc(docs, 'MAN-001').titulo).toBe('Manual da Qualidade');
  });
});

/* ══ 4. A trava: o motor não pode citar empresa nenhuma ══════════════════════════════════════ */

describe('a separação é real, não só intenção', () => {
  it('nenhum arquivo da plataforma menciona uma empresa', () => {
    const dir = join(__dirname);
    const vazamentos: string[] = [];
    for (const nome of readdirSync(dir)) {
      if (!nome.endsWith('.ts') || nome.endsWith('.test.ts')) continue;
      const texto = readFileSync(join(dir, nome), 'utf8').toLowerCase();
      for (const proibido of ['minasjato', 'weir', 'interseal', 'jotun', 'lm-sgq']) {
        if (texto.includes(proibido)) vazamentos.push(`${nome} cita "${proibido}"`);
      }
    }
    expect(vazamentos).toEqual([]);
  });

  it('as empresas registradas se apresentam, e uma delas é só modelo', () => {
    expect(empresas().map((e) => e.id).sort()).toEqual(['minasjato', 'modelo']);
    expect(empresas().find((e) => e.id === 'minasjato')!.modelo).toBeUndefined();
    expect(empresas().find((e) => e.id === 'modelo')!.modelo).toBe(true);
  });

  it('trocar para uma empresa que não existe é erro, não silêncio', () => {
    expect(() => definirEmpresaAtiva('inexistente')).toThrowError(/não está registrada/);
  });
});
