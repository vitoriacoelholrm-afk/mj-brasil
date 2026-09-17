// Quem pode o quê. A regra não é de software: quem confere não preenche.
import { describe, it, expect } from 'vitest';
import { ACESSO, PAPEL_ROTULO, motivoDaLeituraApenas, pode, somenteLeitura, type Papel } from './acesso';
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

  it('na equipe dela, quem preenche a OS é o PCC e o inspetor', () => {
    const editam = EQUIPE.filter((p) => pode(p.papel, 'os.editar')).map((p) => p.cargo);
    expect(editam).toEqual(['PCC', 'Inspetor de Pintura N1']);
  });

  it('e os dois emitem o relatório — foi o que ela pediu em 17/09/2026', () => {
    const emitem = EQUIPE.filter((p) => pode(p.papel, 'relatorio.emitir')).map((p) => p.cargo);
    expect(emitem).toEqual(['PCC', 'Inspetor de Pintura N1']);
  });

  it('e a direção e o administrativo continuam fora da OS', () => {
    // Financeiro e RH não tem nada que fazer numa ordem de serviço; a direção acompanha.
    const forte = EQUIPE.filter((p) => !pode(p.papel, 'os.editar')).map((p) => p.cargo);
    expect(forte).toEqual(['Coordenadora da Qualidade', 'Diretor', 'Financeiro e RH']);
  });

  it('sem sessão, o acesso é o mínimo — consulta, nunca escrita', () => {
    // papelAtual cai em coordenacao_qualidade quando não há ninguém logado.
    expect(pode(papelAtual(), 'os.editar')).toBe(false);
  });
});
