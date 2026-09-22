import { describe, it, expect } from 'vitest';
import '@/empresas';
import { colunaDe, feitioDe, foraDaColuna, FEITIO } from './menu';
import { modulosVisiveis, telaDaRota, type Modulo } from './modulo';
import { pode, PAPEL_ROTULO, type Papel } from './acesso';
import { MODULOS } from '@/modules';

const PAPEIS = Object.keys(PAPEL_ROTULO) as Papel[];
const visiveis = (papel: Papel): Modulo[] => modulosVisiveis(MODULOS, (p) => pode(papel, p));
function itens(papel: Papel): string[] {
  const rotas = colunaDe(visiveis(papel), papel).flatMap((g) => g.telas.map((t) => t.rota));
  const porta = feitioDe(papel).porta;
  return porta ? [...rotas, porta.rota] : rotas;
}

describe('o menu de quem executa e inspeciona', () => {
  it('encolheu de quinze para dez', () => expect(itens('inspecao')).toHaveLength(10));
  it('sem o que é do apoio', () => {
    for (const rota of ['comunicacao', 'satisfacao', 'indicadores']) {
      expect(itens('inspecao')).not.toContain(rota);
    }
  });
  it('com tudo que ele preenche', () => {
    for (const rota of ['plano', 'nao-conformidade', 'plano-acao', 'pos-entrega',
      'propriedade-cliente', 'mudanca-producao', 'instrumentos', 'vencimentos', 'clientes']) {
      expect(itens('inspecao')).toContain(rota);
    }
  });
});

describe('a porta esconde, não trava', () => {
  it('manual e lista-mestra saíram', () => {
    expect(foraDaColuna('inspecao', 'manual')).toBe(true);
    expect(foraDaColuna('inspecao', 'lista-mestra')).toBe(true);
  });
  it('mas as rotas resolvem', () => {
    for (const rota of ['manual', 'lista-mestra', 'comunicacao', 'satisfacao', 'indicadores']) {
      expect(telaDaRota(visiveis('inspecao'), rota)).not.toBeNull();
    }
  });
});

describe('quem não tem feitio não muda', () => {
  it('continua com a coluna inteira', () => {
    for (const papel of PAPEIS.filter((p) => !FEITIO[p])) {
      const visto = visiveis(papel).flatMap((m) => m.telas.map((t) => t.rota));
      expect(itens(papel)).toEqual(visto);
    }
  });
});
