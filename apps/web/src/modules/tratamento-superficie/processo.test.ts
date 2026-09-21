// Teste de funcionalidade do processo completo do tratamento-superficie, com DUAS ordens de serviço
// independentes — uma simples e uma composta. Elas não se misturam em ponto nenhum: cada uma tem
// seu esquema, suas etapas ativas e seu resultado.
import { describe, it, expect } from 'vitest';
import { avaliarMedicao, resumirOs, lerFaixa, lerNumero, normalizar, validarMedicao } from './regras';
import { faixaTolerada } from './vocabulario';
import { toleranciaAtiva } from '@/plataforma/empresa';
import { ORDENS } from '@/empresas/minasjato.ordens';

const os748 = ORDENS.find((o) => o.folio === '748')!;  // completo
const os784 = ORDENS.find((o) => o.folio === '784')!;  // só evidência fotográfica

/* ══ 1. Leitura dos valores ══════════════════════════════════════════════════════════════════ */

describe('leitura do que está escrito no campo', () => {
  it('faixa, mínimo e categórico são lidos de formas diferentes', () => {
    expect(lerFaixa('50-100')).toEqual({ min: 50, max: 100 });
    expect(lerFaixa('60 a 90')).toEqual({ min: 60, max: 90 });
    expect(lerNumero('140')).toBe(140);
    expect(lerNumero('156 µm')).toBe(156);
  });

  it('data em campo numérico é recusada, não lida como número', () => {
    // Sem isto, "07/04/2026" viraria 7 e o erro sairia como "7 µm fora da faixa".
    expect(lerNumero('07/04/2026')).toBeNull();
    expect(lerNumero('ok')).toBeNull();
    expect(lerNumero('')).toBeNull();
  });

  it('grau de jateamento é comparado sem se prender à grafia', () => {
    expect(normalizar('SA 2½')).toBe(normalizar('Sa 2.1/2"'));
    expect(normalizar('X0Y0')).toBe(normalizar('x0 y0'));
  });
});

/* ══ 2. Avaliação de uma medição ═════════════════════════════════════════════════════════════ */

describe('avaliação de medição', () => {
  const base = { dataInspecao: '2026-04-07', responsavelProcesso: 'a', responsavelInspecao: 'b', instrumentoCodigo: 'X' };

  const rug = (esp: string, enc: string) => avaliarMedicao({ ...base, grandeza: 'padrao_rugosidade', especificado: esp, encontrado: enc });
  const seca = (esp: string, enc: string) => avaliarMedicao({ ...base, grandeza: 'camada_seca', especificado: esp, encontrado: enc });

  it('a tolerância vem do perfil da empresa, não de uma constante no código', () => {
    // Camada fina não protege, e por isso o limite de baixo é apertado. Camada grossa protege.
    expect(toleranciaAtiva()).toEqual({ abaixo: 0.10, acima: 0.40 });
  });

  it('faixa: a tolerância abre cada ponta para o seu lado', () => {
    // 50-100 vira 45-140.
    expect(faixaTolerada(50, 100)).toEqual({ min: 45, max: 140 });
    expect(rug('50-100', '70').resultado).toBe('conforme');
    expect(rug('50-100', '140').resultado).toBe('conforme');  // exatamente +40%
    expect(rug('50-100', '141').resultado).toBe('nao_conforme');
    expect(rug('50-100', '45').resultado).toBe('conforme');   // exatamente -10%
    expect(rug('50-100', '44').resultado).toBe('nao_conforme');
  });

  it('alvo único: 140 aceita de 126 a 196', () => {
    expect(faixaTolerada(140)).toEqual({ min: 126, max: 196 });
    expect(seca('140', '156').resultado).toBe('conforme');
    expect(seca('140', '140').resultado).toBe('conforme');
    expect(seca('140', '130').resultado).toBe('conforme');    // -7,1%: erro pequeno, não é problema
    expect(seca('140', '126').resultado).toBe('conforme');
    expect(seca('140', '196').resultado).toBe('conforme');
  });

  it('o limite de baixo continua apertado — é onde a camada deixa de proteger', () => {
    const baixo = seca('140', '120');
    expect(baixo.resultado).toBe('nao_conforme');
    expect(baixo.motivo).toContain('14.3% abaixo de 140µm');
    expect(baixo.motivo).toContain(`a tolerância abaixo é ${toleranciaAtiva().abaixo * 100}%`);
  });

  it('acima de 40% ainda reprova, e o motivo diz de quanto foi', () => {
    const alto = seca('100', '145');
    expect(alto.resultado).toBe('nao_conforme');
    expect(alto.motivo).toContain('45% acima de 100µm');
    expect(alto.motivo).toContain(`a tolerância acima é ${toleranciaAtiva().acima * 100}%`);
  });

  it('categórico: grafia diferente do mesmo grau passa; grau diferente não', () => {
    expect(avaliarMedicao({ ...base, grandeza: 'padrao_jateamento', especificado: 'SA 2½', encontrado: 'Sa 2.1/2"' }).resultado).toBe('conforme');
    expect(avaliarMedicao({ ...base, grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X1Y0' }).resultado).toBe('nao_conforme');
  });

  it('campo ainda vazio fica pendente, não reprovado', () => {
    expect(avaliarMedicao({ ...base, grandeza: 'camada_seca', especificado: '140', encontrado: null }).resultado).toBe('pendente');
  });
});

/* ══ 3. Evidência exigida pela norma ═════════════════════════════════════════════════════════ */

describe('evidência, responsável e data', () => {
  it('medição numérica sem instrumento não é rastreável', () => {
    const p = validarMedicao({ grandeza: 'camada_seca', especificado: '140', encontrado: '156', dataInspecao: '2026-04-08', responsavelProcesso: 'a', responsavelInspecao: 'b' });
    expect(p.map((x) => x.codigo)).toContain('INSTRUMENTO_OBRIGATORIO');
  });

  it('medição categórica não exige instrumento', () => {
    const p = validarMedicao({ grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X0Y0', dataInspecao: '2026-04-08', responsavelProcesso: 'a', responsavelInspecao: 'b' });
    expect(p).toHaveLength(0);
  });

  it('sem data e sem os dois responsáveis, a medição é cobrada', () => {
    const p = validarMedicao({ grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X0Y0', dataInspecao: null, responsavelProcesso: null, responsavelInspecao: null });
    expect(p.map((x) => x.codigo).sort()).toEqual(['DATA_OBRIGATORIA', 'RESPONSAVEL_INSPECAO', 'RESPONSAVEL_PROCESSO']);
  });

  it('campo ainda não preenchido não é cobrado', () => {
    expect(validarMedicao({ grandeza: 'camada_seca', especificado: '140', encontrado: null, dataInspecao: null, responsavelProcesso: null, responsavelInspecao: null })).toHaveLength(0);
  });
});

/* ══ 4. OS 748 — processo completo ══════════════════════════════════════════════════════════
   Consórcio Ápia-Real, Obra Samarco, tubulações. Duas demãos, 07 a 10/04/2026.                */

describe('OS 748 — plano de serviço completo', () => {
  const r = resumirOs(os748.etapas);

  it('percorre jateamento e as duas demãos que o esquema pede', () => {
    expect(os748.etapas.filter((e) => e.ativa).map((e) => e.etapa)).toEqual(['jateamento', 'fundo', 'intermediario_i']);
  });

  it('as etapas que o esquema não pede ficam inativas e não contam', () => {
    expect(os748.etapas.filter((e) => !e.ativa).map((e) => e.etapa)).toEqual(['intermediario_ii', 'acabamento']);
    expect(r.medidas).toBe(10);
  });

  it('está tudo conforme e a OS libera', () => {
    expect(r.conformes).toBe(10);
    expect(r.naoConformes).toBe(0);
    expect(r.pendentes).toBe(0);
    expect(r.problemas).toHaveLength(0);
    expect(r.liberavel).toBe(true);
  });

  it('a rugosidade 70 cai dentro da faixa 50-100 do esquema', () => {
    const m = os748.etapas[0].medicoes.find((x) => x.grandeza === 'padrao_rugosidade')!;
    expect(avaliarMedicao(m).resultado).toBe('conforme');
  });

  it('guarda as divergências entre os documentos como observação, não como avaliação', () => {
    // O número da OS e a rugosidade divergem entre Plano de Serviço e RIP. Isso é conferência
    // entre papéis, não medição — o sistema registra e não decide sozinho.
    expect(os748.observacoes.some((o) => o.includes('784'))).toBe(true);
    expect(os748.observacoes.some((o) => o.includes('60 µm'))).toBe(true);
  });
});

/* ══ 5. OS 784 — o caso incompleto ═══════════════════════════════════════════════════════════
   AMC Engenharia, estruturas metálicas. O trabalho foi feito e fotografado, mas nada foi
   transcrito. É o teste de que o sistema não inventa o que não foi registrado.                 */

describe('OS 784 — só evidência fotográfica', () => {
  const r = resumirOs(os784.etapas);

  it('quase tudo fica pendente, e nada é reprovado por falta de dado', () => {
    expect(r.pendentes).toBeGreaterThan(0);
    expect(r.naoConformes).toBe(0);
  });

  it('a espessura de 89 µm não vira conforme sem especificação', () => {
    const m = os784.etapas.find((e) => e.etapa === 'acabamento')!.medicoes.find((x) => x.grandeza === 'camada_seca')!;
    expect(m.encontrado).toBe('89');
    expect(avaliarMedicao(m).resultado).toBe('pendente');
  });

  it('a OS não libera — e o motivo é falta de registro, não reprovação', () => {
    expect(r.liberavel).toBe(false);
    expect(r.naoConformes).toBe(0);
  });

  it('o que o documento não permite afirmar fica escrito', () => {
    expect(os784.observacoes.some((o) => o.includes('28/04'))).toBe(true);
    expect(os784.obra).toBeNull();
  });
});

/* ══ 6. As duas juntas ═══════════════════════════════════════════════════════════════════════ */

describe('as duas OS são independentes', () => {
  it('clientes, obras e equipamentos diferentes', () => {
    expect(os748.cliente).not.toBe(os784.cliente);
    expect(os748.equipamento).not.toBe(os784.equipamento);
    expect(os748.obra).toBe('Obra Samarco');
    expect(os784.obra).toBeNull();
  });

  it('uma libera e a outra não, por motivos diferentes', () => {
    const a = resumirOs(os748.etapas);
    const b = resumirOs(os784.etapas);
    expect(a.liberavel).toBe(true);
    expect(b.liberavel).toBe(false);
    expect(a.pendentes).toBe(0);
    expect(b.pendentes).toBeGreaterThan(0);
  });

  it('compartilham o mesmo número de RIP, em folhas diferentes', () => {
    // Um relatório, dois clientes e dois trabalhos. É achado, não é modelagem.
    expect(os748.ripNumero).toBe(os784.ripNumero);
    expect(os748.ripFolha).not.toBe(os784.ripFolha);
  });
});
