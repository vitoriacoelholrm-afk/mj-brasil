// Unificação: um registro só, e o relatório gerado dele.
//
// Antes, a ordem de serviço e o relatório guardavam os mesmos números digitados duas vezes, e a
// conferência dependia de alguém pôr um papel ao lado do outro. Aqui os dois viram um. O que
// sobra do confronto é o que realmente aconteceu na oficina — e o que o papel dizia continua
// guardado em `noPapel`, porque decidir qual é o verdadeiro é de quem assina.
import { describe, it, expect } from 'vitest';
import { avaliarMedicao, resumirOs } from './regras';
import { faixaTolerada } from './vocabulario';
import { ORDENS, compararComRelatorio, gerarRelatorio, impedimentosDoRelatorio } from './exemplos';

const os898 = ORDENS.find((o) => o.folio === '898')!;
const os913 = ORDENS.find((o) => o.folio === '913')!;
const etapa = (os: typeof os898, nome: string) => os.etapas.find((e) => e.etapa === nome)!;
const med = (os: typeof os898, nome: string, grandeza: string) =>
  etapa(os, nome).medicoes.find((m) => m.grandeza === grandeza)!;

/* ══ 1. A unificação fecha o confronto ═══════════════════════════════════════════════════════ */

describe('a unificação zera as diferenças entre os dois documentos', () => {
  it('OS 898 não tem mais nenhuma diferença contra o WEIR-04', () => {
    expect(compararComRelatorio(os898)).toEqual([]);
  });

  it('OS 913 não tem mais nenhuma diferença contra o WEIR-05 — eram 12', () => {
    expect(compararComRelatorio(os913)).toEqual([]);
  });

  it('os lotes deixaram de existir só no relatório: agora nascem na OS', () => {
    // MJ-RAI-01 §8 manda registrar o lote na ordem de produção. Era a falha mais séria.
    expect(os898.tintas.fundo?.loteA).toBe('125120112');
    expect(os913.tintas.intermediario_ii?.loteA).toBe('126010062');
  });

  it('o instrumento passou a ser declarado em cada medição numérica', () => {
    expect(med(os898, 'jateamento', 'padrao_rugosidade').instrumentoCodigo).toBe('RL-01');
    expect(med(os913, 'fundo', 'camada_seca').instrumentoCodigo).toBe('232212');
    expect(resumirOs(os898.etapas).problemas).toEqual([]);
  });
});

/* ══ 2. Nada do papel se perdeu ══════════════════════════════════════════════════════════════ */

describe('o que o papel dizia fica guardado', () => {
  it('a rugosidade de 85 da OS 898 continua registrada ao lado do 75 adotado', () => {
    const m = med(os898, 'jateamento', 'padrao_rugosidade');
    expect(m.encontrado).toBe('75');
    expect(m.noPapel?.encontrado).toBe('85');
  });

  it('e o 85 não passaria: 50-70 com tolerância aceita até 84', () => {
    const m = med(os898, 'jateamento', 'padrao_rugosidade');
    expect(faixaTolerada(50, 70)).toEqual({ min: 45, max: 84 });
    expect(avaliarMedicao(m).resultado).toBe('conforme');                      // 75 passa
    expect(avaliarMedicao({ ...m, encontrado: '85' }).resultado).toBe('nao_conforme');
  });

  it('a espessura de fundo da OS 913 guarda os 180/200 do papel', () => {
    const m = med(os913, 'fundo', 'camada_seca');
    expect([m.especificado, m.encontrado]).toEqual(['100', '110']);
    expect(m.noPapel).toMatchObject({ especificado: '180', encontrado: '200', dataInspecao: '2026-06-13' });
  });

  it('a demão que o papel não registrou entrou marcada como tal', () => {
    const ausentes = os913.etapas.filter((e) => e.ausenteNoPapel);
    expect(ausentes.map((e) => e.etapa)).toEqual(['intermediario_i']);
    expect(os913.etapas.filter((e) => e.ativa && e.etapa !== 'jateamento')).toHaveLength(3);
  });
});

/* ══ 3. O que sobrevive à unificação é o achado de verdade ═══════════════════════════════════ */

describe('OS 898 — a camada que saiu grossa', () => {
  it('126 µm sobre 100 são +26%, acima da tolerância de +20%', () => {
    const m = med(os898, 'intermediario_i', 'camada_seca');
    expect([m.especificado, m.encontrado]).toEqual(['100', '126']);
    const r = avaliarMedicao(m);
    expect(r.resultado).toBe('nao_conforme');
    expect(r.motivo).toContain('26% acima de 100µm');
  });

  it('não é erro de transcrição: os dois documentos dizem 126', () => {
    expect(med(os898, 'intermediario_i', 'camada_seca').encontrado).toBe('126');
    expect(os898.relatorio!.demaos[1].espessuraEncontrada).toBe('126');
    expect(med(os898, 'intermediario_i', 'camada_seca').noPapel).toBeUndefined();
  });

  it('a 1ª demão, com exatamente +20%, passa', () => {
    expect(avaliarMedicao(med(os898, 'fundo', 'camada_seca')).resultado).toBe('conforme');
  });

  it('é a única reprovação que resta, e ela segura a OS', () => {
    const r = resumirOs(os898.etapas);
    expect(r.naoConformes).toBe(1);
    expect(r.liberavel).toBe(false);
  });
});

describe('OS 913 — com as três demãos no lugar, tudo cabe na tolerância', () => {
  const r = resumirOs(os913.etapas);

  it('100/110, 100/108 e 70/76 passam todas', () => {
    const secas = ['fundo', 'intermediario_i', 'intermediario_ii'].map((n) => med(os913, n, 'camada_seca'));
    expect(secas.map((m) => [m.especificado, m.encontrado])).toEqual([['100', '110'], ['100', '108'], ['70', '76']]);
    expect(secas.every((m) => avaliarMedicao(m).resultado === 'conforme')).toBe(true);
  });

  it('a OS libera', () => {
    expect(r.naoConformes).toBe(0);
    expect(r.liberavel).toBe(true);
  });

  it('camada úmida continua sem valor, mas não segura a liberação', () => {
    // É controle de processo; o esquema da WEIR não a pede.
    expect(med(os913, 'fundo', 'camada_umida').encontrado).toBeNull();
    expect(r.pendentes).toBeGreaterThan(0);
  });
});

/* ══ 4. O relatório gerado ═══════════════════════════════════════════════════════════════════ */

describe('gerar o relatório a partir da OS', () => {
  it('reproduz o WEIR-05 campo a campo — é o mesmo documento, sem redigitar', () => {
    const gerado = gerarRelatorio(os913, { numero: 'WEIR-05', dataEmissao: '2026-06-19' });
    const original = os913.relatorio!;

    expect(gerado.rugosidade).toBe(original.rugosidade);
    expect(gerado.dataJateamento).toBe(original.dataJateamento);
    expect(gerado.osReferida).toBe(original.osReferida);
    expect(gerado.demaos).toHaveLength(3);
    expect(gerado.demaos.map((d) => [d.espessuraEspecificada, d.espessuraEncontrada]))
      .toEqual(original.demaos.map((d) => [d.espessuraEspecificada, d.espessuraEncontrada]));
    expect(gerado.demaos.map((d) => [d.data, d.dataInspecao]))
      .toEqual(original.demaos.map((d) => [d.data, d.dataInspecao]));
    expect(gerado.demaos.map((d) => d.loteA)).toEqual(original.demaos.map((d) => d.loteA));
    expect(gerado.demaos.map((d) => [d.tempAmbiente, d.umidadeRelativa, d.tempSubstrato]))
      .toEqual(original.demaos.map((d) => [d.tempAmbiente, d.umidadeRelativa, d.tempSubstrato]));
    expect(gerado.demaos.map((d) => d.aderencia)).toEqual(original.demaos.map((d) => d.aderencia));
  });

  it('os instrumentos não são digitados: são os que as medições declararam', () => {
    expect(gerarRelatorio(os913).instrumentos).toEqual(['RL-01', '232212']);
  });

  it('as normas e a ressalva vêm do perfil do cliente, não da memória de quem digita', () => {
    const g = gerarRelatorio(os913);
    expect(g.normas).toEqual(['ABNT NBR 11003:2009', 'ABNT NBR 10443:2008']);
    expect(g.ressalvas).toEqual(['Laudo emitido antes do manuseio para transporte.']);
  });

  it('o veredito é calculado, não escolhido: 913 sai aprovado', () => {
    expect(gerarRelatorio(os913).resultado).toBe('aprovado');
    expect(impedimentosDoRelatorio(os913)).toEqual([]);
  });

  it('e a 898 sai REPROVADO — o WEIR-04 real foi assinado como aprovado', () => {
    expect(gerarRelatorio(os898).resultado).toBe('reprovado');
    expect(os898.relatorio!.resultado).toBe('aprovado');
    expect(impedimentosDoRelatorio(os898)).toHaveLength(1);
    expect(impedimentosDoRelatorio(os898)[0]).toContain('26% acima');
  });
});

/* ══ 5. Limites ══════════════════════════════════════════════════════════════════════════════ */

describe('limites', () => {
  it('OS sem relatório transcrito não inventa confronto nenhum', () => {
    const os748 = ORDENS.find((o) => o.folio === '748')!;
    expect(os748.relatorio).toBeUndefined();
    expect(compararComRelatorio(os748)).toEqual([]);
  });

  it('a OS 784, que só tem foto, continua sem poder emitir relatório', () => {
    const os784 = ORDENS.find((o) => o.folio === '784')!;
    expect(gerarRelatorio(os784).resultado).toBe('reprovado');
    expect(impedimentosDoRelatorio(os784).length).toBeGreaterThan(0);
  });

  it('as duas OS da WEIR ainda especificam faixas de rugosidade diferentes', () => {
    // A unificação não resolve isto: é decisão de engenharia, não de transcrição.
    expect(os898.esquemaPintura).toBe(os913.esquemaPintura);
    expect(med(os898, 'jateamento', 'padrao_rugosidade').especificado).toBe('50-70');
    expect(med(os913, 'jateamento', 'padrao_rugosidade').especificado).toBe('50-100');
  });
});
