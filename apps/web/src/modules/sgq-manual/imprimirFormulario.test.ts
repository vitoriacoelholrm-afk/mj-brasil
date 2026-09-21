// A FOLHA DO FORMULÁRIO EM BRANCO.
//
// O que estes testes guardam não é o desenho da página — é o que a folha AFIRMA quando sai da
// impressora. Papel que circula sem dizer de onde veio é o achado de 7.5.3 mais fácil de levantar
// numa auditoria: o documento é revisado, a folha na mão continua a mesma, e ninguém sabe.
import { describe, it, expect, beforeEach } from 'vitest';
import '@/empresas';
import { definirEmpresaAtiva } from '@/plataforma/empresa';
import { formularioDoPapel } from '@/modules';
import { folhaDoFormulario } from './ui/imprimirFormulario';

const folhaDe = (papel: Parameters<typeof formularioDoPapel>[0]) =>
  folhaDoFormulario(formularioDoPapel(papel)!);

describe('a folha sai identificada', () => {
  beforeEach(() => definirEmpresaAtiva('minasjato'));

  it('traz o carimbo da empresa, e não um código inventado', () => {
    const html = folhaDe('plano_auditoria');
    expect(html).toContain('FM-010 rev. 00');
    expect(html).toContain('Minasjato');
    expect(html).toContain('ISO 9001:2015');
  });

  it('e o carimbo é o da empresa ATIVA — o mesmo formulário sai com outro código no modelo', () => {
    expect(folhaDe('plano_auditoria')).toContain('FM-010');
    definirEmpresaAtiva('modelo');
    const html = folhaDe('plano_auditoria');
    expect(html).not.toContain('FM-010');
    expect(html).toContain('Empresa modelo');
  });

  it('diz que é cópia impressa e manda conferir a revisão vigente', () => {
    const html = folhaDe('nao_conformidade');
    expect(html).toContain('Cópia impressa');
    expect(html).toContain('LM-SGQ-001');
    expect(html).toContain('confira a revisão vigente antes de usar');
  });

  it('e diz que está em branco, com a data da impressão', () => {
    const html = folhaDe('nao_conformidade');
    expect(html).toContain('Modelo em branco, sem registro');
    expect(html).toContain(new Date().toLocaleDateString('pt-BR'));
  });
});

describe('a folha é preenchível à mão', () => {
  beforeEach(() => definirEmpresaAtiva('minasjato'));

  it('cada escolha vira quadradinho para marcar, com as opções por extenso', () => {
    const html = folhaDe('pedido_compra');
    expect(html).toContain('&#9744; Tinta e insumo de pintura');
    expect(html).toContain('&#9744; EPI');
  });

  it('sim/não vira dois quadradinhos, e não um campo aberto', () => {
    const html = folhaDe('pedido_compra');
    expect(html).toContain('&#9744; Sim');
    expect(html).toContain('&#9744; Não');
  });

  it('o obrigatório aparece marcado, e o opcional não', () => {
    const html = folhaDe('pedido_compra');
    // O valor é opcional por decisão dela; no papel isso tem de continuar visível.
    const trecho = html.slice(html.indexOf('>Valor'), html.indexOf('>Valor') + 60);
    expect(trecho).not.toContain('obrig');
    expect(html).toContain('Fornecedor<span class="obrig">*</span>');
  });

  it('o campo condicional diz em que caso se preenche, pelo RÓTULO do campo pai', () => {
    const html = folhaDe('plano_auditoria');
    expect(html).toContain('Preencher só quando <b>O auditor audita a própria área?</b> for Sim');
  });

  it('e há onde assinar — quem preencheu e quem verificou', () => {
    const html = folhaDe('nao_conformidade');
    expect(html).toContain('Preenchido por');
    expect(html).toContain('Verificado por');
  });
});

describe('a folha não confia no conteúdo', () => {
  it('escapa o que vai para o HTML, mesmo sendo texto nosso', () => {
    // Título de formulário e explicação vêm de arquivo de perfil, que amanhã pode ser de um
    // cliente. O hábito é o que impede o dia em que deixar de ser texto nosso.
    const html = folhaDoFormulario({
      papel: 'nao_conformidade',
      setor: 'os',
      titulo: '<script>alert(1)</script>',
      clausula: '10.2',
      explicacao: 'a & b',
      campos: [{ chave: 'x', rotulo: '"aspas"', tipo: 'texto' }],
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('a &amp; b');
    expect(html).toContain('&quot;aspas&quot;');
  });
});
