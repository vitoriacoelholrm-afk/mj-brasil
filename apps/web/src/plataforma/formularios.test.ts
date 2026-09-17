// As definições de formulário.
//
// O que estes testes guardam é a NORMA, não a tela. Um campo obrigatório aqui não é preferência
// de quem desenhou: é a frase da cláusula virada em regra. Se alguém tirar um deles, o registro
// passa a fechar sem provar o que a norma manda provar — e ninguém percebe até a auditoria.
import { describe, it, expect } from 'vitest';
import {
  CONTROLE_CARGAS, FORMULARIOS, MONITORAMENTO_SGQ, MUDANCA_PRODUCAO, NAO_CONFORMIDADE,
  PROPRIEDADE_CLIENTE,
  REGISTRO_TREINAMENTO,
  campoVisivel, formularioDoPapel, pendencias, resumoDoRegistro,
  type FormularioDef, type Valores,
} from './formularios';
import { MINASJATO } from '@/empresas/minasjato';

const obrigatorios = (def: FormularioDef) =>
  def.campos.filter((c) => c.obrigatorio).map((c) => c.chave);

const faltando = (def: FormularioDef, valores: Valores) =>
  pendencias(def, valores).map((c) => c.chave);

/* ══ 1. Coerência — vale para qualquer definição, inclusive as que ainda não existem ═════════ */

describe('toda definição se sustenta sozinha', () => {
  it.each(FORMULARIOS.map((d) => [d.titulo, d] as const))('%s', (_titulo, def) => {
    const chaves = def.campos.map((c) => c.chave);
    expect(new Set(chaves).size, 'chave repetida').toBe(chaves.length);

    for (const campo of def.campos) {
      // Escolha sem opção é uma caixa vazia; opção em campo que não é escolha ninguém lê.
      if (campo.tipo === 'escolha') expect(campo.opcoes?.length, campo.chave).toBeGreaterThan(1);
      else expect(campo.opcoes, campo.chave).toBeUndefined();

      // Dependência para campo que não existe esconde o campo para sempre — e, se ele for
      // obrigatório, o registro nunca fecha e ninguém entende por quê.
      if (campo.dependeDe) {
        expect(chaves, campo.chave).toContain(campo.dependeDe.campo);
        const pai = def.campos.find((c) => c.chave === campo.dependeDe!.campo)!;
        const valores = pai.tipo === 'sim_nao' ? ['Sim', 'Não'] : pai.opcoes!;
        const esperados = Array.isArray(campo.dependeDe.valor)
          ? campo.dependeDe.valor : [campo.dependeDe.valor];
        for (const v of esperados) expect(valores, campo.chave).toContain(v);
      }
    }
  });

  it('todo formulário tem cláusula e explicação — é o que a tela mostra no topo', () => {
    for (const def of FORMULARIOS) {
      expect(def.clausula, def.papel).toMatch(/\d/);
      expect(def.explicacao.length, def.papel).toBeGreaterThan(40);
    }
  });

  it('todo papel definido tem código na empresa, senão a tela não sabe que documento é', () => {
    for (const def of FORMULARIOS) {
      expect(MINASJATO.formularios[def.papel], def.papel).toMatch(/^FM-\d{3}$/);
      expect(formularioDoPapel(def.papel)).toBe(def);
    }
  });
});

/* ══ 2. A 8.7.2 — o que se fez com a PEÇA ════════════════════════════════════════════════════ */

const RNC_MINIMO: Valores = {
  detectadaEm: '2026-09-16', detectadaPor: 'Marcos Teixeira', origem: 'Inspeção final',
  peca: 'Câmara MOD-250 nº 14',
  descricao: 'Espessura de 62 µm no ponto 4; especificado 100 µm.',
  disposicao: 'Sucateamento', acoesTomadas: 'Peça segregada e descartada.',
  concessao: 'Não', autoridade: 'Sofia Lima',
};

describe('8.7.2 — a saída não conforme', () => {
  it('os quatro campos da cláusula são obrigatórios', () => {
    // a) descreva a NC · b) descreva as ações tomadas · c) as concessões · d) quem decidiu.
    expect(obrigatorios(NAO_CONFORMIDADE)).toEqual(expect.arrayContaining([
      'descricao', 'disposicao', 'concessao', 'autoridade',
    ]));
  });

  it('com os quatro preenchidos, o registro fecha', () => {
    expect(faltando(NAO_CONFORMIDADE, RNC_MINIMO)).toEqual([]);
  });

  it('sem dizer quem decidiu, não fecha — é o campo que quase todo RNC esquece', () => {
    expect(faltando(NAO_CONFORMIDADE, { ...RNC_MINIMO, autoridade: '' })).toEqual(['autoridade']);
  });

  it('dizer que houve concessão obriga a dizer de quem e quando', () => {
    // Concessão é o cliente aceitar por escrito. "Houve" sem nome e sem data não prova nada.
    expect(faltando(NAO_CONFORMIDADE, { ...RNC_MINIMO, concessao: 'Sim' }))
      .toEqual(['concedidaPor', 'concessaoEm']);
  });

  it('peça retrabalhada tem de ser reverificada; peça sucateada, não', () => {
    const rever = NAO_CONFORMIDADE.campos.find((c) => c.chave === 'reverificado')!;
    expect(campoVisivel(rever, { disposicao: 'Sucateamento' })).toBe(false);
    expect(campoVisivel(rever, { disposicao: 'Correção / retrabalho' })).toBe(true);
    expect(faltando(NAO_CONFORMIDADE, { ...RNC_MINIMO, disposicao: 'Correção / retrabalho' }))
      .toEqual(['reverificado']);
  });

  it('a causa e a ação corretiva não travam o registro — são 10.2.2, e vêm depois', () => {
    // Exigir a causa na hora de abrir o RNC faz a pessoa inventar uma para conseguir salvar.
    for (const chave of ['causa', 'acaoCorretiva', 'eficaciaVerificadaPor']) {
      expect(obrigatorios(NAO_CONFORMIDADE), chave).not.toContain(chave);
    }
  });
});

/* ══ 3. A 9.1.1 — o indicador do sistema ═════════════════════════════════════════════════════ */

const INDICADOR: Valores = {
  periodo: 'Agosto/2026', indicador: 'Retrabalho por OS', meta: 'até 5%', resultado: '3,2%',
  atingiu: 'Sim', analise: 'Terceiro mês dentro da meta.',
  apuradoPor: 'Ana Ribeiro', data: '2026-09-01',
};

describe('9.1.1 — os indicadores', () => {
  it('meta atingida fecha o registro', () => {
    expect(faltando(MONITORAMENTO_SGQ, INDICADOR)).toEqual([]);
  });

  it('meta NÃO atingida exige a ação — indicador estourado sem ação é achado', () => {
    expect(faltando(MONITORAMENTO_SGQ, { ...INDICADOR, atingiu: 'Não' })).toEqual(['acao']);
  });

  it('a análise é obrigatória: a 9.1.3 pede dado analisado, não dado coletado', () => {
    expect(faltando(MONITORAMENTO_SGQ, { ...INDICADOR, analise: '' })).toEqual(['analise']);
  });

  it('a linha da lista mostra período e indicador, que é como se procura', () => {
    expect(resumoDoRegistro(MONITORAMENTO_SGQ, INDICADOR))
      .toBe('Agosto/2026 · Retrabalho por OS · até 5%');
  });
});

/* ══ 4. As duas de 16/09, que continuam valendo ══════════════════════════════════════════════ */

describe('8.5.3 e 8.5.6 seguem em pé', () => {
  it('a 8.5.3 pede comunicar E registrar: marcar que comunicou abre os campos da prova', () => {
    const base: Valores = {
      cliente: 'Cliente A Indústria Ltda', peca: 'Câmara MOD-250 nº 14',
      ocorrencia: 'Danificada', descricao: 'Flange amassado no transporte.',
      data: '2026-09-16', constatadoPor: 'Marcos Teixeira', comunicado: 'Não',
    };
    expect(faltando(PROPRIEDADE_CLIENTE, base)).toEqual([]);
    expect(faltando(PROPRIEDADE_CLIENTE, { ...base, comunicado: 'Sim' }))
      .toEqual(['comunicadoA', 'comunicadoEm']);
  });

  it('a 8.5.6 retém as três coisas: resultado, quem autorizou e as ações', () => {
    expect(obrigatorios(MUDANCA_PRODUCAO)).toEqual(expect.arrayContaining([
      'resultado', 'autorizadoPor',
    ]));
  });
});

/* ══ 5. A 7.2 — competência ══════════════════════════════════════════════════════════════════ */

const TREINO: Valores = {
  colaborador: 'Marcos Teixeira', funcao: 'Inspetor de pintura',
  treinamento: 'Medição de espessura de película seca', tipo: 'Interno',
  instrutor: 'Ana Ribeiro', data: '2026-09-17', eficacia: 'A avaliar',
};

describe('7.2 — treinamento dado, e se funcionou', () => {
  it('o registro fecha com a eficácia ainda por avaliar', () => {
    // O prazo de avaliar costuma ser depois. Travar aqui faria a pessoa inventar uma nota.
    expect(faltando(REGISTRO_TREINAMENTO, TREINO)).toEqual([]);
  });

  it('dizer que foi eficaz obriga a dizer como se soube, e quem julgou', () => {
    // Lista de presença prova que a pessoa sentou na sala. Não prova que ficou competente.
    expect(faltando(REGISTRO_TREINAMENTO, { ...TREINO, eficacia: 'Eficaz' }))
      .toEqual(['comoAvaliado', 'avaliadoPor']);
  });

  it('e dizer que não foi obriga a dizer o que se fez a respeito', () => {
    expect(faltando(REGISTRO_TREINAMENTO, { ...TREINO, eficacia: 'Não eficaz' }))
      .toEqual(['acaoSeNaoEficaz']);
  });

  it('e é o registro de onde sai o indicador de eficácia de treinamento', () => {
    expect(REGISTRO_TREINAMENTO.clausula).toBe('7.2');
    expect(MINASJATO.formularios.registro_treinamento).toBe('FM-009');
  });
});

/* ══ 6. A portaria ═══════════════════════════════════════════════════════════════════════════ */

const CARGA: Valores = {
  sentido: 'Entrada', data: '2026-09-17', hora: '07:40',
  tipo: 'Matéria-prima ou insumo da empresa', parte: 'Fornecedor de abrasivo',
  placa: 'ABC1D23', motorista: 'José da Silva', registradoPor: 'Beatriz Nogueira',
};

describe('portaria — o que passou pelo portão', () => {
  it('carga comum fecha com veículo, motorista e horário', () => {
    expect(faltando(CONTROLE_CARGAS, CARGA)).toEqual([]);
  });

  it('o que é do cliente obriga a dizer em que estado chegou — peça OU insumo', () => {
    // A portaria não inspeciona, mas é quem vê primeiro. Avaria vista no portão e não
    // registrada vira discussão sobre quem amassou. E a 8.5.3 não fala de peça: fala de
    // propriedade do cliente, que pode chegar como lata de tinta.
    expect(faltando(CONTROLE_CARGAS, { ...CARGA, tipo: 'Peça de cliente' })).toEqual(['estado']);
    expect(faltando(CONTROLE_CARGAS, { ...CARGA, tipo: 'Matéria-prima ou insumo do cliente' }))
      .toEqual(['estado']);
  });

  it('e o insumo da própria empresa não pergunta nada disso', () => {
    expect(faltando(CONTROLE_CARGAS, { ...CARGA, tipo: 'Matéria-prima ou insumo da empresa' }))
      .toEqual([]);
  });

  it('e avaria aparente obriga a descrever e a dizer quem foi avisado', () => {
    expect(faltando(CONTROLE_CARGAS, {
      ...CARGA, tipo: 'Peça de cliente', estado: 'Avaria aparente',
    })).toEqual(['descricaoAvaria', 'avisou']);
  });

  it('o estado só aparece para o que é do cliente', () => {
    const estado = CONTROLE_CARGAS.campos.find((c) => c.chave === 'estado')!;
    expect(campoVisivel(estado, { tipo: 'Resíduo' })).toBe(false);
    expect(campoVisivel(estado, { tipo: 'Matéria-prima ou insumo da empresa' })).toBe(false);
    expect(campoVisivel(estado, { tipo: 'Peça de cliente' })).toBe(true);
    expect(campoVisivel(estado, { tipo: 'Matéria-prima ou insumo do cliente' })).toBe(true);
  });

  it('é registro próprio, e não o recebimento nem o romaneio', () => {
    // FM-006 e FM-007 inspecionam a carga; este registra o veículo passando. Fatos diferentes,
    // e juntá-los faria a portaria assinar uma inspeção que ela não fez.
    expect(MINASJATO.formularios.controle_cargas).toBe('FM-023');
    expect(MINASJATO.formularios.recebimento).toBe('FM-006');
    expect(MINASJATO.formularios.romaneio).toBe('FM-007');
    expect(CONTROLE_CARGAS.setor).toBe('portaria');
  });
});
