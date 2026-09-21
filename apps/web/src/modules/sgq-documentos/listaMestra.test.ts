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
    // 47 + FM-020 a FM-026 + PO-009 + a TR-001, que entrou já aposentada em 21/09/2026.
    expect(CATALOGADOS).toHaveLength(56);
  });

  it('e o app acusa que o cabeçalho da planilha ficou para trás', () => {
    const c = conflitos(EM).find((x) => x.tipo === 'contagem_divergente')!;
    expect(c.detalhe).toContain('declara 47');
    expect(c.detalhe).toContain('tem 56');
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
    expect(cats.reduce((n, x) => n + x.total, 0)).toBe(56);
    // RH foi de 3 para 4: a Lista de Presença entrou na lista mestra, ainda que aposentada. O
    // obsoleto conta na CONTAGEM — ele existe e é controlado; o que ele não faz é cobrir cláusula.
    expect(cats.find((x) => x.categoria === 'RH')!.total).toBe(4);
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
      'cargas', 'plano-acao', 'plano-auditoria', 'satisfacao',
      'pedido-compra', 'recebimento', 'avaliacao-fornecedor', 'romaneio']);
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
    // 51, e não 56. Fora da conta ficam os três reservados em 21/09/2026 — documento que ainda não
    // foi escrito não tem revisão para vencer — e os dois aposentados no mesmo dia, pela razão
    // oposta: documento que saiu de circulação não vence, porque não vai ser revisado nunca mais.
    expect(emBloco.titulo).toBe('51 documentos da lista mestra');
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

  it('a Lista de Presença foi aposentada, e o aposentado para de gerar achado', () => {
    // Ela circulava fora da lista, com um prefixo (TR) que a Legenda não conhece — dois achados.
    // Em 21/09/2026 ela entrou na lista mestra já obsoleta, absorvida pelo FM-009, e os dois
    // fecharam junto. Não é que o problema tenha sido escondido: o documento parou de existir.
    expect(doc('TR-001').situacao).toBe('obsoleto');
    expect(doc('TR-001').revisao).toBe('01');           // guarda a revisão em que parou
    expect(doc('TR-001').foraDaLista).toBeUndefined();
    expect(por('fora_da_lista').find((x) => x.codigo === 'TR-001')).toBeUndefined();
    expect(por('prefixo_desconhecido').find((x) => x.codigo === 'TR-001')).toBeUndefined();
    // E o código não volta a circular: quem distribui código novo continua enxergando o TR-001.
    expect(doc('TR-001').proximaRevisao).toBeNull();
  });

  it('o mesmo vale para o PRH-002, que virou capítulo do PRH-001', () => {
    expect(doc('PRH-002').situacao).toBe('obsoleto');
    expect(doc('PRH-002').clausulas).toEqual(['7.3']);   // integração é conscientização, não 7.2
    expect(doc('PRH-001').titulo).toContain('Integração');
    expect(doc('PRH-001').clausulas).toEqual(['7.2', '7.3']);
    // O herdeiro é que declara os dois padrões — senão a cobertura ficaria de pé pelo morto.
    expect(doc('PRH-001').padroes).toEqual(['competencia_treinamento', 'conscientizacao']);
  });

  it('o FM-009 agora se anuncia como tela — ela já existia e a lista não dizia', () => {
    expect(doc('FM-009').tela).toBe('treinamento');
    expect(doc('FM-009').clausulas).toEqual(['7.2', '7.3']);
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

  it('seis documentos circulam fora da lista', () => {
    // Avaliação de impacto de calibração e 5 registros sem código. Eram oito em 16/09: a SWOT
    // entrou como FM-024, e a Lista de Presença entrou aposentada — dois saíram da fila por
    // motivos opostos, um por ter virado documento e outro por ter deixado de ser.
    expect(por('fora_da_lista')).toHaveLength(6);
  });

  it('o miolo do sistema está com a consultoria — mas o POSTO existe, e isso muda o achado', () => {
    // Confirmado por ela em 21/09/2026, depois de eu ler o manual: o "RQ" dos dez documentos é o
    // Coordenador da Qualidade do MQ-001 §5.3, e não um rótulo solto. O posto está descrito,
    // ligado à Alta Direção, com as responsabilidades listadas.
    //
    // Logo a §5.3 ESTÁ atendida. Meu primeiro achado dizia o contrário e estava errado: acusar
    // falta de atribuição onde o manual atribui faz a empresa defender na auditoria o que ninguém
    // perguntou, e deixa a pergunta real — a da sucessão — sem resposta.
    const c = por('responsavel_externo');
    expect(c).toHaveLength(1);               // uma carta por rótulo, não dez cartas iguais
    expect(c[0].titulo).toBe('10 documentos sob "RQ"');
    expect(c[0].gravidade).toBe('media');    // é o estado normal da implantação, não um erro
    expect(c[0].detalhe).toContain('Coordenador da Qualidade');
    expect(c[0].detalhe).toContain('§5.3 está atendida');
    expect(c[0].detalhe).toContain('sucessão, não de atribuição');
    // E diz QUAIS, porque a decisão é sobre documento e não sobre número.
    for (const codigo of ['PG-001', 'PG-004', 'PG-005', 'FM-003', 'FM-024']) {
      expect(c[0].detalhe, codigo).toContain(codigo);
    }
    // De quebra, aponta que os dois documentos controlados chamam o mesmo posto de dois jeitos.
    expect(c[0].detalhe).toContain('o manual diz "Coordenador da Qualidade"');
  });

  it('e é o rótulo que carrega isso — não o documento, um por um', () => {
    expect(responsavelDeFora('RQ')?.quem).toContain('consultoria');
    expect(responsavelDeFora('RQ')?.posto?.nome).toBe('Coordenador da Qualidade');
    expect(responsavelDeFora('RQ')?.posto?.onde).toContain('MQ-001');
    // Os postos ocupados por gente da casa continuam sem marca nenhuma.
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

    // E o que saiu de circulação diz que saiu. São os dois extremos da vida de um documento, e
    // nenhum dos dois pode passar por vigente: um nunca foi escrito, o outro não se usa mais.
    const obsoletos = LISTA_MESTRA.filter((d) => d.situacao === 'obsoleto');
    expect(obsoletos.map((d) => d.codigo).sort()).toEqual(['PRH-002', 'TR-001']);
    expect(obsoletos.every((d) => d.proximaRevisao === null)).toBe(true);
    expect(obsoletos.every((d) => (d.nota ?? '').includes('21/09/2026'))).toBe(true);

    const resto = LISTA_MESTRA.filter(
      (d) => d.situacao !== 'em_elaboracao' && d.situacao !== 'obsoleto');
    expect(resto.every((d) => d.situacao === 'vigente')).toBe(true);
  });
});
