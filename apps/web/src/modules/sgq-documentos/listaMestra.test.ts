// A Lista Mestra é a única fonte de código de documento. Estes testes são a trava: se alguém
// carimbar um código que não está catalogado, o app quebra aqui e não na auditoria.
import { describe, it, expect } from 'vitest';
// Registrar as empresas é do app, não deste módulo — por isso o teste faz explicitamente o que
// o `main` faz. Sem perfil ativo não há lista mestra: a ponte não inventa empresa nenhuma.
import '@/empresas';
import {
  carimbo, catalogados, conflitos, doc, legenda, listaMestra, listaMestraMeta,
  porCategoria, porClausula, proximoCodigoLivre, responsavelDeFora, significadoDoPrefixo,
} from './listaMestra';

const CATALOGADOS = catalogados();
const LISTA_MESTRA = listaMestra();
const LISTA_MESTRA_META = listaMestraMeta();
const PREFIXO_ROTULO = legenda();

const EM = new Date('2026-09-16');

/* ══ 1. O catálogo importado da planilha ═════════════════════════════════════════════════════ */

describe('os 47 documentos da LM-SGQ-001', () => {
  it('os 47 da planilha estão aqui, mais os que criamos depois', () => {
    expect(LISTA_MESTRA_META.totalCatalogado).toBe(47);   // o que a planilha declara
    expect(CATALOGADOS).toHaveLength(55);                  // 47 + FM-020 a FM-026 + PO-009
  });

  it('e o app acusa que o cabeçalho da planilha ficou para trás', () => {
    const c = conflitos(EM).find((x) => x.tipo === 'contagem_divergente')!;
    expect(c.detalhe).toContain('declara 47');
    expect(c.detalhe).toContain('tem 55');
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
    expect(cats.reduce((n, x) => n + x.total, 0)).toBe(55);
    // Operações lidera — é o processo que a empresa vende. Subiu de 14 para 16 em 21/09/2026,
    // com a política e o registro de pós-entrega.
    expect(cats[0]).toEqual({ categoria: 'Operações', total: 16 });
    // Gestão da Qualidade: 11 → 12 com a SWOT, → 13 com a matriz de comunicação.
    expect(cats.find((x) => x.categoria === 'Gestão da Qualidade')!.total).toBe(13);
  });

  it('dá para achar quem atende uma cláusula — é o que o auditor pergunta', () => {
    expect(porClausula('8.6').map((d) => d.codigo)).toContain('PQ-003');
    expect(porClausula('8.6').map((d) => d.codigo)).toContain('FM-002');
    // O manual entra em todas desde 21/09/2026, quando as cláusulas dele passaram a ser
    // declaradas por extenso em vez de por seção. É a mesma cobertura de antes, agora com
    // endereço: quem declarava a seção 7 já declarava a 7.1.5 junto, e a lista não mostrava.
    expect(porClausula('7.1.5').map((d) => d.codigo)).toEqual(['MQ-001', 'PQ-005', 'IT-004']);
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
    expect(proximoCodigoLivre('FM')).toBe('FM-027');   // FM-024 a FM-026 saíram em 21/09/2026
    expect(proximoCodigoLivre('IT')).toBe('IT-006');
  });

  it('toda tela declarada aponta para uma tela que existe', () => {
    const telas = new Set(['plano', 'instrumentos', 'lista-mestra', 'clientes', 'diagnostico', 'vencimentos', 'situacao', 'propriedade-cliente', 'mudanca-producao', 'nao-conformidade', 'indicadores', 'treinamento', 'comunicacao', 'pos-entrega',
      'cargas']);
    for (const d of LISTA_MESTRA) {
      if (d.tela) expect(telas, `${d.codigo} aponta para "${d.tela}"`).toContain(d.tela);
    }
  });
});

/* ══ 3. Os conflitos ═════════════════════════════════════════════════════════════════════════ */

describe('os conflitos que impedem a Lista Mestra de identificar sozinha', () => {
  const cs = conflitos(EM);
  const por = (tipo: string) => cs.filter((x) => x.tipo === tipo);

  it('o FM-011 deixou de identificar dois documentos — a SWOT saiu para o FM-024', () => {
    // Era o conflito de gravidade alta da lista: o Pedido de Compra (restrito) e a SWOT
    // (irrestrita) com o mesmo número. Resolvido em 21/09/2026 executando a proposta que o
    // próprio plano de unificação já fazia. Quem mudou foi a SWOT: o FM-011 do pedido já tinha
    // saído da empresa no 245-96 enviado à RINA, e código que circulou não se renumera.
    expect(por('codigo_duplicado').find((x) => x.codigo === 'FM-011')).toBeUndefined();
    expect(doc('FM-024').titulo).toContain('SWOT');
    expect(doc('FM-024').foraDaLista).toBeUndefined();
    expect(doc('FM-011').titulo).toContain('Pedido de Compra');
  });

  it('mas o FM-024 continua acusando que as cópias dizem FM-011', () => {
    // A pendência mudou de natureza, não sumiu: o arquivo e a Lista Mestra em papel ainda trazem
    // o código antigo. Enquanto trouxerem, o sistema aponta — não é ruído, é o que falta fazer
    // fora do app.
    const p = por('codigo_paralelo').find((x) => x.codigo === 'FM-024')!;
    expect(p.detalhe).toContain('FM-011');
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
    // 52, e não 55: os três reservados em 21/09/2026 não entram na conta do vencimento. Documento
    // que ainda não foi escrito não tem revisão para vencer.
    expect(emBloco.titulo).toBe('52 documentos da lista mestra');
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

  it('o arquivo real de nove documentos usa outro código', () => {
    const paralelos = por('codigo_paralelo');
    expect(paralelos.find((x) => x.codigo === 'FM-001')!.detalhe).toContain('MJ-OP-01');
    expect(paralelos.find((x) => x.codigo === 'PO-002')!.detalhe).toContain('MJ-RAI-01');
    // Eram oito. O nono é a SWOT, renumerada em 21/09/2026: as cópias ainda dizem FM-011.
    expect(paralelos).toHaveLength(9);
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

  it('sete documentos circulam fora da lista', () => {
    // Lista de Presença, avaliação de impacto de calibração e 5 registros sem código.
    // Eram oito: a SWOT entrou na lista em 21/09/2026, como FM-024.
    expect(por('fora_da_lista')).toHaveLength(7);
  });

  it('a coluna Responsável diz quem é de fora — e o miolo do sistema está com a consultoria', () => {
    // Confirmado por ela em 21/09/2026: o "RQ" dos dez documentos é a consultoria, não um posto da
    // Minasjato. Na planilha ele aparece na mesma coluna que "Ger. Qualidade", e quem lê conclui
    // que tem dono lá dentro. Não tem.
    const c = por('responsavel_externo');
    expect(c).toHaveLength(1);               // uma carta por rótulo, não dez cartas iguais
    expect(c[0].titulo).toBe('10 documentos sob "RQ"');
    expect(c[0].detalhe).toContain('§5.3');  // atribuir responsabilidades DENTRO da organização
    expect(c[0].gravidade).toBe('media');    // é o estado normal da implantação, não um erro
    // E diz QUAIS, porque a decisão é sobre documento e não sobre número.
    for (const codigo of ['PG-001', 'PG-004', 'PG-005', 'FM-003', 'FM-024']) {
      expect(c[0].detalhe, codigo).toContain(codigo);
    }
  });

  it('e é o rótulo que carrega isso — não o documento, um por um', () => {
    expect(responsavelDeFora('RQ')?.quem).toContain('consultoria');
    // Os postos da própria empresa continuam sendo postos da empresa.
    expect(responsavelDeFora('Ger. Qualidade')).toBeNull();
    expect(responsavelDeFora('Dir. Geral')).toBeNull();
    expect(responsavelDeFora(null)).toBeNull();
    // A conta fecha com a lista: dez documentos, e não uma amostra.
    expect(LISTA_MESTRA.filter((d) => responsavelDeFora(d.responsavel)).length).toBe(10);
  });

  it('nada disso é histórico — e o que ainda não foi escrito diz que não foi', () => {
    // Três códigos foram RESERVADOS em 21/09/2026 sem o documento existir: a matriz de
    // comunicação e as duas peças do pós-entrega. Entram como `em_elaboracao`, e não como
    // vigentes, porque a lista mestra é o que o auditor lê — dizer "vigente" num documento que
    // ninguém escreveu é a lista afirmar que existe papel onde há intenção.
    const emElaboracao = LISTA_MESTRA.filter((d) => d.situacao === 'em_elaboracao');
    expect(emElaboracao.map((d) => d.codigo).sort()).toEqual(['FM-025', 'FM-026', 'PO-009']);
    // E documento que não nasceu não tem data de nascimento.
    expect(emElaboracao.every((d) => d.emissao === null && d.revisao === null)).toBe(true);

    const resto = LISTA_MESTRA.filter((d) => d.situacao !== 'em_elaboracao');
    expect(resto.every((d) => d.situacao === 'vigente')).toBe(true);
  });
});
