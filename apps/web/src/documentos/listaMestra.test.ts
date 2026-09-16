// A Lista Mestra é a única fonte de código de documento. Estes testes são a trava: se alguém
// carimbar um código que não está catalogado, o app quebra aqui e não na auditoria.
import { describe, it, expect } from 'vitest';
import {
  carimbo, catalogados, conflitos, doc, legenda, listaMestra, listaMestraMeta,
  porCategoria, porClausula, proximoCodigoLivre, significadoDoPrefixo,
} from './listaMestra';

const CATALOGADOS = catalogados();
const LISTA_MESTRA = listaMestra();
const LISTA_MESTRA_META = listaMestraMeta();
const PREFIXO_ROTULO = legenda();

const EM = new Date('2026-09-16');

/* ══ 1. O catálogo importado da planilha ═════════════════════════════════════════════════════ */

describe('os 47 documentos da LM-SGQ-001', () => {
  it('os 47 da planilha estão aqui, mais os dois que criamos depois', () => {
    expect(LISTA_MESTRA_META.totalCatalogado).toBe(47);   // o que a planilha declara
    expect(CATALOGADOS).toHaveLength(49);                  // 47 + FM-020 e FM-021
  });

  it('e o app acusa que o cabeçalho da planilha ficou para trás', () => {
    const c = conflitos(EM).find((x) => x.tipo === 'contagem_divergente')!;
    expect(c.detalhe).toContain('declara 47');
    expect(c.detalhe).toContain('tem 49');
  });

  it('cada um trouxe cláusula da ISO, responsável e nível de acesso', () => {
    expect(CATALOGADOS.every((d) => d.clausulas.length > 0)).toBe(true);
    expect(CATALOGADOS.every((d) => Boolean(d.responsavel))).toBe(true);
    expect(doc('PQ-005').clausulas).toEqual(['7.1.5']);
    expect(doc('PQ-005').responsavel).toBe('Ger. Qualidade');
    expect(doc('FM-008').acesso).toBe('restrito');
  });

  it('a divisão por categoria mostra onde o sistema pesa', () => {
    const cats = porCategoria();
    expect(cats.reduce((n, x) => n + x.total, 0)).toBe(49);
    // Operações lidera — é o processo que a empresa vende, e ganhou os dois formulários novos.
    expect(cats[0]).toEqual({ categoria: 'Operações', total: 14 });
    expect(cats.find((x) => x.categoria === 'Gestão da Qualidade')!.total).toBe(10);
  });

  it('dá para achar quem atende uma cláusula — é o que o auditor pergunta', () => {
    expect(porClausula('8.6').map((d) => d.codigo)).toContain('PQ-003');
    expect(porClausula('8.6').map((d) => d.codigo)).toContain('FM-002');
    expect(porClausula('7.1.5').map((d) => d.codigo)).toEqual(['PQ-005', 'IT-004']);
  });

  it('as instruções de trabalho vivem no chão de fábrica, não no servidor', () => {
    expect(doc('IT-001').local).toBe('Produção (físico)');
    expect(doc('IT-004').local).toBe('Lab. Qualidade (físico)');
    expect(doc('PSSMA-001').local).toBe('Servidor / Pasta SSMA');
  });
});

/* ══ 2. A trava ══════════════════════════════════════════════════════════════════════════════ */

describe('a Lista Mestra é a autoridade sobre código', () => {
  it('um código catalogado devolve o documento', () => {
    expect(doc('FM-001').titulo).toContain('Ordem de Serviço');
    expect(doc('FM-002').titulo).toContain('Relatório de Inspeção');
  });

  it('um código que não está catalogado estoura, e diz o que fazer', () => {
    expect(() => doc('FM-999')).toThrowError(/não está na lista mestra desta empresa/);
    expect(() => doc('FM-999')).toThrowError(/perfil dela/);
  });

  it('o carimbo sai pronto para o rodapé, com a revisão', () => {
    expect(carimbo('FM-001')).toBe('FM-001 rev. 00');
    expect(carimbo('MQ-001')).toBe('MQ-001 rev. 00');   // vale o arquivo, não a planilha
  });

  it('a Legenda diz o que cada prefixo significa', () => {
    expect(significadoDoPrefixo('PSSMA-002')).toBe('Procedimento de SSMA');
    expect(significadoDoPrefixo('FM-001')).toBe('Formulário / Modelo de Registro');
    expect(significadoDoPrefixo('TR-001')).toBeNull();
    expect(Object.keys(PREFIXO_ROTULO)).toHaveLength(10);
  });

  it('sabe qual é o próximo código livre — para cadastrar o que circula sem entrada', () => {
    expect(proximoCodigoLivre('FM')).toBe('FM-022');
    expect(proximoCodigoLivre('IT')).toBe('IT-006');
  });

  it('toda tela declarada aponta para uma tela que existe', () => {
    const telas = new Set(['plano', 'instrumentos', 'lista-mestra', 'clientes', 'diagnostico', 'vencimentos', 'situacao', 'propriedade-cliente', 'mudanca-producao']);
    for (const d of LISTA_MESTRA) {
      if (d.tela) expect(telas, `${d.codigo} aponta para "${d.tela}"`).toContain(d.tela);
    }
  });
});

/* ══ 3. Os conflitos ═════════════════════════════════════════════════════════════════════════ */

describe('os conflitos que impedem a Lista Mestra de identificar sozinha', () => {
  const cs = conflitos(EM);
  const por = (tipo: string) => cs.filter((x) => x.tipo === tipo);

  it('FM-011 identifica dois documentos vigentes, com acessos diferentes', () => {
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

  it('o vencimento é do sistema inteiro: uma carta para os 47, não 47 cartas iguais', () => {
    const v = por('revisao_vencida');
    expect(v).toHaveLength(2);                       // os 47 catalogados + a própria lista
    const emBloco = v.find((x) => x.codigo === null)!;
    expect(emBloco.titulo).toBe('49 documentos da lista mestra');
    expect(emBloco.detalhe).toContain('04/07/2026');
    expect(v.find((x) => x.codigo === 'LM-SGQ-001')!.detalhe).toContain('03/06/2025');
  });

  it('o Manual ESTÁ catalogado — o que não bate é a revisão', () => {
    // A lista traz rev. 01 de 03/06/2025; o arquivo em uso é rev. 00 de 05/03/2026.
    expect(doc('MQ-001').foraDaLista).toBeUndefined();
    const r = por('revisao_divergente').find((x) => x.codigo === 'MQ-001')!;
    expect(r.detalhe).toContain('planilha da lista mestra traz rev. 01');
    expect(r.detalhe).toContain('arquivo em uso é rev. 00 de 05/03/2026');
    expect(r.detalhe).toContain('Vale o arquivo');
  });

  it('o arquivo real de oito documentos usa outro código', () => {
    const paralelos = por('codigo_paralelo');
    expect(paralelos.find((x) => x.codigo === 'FM-001')!.detalhe).toContain('MJ-OP-01');
    expect(paralelos.find((x) => x.codigo === 'PO-002')!.detalhe).toContain('MJ-RAI-01');
    expect(paralelos).toHaveLength(8);
  });

  it('a Lista de Presença usa um prefixo que a Legenda não conhece', () => {
    const fora = por('fora_da_lista').find((x) => x.codigo === 'TR-001')!;
    expect(fora.gravidade).toBe('alta');
    expect(fora.detalhe).toContain('FM-009');
    const prefixo = por('prefixo_desconhecido').find((x) => x.codigo === 'TR-001')!;
    expect(prefixo.detalhe).toContain('PSSMA');
    expect(doc('TR-001').revisao).toBe('01');
  });

  it('a Lista Mestra não tem quem a elaborou nem quem a aprovou', () => {
    expect(LISTA_MESTRA_META.aprovadoPor).toBeNull();
    const s = por('sem_aprovacao')[0];
    expect(s.detalhe).toContain('7.5.2');
  });

  it('os registros sem código nenhum aparecem sem código, não com rótulo inventado', () => {
    const semCodigo = por('fora_da_lista').filter((x) => x.codigo === null);
    expect(semCodigo).toHaveLength(5);
    expect(semCodigo.map((x) => x.titulo)).toContain('Plano de Calibração');
  });

  it('oito documentos circulam fora da lista', () => {
    // SWOT, Lista de Presença, avaliação de impacto de calibração e 5 registros sem código.
    expect(por('fora_da_lista')).toHaveLength(8);
  });

  it('nada disso é histórico: é tudo documento vigente', () => {
    expect(LISTA_MESTRA.every((d) => d.situacao === 'vigente')).toBe(true);
  });
});
