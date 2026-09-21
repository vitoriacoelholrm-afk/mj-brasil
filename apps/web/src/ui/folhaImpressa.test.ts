// A FOLHA IMPRESSA — em branco e preenchida.
//
// O que estes testes guardam não é o desenho da página: é o que a folha AFIRMA quando sai da
// impressora. Papel que circula sem dizer de onde veio é o achado de 7.5.3 mais fácil de levantar
// numa auditoria: o documento é revisado, a folha na mão continua a mesma, e ninguém sabe.
import { describe, it, expect, beforeEach } from 'vitest';
import '@/empresas';
import { definirEmpresaAtiva } from '@/plataforma/empresa';
import { formularioDoPapel } from '@/modules';
import { folhaDoFormulario, type RegistroParaFolha } from './folhaImpressa';

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

describe('a folha do registro preenchido', () => {
  beforeEach(() => definirEmpresaAtiva('minasjato'));

  const registro: RegistroParaFolha = {
    id: 'reg-teste-01',
    numero: 3,
    ano: 2026,
    criadoEm: '2026-09-18T14:20:00.000Z',
    criadoPor: 'Emerson William de Faria',
    valores: {
      numero: '03/2026', tipo: 'Extraordinária', escopo: 'Pintura e expedição',
      criterios: 'ISO 9001:2015 e PO-005', data: '2026-09-18',
      auditor: 'Gustavo Moreira', auditados: 'Gerência de Pintura',
      independencia: 'Não', resultado: 'Realizada', naoConformidades: '2 — RNC 11 e 12',
      relatadoPara: 'Alta Direção', planejadoEm: '2026-09-10', planejadoPor: 'Gustavo Moreira',
    },
    anexos: [
      { id: 'a1', tipo: 'foto', nome: 'sala.jpg', url: 'data:image/png;base64,AAA', legenda: 'Reunião de abertura', comentario: '', data: null, adicionadoPor: null },
      { id: 'a2', tipo: 'arquivo', nome: 'relatorio-03-2026.pdf', url: null, legenda: '', comentario: '', data: null, adicionadoPor: null },
    ],
  };

  const html = () => folhaDoFormulario(formularioDoPapel('plano_auditoria')!, registro);

  it('traz os valores, e a data em formato de gente', () => {
    expect(html()).toContain('03/2026');
    expect(html()).toContain('18/09/2026');       // o campo 'data', que vem como 2026-09-18
    expect(html()).toContain('Gustavo Moreira');
  });

  it('a escolha sai MARCADA, e as outras opções continuam visíveis', () => {
    // Mostrar só a resposta esconderia o que mais havia para escolher — e é isso que o auditor
    // olha quando quer saber se a pergunta era realmente essa.
    expect(html()).toContain('&#9746; Extraordinária');
    expect(html()).toContain('&#9744; Programada');
  });

  it('campo sem resposta sai com traço, e não com linha em branco', () => {
    // Linha em branco num registro impresso é convite para preencher depois. Registro alterado
    // depois de emitido é adulteração de evidência, não correção.
    expect(html()).toContain('&mdash;');
    expect(html()).not.toContain('class="caixa"');
  });

  it('campo condicional que não se deu não aparece — nunca foi perguntado', () => {
    // 'independencia' é Não, então 'Como a imparcialidade foi assegurada' não existia neste caso.
    expect(html()).not.toContain('Como a imparcialidade foi assegurada');
    // E o que a condição abriu aparece: 'resultado' é Realizada.
    expect(html()).toContain('Não conformidades levantadas');
  });

  it('as fotos entram na folha; o arquivo entra pelo nome', () => {
    expect(html()).toContain('data:image/png;base64,AAA');
    expect(html()).toContain('Reunião de abertura');
    expect(html()).toContain('relatorio-03-2026.pdf');
  });

  it('sai identificado pelo NÚMERO, e o uuid não vai para o papel', () => {
    // "Me mostra o RNC 05" tem resposta; "me mostra o 9f3a-…" não tem. O uuid identifica a linha
    // no banco e não serve para citar num plano de ação nem para conferir numa pasta.
    expect(html()).toContain('nº 003/2026');
    expect(html()).not.toContain('reg-teste-01');
  });

  it('registro antigo sem número diz que não tem, em vez de fingir um', () => {
    const semNumero = { ...registro, numero: null, ano: null };
    const f = folhaDoFormulario(formularioDoPapel('plano_auditoria')!, semNumero);
    expect(f).toContain('sem número');
  });

  it('quem preencheu já vem assinado; quem verifica, não', () => {
    expect(html()).toContain('Preenchido por &mdash; Emerson William de Faria');
    expect(html()).toContain('Verificado por &mdash; nome e data');
  });

  it('e o rodapé diz que o original é o do sistema', () => {
    const f = html();
    expect(f).toContain('O registro original é o do sistema');
    expect(f).toContain('alterá-la à mão não altera o registro');
    // O texto do modelo em branco não vale aqui: este papel não é modelo nenhum.
    expect(f).not.toContain('Modelo em branco');
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
