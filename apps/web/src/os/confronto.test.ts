// Confronto entre a ORDEM DE SERVIÇO e o RELATÓRIO que saiu dela.
//
// As duas OS da WEIR entram aqui com os seus relatórios juntos. Hoje essa conferência depende de
// alguém pôr um papel ao lado do outro; a partir daqui é do sistema.
import { describe, it, expect } from 'vitest';
import { avaliarMedicao, resumirOs } from './regras';
import { ORDENS, compararComRelatorio } from './exemplos';

const os898 = ORDENS.find((o) => o.folio === '898')!;
const os913 = ORDENS.find((o) => o.folio === '913')!;

const acha = (os: typeof os898, trecho: string) =>
  compararComRelatorio(os).find((d) => d.onde.includes(trecho));

/* ══ 1. OS 898 — a rugosidade fora da faixa ══════════════════════════════════════════════════ */

describe('OS 898 — rugosidade medida fora da faixa do próprio papel', () => {
  it('85 µm contra a faixa 50-70 é não conforme, e o sistema diz por quê', () => {
    const m = os898.etapas[0].medicoes.find((x) => x.grandeza === 'padrao_rugosidade')!;
    expect(m.especificado).toBe('50-70');
    expect(m.encontrado).toBe('85');
    const r = avaliarMedicao(m);
    expect(r.resultado).toBe('nao_conforme');
    expect(r.motivo).toContain('fora da faixa 50–70');
  });

  it('a OS não libera — e desta vez o motivo é reprovação, não falta de dado', () => {
    const r = resumirOs(os898.etapas);
    expect(r.naoConformes).toBe(1);
    expect(r.liberavel).toBe(false);
    expect(r.divergencias[0].grandeza).toBe('padrao_rugosidade');
  });

  it('as espessuras das três demãos estão todas acima do mínimo', () => {
    const secas = os898.etapas
      .filter((e) => e.ativa && e.etapa !== 'jateamento')
      .map((e) => e.medicoes.find((m) => m.grandeza === 'camada_seca')!);
    expect(secas.map((m) => [m.especificado, m.encontrado])).toEqual([['100', '120'], ['100', '126'], ['70', '75']]);
    expect(secas.every((m) => avaliarMedicao(m).resultado === 'conforme')).toBe(true);
  });

  it('o papel tem data e assinatura na camada úmida e no visual, mas nenhum valor', () => {
    const fundo = os898.etapas.find((e) => e.etapa === 'fundo')!;
    const umida = fundo.medicoes.find((m) => m.grandeza === 'camada_umida')!;
    expect(umida.dataInspecao).toBe('2026-06-03');
    expect(umida.encontrado).toBeNull();
    expect(avaliarMedicao(umida).resultado).toBe('pendente');
  });

  it('medição numérica sem instrumento é cobrada — a OS da WEIR não tem essa coluna', () => {
    const r = resumirOs(os898.etapas);
    expect(r.problemas.every((p) => p.codigo === 'INSTRUMENTO_OBRIGATORIO')).toBe(true);
    expect(r.problemas.length).toBeGreaterThan(0);
  });
});

describe('OS 898 × relatório WEIR-04', () => {
  const d = compararComRelatorio(os898);

  it('o relatório declara a mesma OS, então não há divergência de número', () => {
    expect(os898.relatorio!.osReferida).toBe('898-26');
    expect(acha(os898, 'Número da OS')).toBeUndefined();
  });

  it('a rugosidade é o achado: 85 no Plano, 75 no relatório do cliente', () => {
    const x = acha(os898, 'rugosidade')!;
    expect(x.naOs).toBe('85');
    expect(x.noRelatorio).toBe('75');
    expect(x.gravidade).toBe('alta');
  });

  it('espessuras e datas das duas primeiras demãos batem', () => {
    expect(d.filter((x) => x.onde.startsWith('1ª') && !x.onde.includes('lote'))).toHaveLength(0);
    expect(d.filter((x) => x.onde.startsWith('2ª') && !x.onde.includes('lote'))).toHaveLength(0);
  });

  it('só a data de inspeção da 3ª demão destoa: 08/06 no Plano, 09/06 no relatório', () => {
    const x = acha(os898, '3ª demão (Intermediário II) · data de inspeção')!;
    expect([x.naOs, x.noRelatorio]).toEqual(['2026-06-08', '2026-06-09']);
  });

  it('o lote de cada demão só existe no relatório — no Plano está em branco', () => {
    const lotes = d.filter((x) => x.onde.includes('lote'));
    expect(lotes).toHaveLength(3);
    expect(lotes.every((x) => x.naOs === null && x.gravidade === 'alta')).toBe(true);
    expect(lotes[0].noRelatorio).toContain('125120112');
    expect(lotes[0].nota).toContain('MJ-RAI-01');
  });
});

/* ══ 2. OS 913 — o Plano e o relatório contam demãos diferentes ══════════════════════════════ */

describe('OS 913 — tudo conforme no papel, e ainda assim não fecha', () => {
  const r = resumirOs(os913.etapas);

  it('a rugosidade de 78 cai dentro da faixa 50-100 desta OS', () => {
    const m = os913.etapas[0].medicoes.find((x) => x.grandeza === 'padrao_rugosidade')!;
    expect(avaliarMedicao(m).resultado).toBe('conforme');
  });

  it('nada é reprovado, mas camada úmida e visual ficam pendentes', () => {
    expect(r.naoConformes).toBe(0);
    expect(r.pendentes).toBeGreaterThan(0);
    expect(r.liberavel).toBe(false);
  });

  it('as duas OS da WEIR especificam faixas de rugosidade diferentes para o mesmo esquema', () => {
    const f898 = os898.etapas[0].medicoes.find((m) => m.grandeza === 'padrao_rugosidade')!.especificado;
    const f913 = os913.etapas[0].medicoes.find((m) => m.grandeza === 'padrao_rugosidade')!.especificado;
    expect(os898.esquemaPintura).toBe(os913.esquemaPintura);
    expect(f898).not.toBe(f913);
  });
});

describe('OS 913 × relatório WEIR-05', () => {
  const d = compararComRelatorio(os913);

  it('o Plano tem 2 demãos e o relatório entrega 3 — é o primeiro alerta', () => {
    const x = acha(os913, 'Quantidade de demãos')!;
    expect(x.naOs).toBe('2 — Fundo, Intermediário I');
    expect(x.noRelatorio).toBe('3');
    expect(x.gravidade).toBe('alta');
  });

  it('a data do jateamento difere: 11/06 no Plano, 12/06 no relatório', () => {
    const x = acha(os913, 'Jateamento · data')!;
    expect([x.naOs, x.noRelatorio]).toEqual(['2026-06-11', '2026-06-12']);
  });

  it('a espessura de fundo é o buraco maior: 180/200 no Plano, 100/110 no relatório', () => {
    expect(acha(os913, '1ª demão (Fundo) · espessura especificada')).toMatchObject({ naOs: '180', noRelatorio: '100' });
    expect(acha(os913, '1ª demão (Fundo) · espessura medida')).toMatchObject({ naOs: '200', noRelatorio: '110' });
  });

  it('a 2ª demão do Plano não é a 2ª do relatório — por isso tudo nela destoa', () => {
    const segunda = d.filter((x) => x.onde.startsWith('2ª') && !x.onde.includes('lote'));
    expect(segunda.map((x) => x.onde.split(' · ')[1]).sort()).toEqual([
      'data de aplicação', 'data de inspeção', 'espessura especificada', 'espessura medida',
    ]);
  });

  it('o confronto é bem mais grave aqui do que na 898', () => {
    expect(d.filter((x) => x.gravidade === 'alta').length)
      .toBeGreaterThan(compararComRelatorio(os898).filter((x) => x.gravidade === 'alta').length);
  });
});

/* ══ 3. O que o confronto NÃO faz ════════════════════════════════════════════════════════════ */

describe('limites do confronto', () => {
  it('campo vazio de um lado é falta de registro, não desacordo', () => {
    // O grau de intemperismo da 898 ficou em branco de propósito: ilegível no original.
    expect(acha(os898, 'grau de intemperismo')).toBeUndefined();
  });

  it('quando a diferença pode ser da caligrafia, isso vem escrito junto', () => {
    // Na 913 o papel traz uma abreviação que não é o "A" do relatório.
    expect(acha(os913, 'grau de intemperismo')!.nota).toContain('caligrafia');
  });

  it('OS sem relatório transcrito não inventa confronto nenhum', () => {
    const os748 = ORDENS.find((o) => o.folio === '748')!;
    expect(os748.relatorio).toBeUndefined();
    expect(compararComRelatorio(os748)).toEqual([]);
  });
});
