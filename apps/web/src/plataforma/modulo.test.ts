// A GRANULARIDADE DO MENU — qual é a menor peça que a permissão consegue controlar.
//
// Era o MÓDULO, e módulo é unidade de INSTALAÇÃO: as regras, os formulários e as telas que viajam
// juntos numa pasta. Usá-lo como unidade de acesso obrigava a dar tudo ou nada — "Registros do
// SGQ" tem oito telas, e liberar a não conformidade para quem a preenche liberava, junto, o plano
// de auditoria de quem vai ser auditado.
//
// Agora são dois cortes independentes, e a diferença entre eles é o que estes testes guardam:
// PERMISSÃO é quem, dentro da empresa; MODO é o que a empresa comprou. Uma tela pode cair pelos
// dois motivos, e um não substitui o outro.
import { describe, it, expect } from 'vitest';
import '@/empresas';
import { modulosVisiveis, type Modulo } from './modulo';
import { pode, PAPEL_ROTULO, type Papel, type Permissao } from './acesso';
import { MODULOS, modulosDe } from '@/modules';
import { empresas } from './empresa';

const PAPEIS = Object.keys(PAPEL_ROTULO) as Papel[];

const tela = (rota: string, exige?: Permissao, modo?: 'auditoria' | 'gestao') =>
  ({ rotulo: rota, rota, exige, modo, render: () => null });

const MODULO: Modulo = {
  chave: 'teste', nome: 'Teste', descricao: '', clausulas: [], dominio: 'Teste',
  exige: 'sgq.ver', essencial: true,
  telas: [tela('livre'), tela('so-auditor', 'auditoria.ver'), tela('so-rh', 'rh.ver')],
};

const tudo = () => true;
const nada = () => false;

describe('os dois cortes', () => {
  it('tela sem permissão própria herda a do módulo', () => {
    // É o caso normal, e tinha de continuar sendo: a distinção fina existe para as poucas telas
    // que precisam dela, não para obrigar cada tela a se declarar.
    const [m] = modulosVisiveis([MODULO], (p) => p === 'sgq.ver');
    expect(m.telas.map((t) => t.rota)).toEqual(['livre']);
  });

  it('a tela com permissão própria cai SOZINHA, sem derrubar as irmãs', () => {
    const [m] = modulosVisiveis([MODULO], (p) => p === 'sgq.ver' || p === 'rh.ver');
    expect(m.telas.map((t) => t.rota)).toEqual(['livre', 'so-rh']);
  });

  it('sem a permissão do módulo, nem as telas liberadas aparecem', () => {
    // A ordem entre os cortes não importa, mas o do módulo é absoluto: um setor que não é seu não
    // deveria nem sugerir que existe algo ali.
    expect(modulosVisiveis([MODULO], (p) => p === 'auditoria.ver')).toEqual([]);
  });

  it('módulo que fica sem nenhuma tela SOME', () => {
    // Deixá-lo como título vazio anuncia que existe alguma coisa ali e não entrega nada.
    const so = { ...MODULO, telas: [tela('so-rh', 'rh.ver')] };
    expect(modulosVisiveis([so], (p) => p === 'sgq.ver')).toEqual([]);
  });

  it('e o filtro não estraga o módulo original', () => {
    // Os módulos são constantes compartilhadas. Recortar o original faria o filtro de um usuário
    // valer para o próximo — e o próximo pode ser de outro papel.
    const antes = MODULO.telas.length;
    modulosVisiveis([MODULO], (p) => p === 'sgq.ver');
    expect(MODULO.telas.length).toBe(antes);
  });
});

describe('o modo contratado corta por outro motivo', () => {
  const M: Modulo = {
    ...MODULO, exige: undefined,
    telas: [tela('sempre'), tela('do-auditor', undefined, 'auditoria'), tela('do-dia-a-dia', undefined, 'gestao')],
  };

  it('só auditoria: a tela de operação diária não existe', () => {
    const [m] = modulosVisiveis([M], tudo, 'auditoria');
    expect(m.telas.map((t) => t.rota)).toEqual(['sempre', 'do-auditor']);
  });

  it('só gestão: a tela da consultoria não existe', () => {
    const [m] = modulosVisiveis([M], tudo, 'gestao');
    expect(m.telas.map((t) => t.rota)).toEqual(['sempre', 'do-dia-a-dia']);
  });

  it('os dois: todas', () => {
    const [m] = modulosVisiveis([M], tudo, 'auditoria_e_gestao');
    expect(m.telas).toHaveLength(3);
  });

  it('e permissão não salva tela que o contrato não inclui', () => {
    // O corte do contrato é anterior ao do papel: não adianta ser dono da empresa se a empresa
    // não comprou aquilo. Sem isto, um papel com tudo liberado enxergaria o produto inteiro.
    const [m] = modulosVisiveis([M], tudo, 'auditoria');
    expect(m.telas.some((t) => t.rota === 'do-dia-a-dia')).toBe(false);
    // E o contrário também: contrato completo não dispensa a permissão.
    expect(modulosVisiveis([MODULO], nada, 'auditoria_e_gestao')).toEqual([]);
  });
});

/* ── O que isto muda no app de verdade ─────────────────────────────────────────────────────── */

const rotasDe = (papel: Papel, modo: Parameters<typeof modulosVisiveis>[2]) =>
  modulosVisiveis(modulosDe(empresas().find((e) => e.id === 'minasjato')!.modulos),
    (p) => pode(papel, p), modo).flatMap((m) => m.telas.map((t) => t.rota));

describe('quem é auditado não vê a auditoria', () => {
  const MODO = 'auditoria_e_gestao';

  it('o plano de auditoria e o diagnóstico ficam com quem conduz e com a direção', () => {
    // §9.2 pede imparcialidade na condução; saber de antemão o que vai ser olhado é o contrário
    // disso. A direção entra porque o resultado é entrada da análise crítica (§9.3).
    for (const papel of ['coordenacao_qualidade', 'direcao'] as Papel[]) {
      expect(rotasDe(papel, MODO), papel).toContain('plano-auditoria');
      expect(rotasDe(papel, MODO), papel).toContain('diagnostico');
    }
  });

  it('e saem de quem faz o serviço e do apoio', () => {
    for (const papel of ['inspecao', 'apoio'] as Papel[]) {
      expect(rotasDe(papel, MODO), papel).not.toContain('plano-auditoria');
      expect(rotasDe(papel, MODO), papel).not.toContain('diagnostico');
    }
  });

  it('sem que ninguém perca o trabalho que era dele', () => {
    // O risco de uma mudança assim é levar junto o que não devia. A não conformidade, o plano de
    // ação e o pós-entrega são de quem executa o serviço, e continuam onde estavam.
    for (const papel of ['inspecao'] as Papel[]) {
      const r = rotasDe(papel, MODO);
      for (const rota of ['nao-conformidade', 'plano-acao', 'pos-entrega', 'lista-mestra', 'manual']) {
        expect(r, `${papel} · ${rota}`).toContain(rota);
      }
    }
  });
});

describe('os três produtos são vendáveis', () => {
  it('em contrato só de gestão, o diagnóstico não existe para NINGUÉM', () => {
    // Era o que travava o produto: o diagnóstico é o levantamento que a consultoria entrega, e
    // sem consultoria ele não tem autor. Mostrar achado sem quem responda por ele é mostrar
    // acusação sem assinatura.
    for (const papel of PAPEIS) {
      expect(rotasDe(papel, 'gestao'), papel).not.toContain('diagnostico');
    }
  });

  it('e a auditoria interna CONTINUA, porque é obrigação da empresa', () => {
    // §9.2 vale com consultoria ou sem. Quem some é o diagnóstico da consultoria, não o programa
    // de auditoria da própria empresa — confundir os dois tiraria do cliente um requisito da norma.
    expect(rotasDe('coordenacao_qualidade', 'gestao')).toContain('plano-auditoria');
  });

  it('em contrato só de auditoria, o que existe continua existindo', () => {
    // Nenhuma tela foi marcada como `modo: 'gestao'` ainda — a decisão de quais são é dela. Este
    // teste falha no dia em que a primeira for marcada, que é quando alguém precisa reler isto.
    const marcadas = MODULOS.flatMap((m) => m.telas).filter((t) => t.modo === 'gestao');
    expect(marcadas).toEqual([]);
  });
});
