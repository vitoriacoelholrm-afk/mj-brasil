// A Lista Mestra é a única fonte de código de documento. Estes testes são a trava: se alguém
// carimbar um código que não está catalogado, o app quebra aqui e não na auditoria.
import { describe, it, expect } from 'vitest';
import { LISTA_MESTRA, LISTA_MESTRA_META, carimbo, conflitos, doc } from './listaMestra';

const EM = new Date('2026-09-16');

describe('a Lista Mestra é a autoridade sobre código', () => {
  it('um código catalogado devolve o documento', () => {
    expect(doc('FM-001').titulo).toContain('Ordem de Serviço');
    expect(doc('FM-002').titulo).toContain('Relatório de Inspeção');
  });

  it('um código que não está catalogado estoura, e diz o que fazer', () => {
    expect(() => doc('FM-999')).toThrowError(/não está na Lista Mestra/);
    expect(() => doc('FM-999')).toThrowError(/listaMestra\.ts/);
  });

  it('o carimbo sai pronto para o rodapé do documento emitido', () => {
    expect(carimbo('FM-001')).toBe('FM-001');
    expect(carimbo('TR-001')).toBe('TR-001 · rev. 01');
  });

  it('toda tela declarada aponta para uma tela que existe', () => {
    const telas = new Set(['plano', 'instrumentos', 'lista-mestra', 'clientes', 'diagnostico', 'vencimentos', 'situacao']);
    for (const d of LISTA_MESTRA) {
      if (d.tela) expect(telas, `${d.codigo} aponta para "${d.tela}"`).toContain(d.tela);
    }
  });
});

describe('os conflitos que impedem a Lista Mestra de identificar sozinha', () => {
  const cs = conflitos(EM);
  const por = (tipo: string) => cs.filter((x) => x.tipo === tipo);

  it('FM-011 identifica dois documentos vigentes', () => {
    const dup = por('codigo_duplicado').find((x) => x.codigo === 'FM-011')!;
    expect(dup.titulo).toContain('Pedido de Compra');
    expect(dup.titulo).toContain('SWOT');
    expect(dup.gravidade).toBe('alta');
  });

  it('a própria Lista Mestra responde por três códigos', () => {
    expect(LISTA_MESTRA_META.codigosParalelos).toEqual(['MJ-REG-LMD-01', 'MJ-REC-01']);
    const c = por('codigo_duplicado').find((x) => x.codigo === 'LM-SGQ-001')!;
    expect(c.detalhe).toContain('MJ-REG-LMD-01');
    expect(c.detalhe).toContain('MJ-REC-01');
  });

  it('a Lista Mestra está com a revisão vencida desde 04/07/2026', () => {
    const v = por('revisao_vencida').find((x) => x.codigo === 'LM-SGQ-001')!;
    expect(v.detalhe).toContain('04/07/2026');   // o texto sai em data brasileira
  });

  it('o arquivo real de oito documentos usa outro código', () => {
    const paralelos = por('codigo_paralelo');
    expect(paralelos.find((x) => x.codigo === 'FM-001')!.detalhe).toContain('MJ-OP-01');
    expect(paralelos.find((x) => x.codigo === 'PO-002')!.detalhe).toContain('MJ-RAI-01');
    expect(paralelos.length).toBeGreaterThanOrEqual(8);
  });

  it('a Lista de Presença que chegou agora usa um prefixo que a Lista Mestra não conhece', () => {
    const fora = por('fora_da_lista').find((x) => x.codigo === 'TR-001')!;
    expect(fora.gravidade).toBe('alta');
    expect(fora.detalhe).toContain('FM-009');
    expect(doc('TR-001').revisao).toBe('01');
  });

  it('os registros sem código nenhum aparecem sem código, não com um rótulo inventado', () => {
    const semCodigo = por('fora_da_lista').filter((x) => x.codigo === null);
    expect(semCodigo).toHaveLength(5);
    expect(semCodigo.map((x) => x.titulo)).toContain('Plano de Calibração');
  });

  it('sete registros circulam sem entrada própria', () => {
    const fora = por('fora_da_lista');
    expect(fora.length).toBeGreaterThanOrEqual(7);
    expect(fora.some((x) => x.titulo.includes('Plano de Calibração'))).toBe(true);
    expect(fora.some((x) => x.titulo.includes('Manual'))).toBe(true);
  });

  it('nada disso é histórico: é tudo documento vigente', () => {
    expect(LISTA_MESTRA.every((d) => d.situacao === 'vigente')).toBe(true);
  });
});
