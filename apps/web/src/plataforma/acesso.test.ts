// Quem pode o quê. A regra não é de software: quem confere não preenche.
import { describe, it, expect } from 'vitest';
import {
  ACESSO, PAPEL_ROTULO, motivoDaLeituraApenas, motivoDoBloqueio, pode, podeEditar, podeVer,
  somenteLeitura, type Papel,
} from './acesso';
import { NAO_CONFORMIDADE, REGISTRO_TREINAMENTO } from '@/modules/sgq-registros/formularios';
import { EQUIPE, papelAtual } from '@/lib/session';

const PAPEIS = Object.keys(ACESSO) as Papel[];

describe('a coordenação da qualidade vê e não escreve', () => {
  it('abre tudo, altera nada', () => {
    expect(pode('coordenacao_qualidade', 'os.ver')).toBe(true);
    expect(pode('coordenacao_qualidade', 'os.editar')).toBe(false);
    expect(pode('coordenacao_qualidade', 'os.anexar')).toBe(false);
    expect(pode('coordenacao_qualidade', 'relatorio.emitir')).toBe(false);
    expect(somenteLeitura('coordenacao_qualidade')).toBe(true);
  });

  it('a tela explica o porquê, em vez de só travar o campo', () => {
    const m = motivoDaLeituraApenas('coordenacao_qualidade');
    expect(m).toContain('vê tudo e não altera nada');
    expect(m).toContain('independente');
  });
});

describe('quem faz o serviço é quem registra', () => {
  it('execução preenche a ordem e junta evidência', () => {
    expect(pode('execucao', 'os.editar')).toBe(true);
    expect(pode('execucao', 'os.anexar')).toBe(true);
    expect(somenteLeitura('execucao')).toBe(false);
  });

  it('só a inspeção emite o relatório que vai ao cliente', () => {
    expect(pode('inspecao', 'relatorio.emitir')).toBe(true);
    const outros = PAPEIS.filter((p) => p !== 'inspecao');
    expect(outros.filter((p) => pode(p, 'relatorio.emitir'))).toEqual([]);
  });

  it('direção acompanha, não preenche formulário de chão de fábrica', () => {
    expect(pode('direcao', 'os.ver')).toBe(true);
    expect(pode('direcao', 'os.editar')).toBe(false);
  });

  it('apoio administrativo não tem acesso à ordem de serviço', () => {
    expect(pode('apoio', 'os.ver')).toBe(false);
    expect(somenteLeitura('apoio')).toBe(false); // não é leitura apenas: é nenhum acesso
  });
});


describe('o setor de pessoas é do RH, e de mais ninguém', () => {
  it('o apoio preenche os registros de pessoas', () => {
    expect(podeVer('apoio', 'rh')).toBe(true);
    expect(podeEditar('apoio', 'rh')).toBe(true);
  });

  it('e nenhum outro papel entra lá — nem a coordenação da qualidade', () => {
    // Foi decisão dela em 17/09/2026: só o RH. Vale registrar que isto tem consequência —
    // quem audita a 7.2 não enxerga a evidência de competência por dentro do app.
    const outros = PAPEIS.filter((p) => p !== 'apoio');
    expect(outros.filter((p) => podeVer(p, 'rh'))).toEqual([]);
  });

  it('e o RH continua fora da ordem de serviço', () => {
    expect(podeVer('apoio', 'os')).toBe(false);
    expect(podeEditar('apoio', 'os')).toBe(false);
  });

  it('quem preenche a ficha de treinamento não é quem preenche a OS', () => {
    expect(REGISTRO_TREINAMENTO.setor).toBe('rh');
    expect(NAO_CONFORMIDADE.setor).toBe('os');
    expect(podeEditar('inspecao', 'rh')).toBe(false);
    expect(podeEditar('apoio', 'rh')).toBe(true);
  });
});

describe('a tela diz por que não abre, e diz a coisa certa', () => {
  it('quem pode preencher não recebe aviso nenhum', () => {
    expect(motivoDoBloqueio('inspecao', 'os')).toBe(null);
    expect(motivoDoBloqueio('apoio', 'rh')).toBe(null);
  });

  it('quem vê e não escreve ouve falar de independência', () => {
    expect(motivoDoBloqueio('coordenacao_qualidade', 'os')).toContain('independente');
  });

  it('e quem nem vê ouve que o setor não é dele — não que está sem permissão', () => {
    // A diferença importa: "você não tem acesso" soa a defeito; "este setor é de outra
    // pessoa" é a regra da casa, e a pessoa para de procurar.
    const m = motivoDoBloqueio('inspecao', 'rh')!;
    expect(m).toContain('registros de pessoas');
    expect(m).toContain('responde pelo setor');
  });
});

describe('um posto de uso único vê a sua tela e mais nada', () => {
  it('a portaria registra cargas, e só', () => {
    expect(podeEditar('portaria', 'portaria')).toBe(true);
    expect(podeVer('portaria', 'os')).toBe(false);
    expect(podeVer('portaria', 'rh')).toBe(false);
  });

  it('e não enxerga o sistema da qualidade — não é console, é terminal de portão', () => {
    // Sem esta distinção o porteiro entraria numa tela de diagnóstico da ISO travada, em vez
    // de entrar direto no que ele tem a fazer.
    expect(pode('portaria', 'sgq.ver')).toBe(false);
    const outros = PAPEIS.filter((p) => p !== 'portaria');
    expect(outros.filter((p) => !pode(p, 'sgq.ver'))).toEqual([]);
  });

  it('quem confere continua vendo o livro da portaria, sem escrever nele', () => {
    expect(podeVer('coordenacao_qualidade', 'portaria')).toBe(true);
    expect(podeEditar('coordenacao_qualidade', 'portaria')).toBe(false);
  });

  it('e ninguém mais entra lá', () => {
    const dentro = PAPEIS.filter((p) => podeVer(p, 'portaria'));
    expect(dentro).toEqual(['coordenacao_qualidade', 'portaria']);
  });
});
describe('a equipe cadastrada usa os papéis', () => {
  it('cargo e papel são coisas diferentes: um é rótulo, o outro é regra', () => {
    const coord = EQUIPE.find((p) => p.nome.startsWith('Vitória'))!;
    expect(coord.cargo).toBe('Coordenadora da Qualidade');
    expect(coord.papel).toBe('coordenacao_qualidade');
    expect(PAPEL_ROTULO[coord.papel]).toBe('Coordenação da Qualidade');
  });

  it('cada pessoa tem um papel conhecido', () => {
    for (const p of EQUIPE) expect(PAPEIS, `${p.nome}`).toContain(p.papel);
  });

  it('na equipe dela, quem preenche a OS é o PCC e o gerente de produção', () => {
    const editam = EQUIPE.filter((p) => pode(p.papel, 'os.editar')).map((p) => p.cargo);
    expect(editam).toEqual(['PCC', 'Gerente de Produção']);
  });

  it('e os dois assinam e emitem o RIP — foi o que ela pediu em 17/09/2026', () => {
    const emitem = EQUIPE.filter((p) => pode(p.papel, 'relatorio.emitir')).map((p) => p.cargo);
    expect(emitem).toEqual(['PCC', 'Gerente de Produção']);
  });

  it('e a direção e o administrativo continuam fora da OS', () => {
    // Financeiro e RH não tem nada que fazer numa ordem de serviço; a direção acompanha.
    const forte = EQUIPE.filter((p) => !pode(p.papel, 'os.editar')).map((p) => p.cargo);
    expect(forte).toEqual(['Coordenadora da Qualidade', 'Diretor', 'Financeiro e RH', 'Portaria']);
  });

  it('sem sessão, o acesso é o mínimo — consulta, nunca escrita', () => {
    // papelAtual cai em coordenacao_qualidade quando não há ninguém logado.
    expect(pode(papelAtual(), 'os.editar')).toBe(false);
  });
});
