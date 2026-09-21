// A norma como árvore, e o casamento de uma referência com a cláusula certa.
//
// Esta é a parte sutil do manual: um documento diz "8.7.2 e 10.2.2", um formulário diz
// "8.5.3 e 8.5.4", e a árvore da norma tem 8.7 mas não tem 8.7.2. Errar o casamento faz o manual
// mostrar cláusula vazia onde há documento — e o auditor conclui que não existe.
import { describe, it, expect } from 'vitest';
import '@/empresas';
import { MODULOS } from '@/modules';
import {
  CLAUSULAS, SECOES, clausulaDe, clausulaPorRef, clausulasDaSecao, refsNoTexto, tocaClausula,
} from './norma';
import { quantoTem, quantosEspecificos, relacionadosDa } from './relacionados';

describe('a árvore da norma', () => {
  it('tem as sete seções de requisito, e não as três de abertura', () => {
    // 1, 2 e 3 são escopo, referências e termos: não são requisitos, não se auditam e não geram
    // documento. Incluí-las encheria o manual de linha que nunca tem nada.
    expect(SECOES.map((x) => x.numero)).toEqual(['4', '5', '6', '7', '8', '9', '10']);
  });

  it('toda cláusula pertence a uma seção que existe, e nenhuma se repete', () => {
    const numeros = SECOES.map((x) => x.numero);
    for (const x of CLAUSULAS) {
      expect(numeros, x.ref).toContain(x.secao);
      // A seção é o primeiro número da referência — se divergir, a cláusula está no lugar errado.
      expect(x.ref.split('.')[0], x.ref).toBe(x.secao);
      expect(x.titulo.length, x.ref).toBeGreaterThan(5);
    }
    const refs = CLAUSULAS.map((x) => x.ref);
    expect(new Set(refs).size).toBe(refs.length);
  });

  it('cada seção tem cláusulas, e a soma delas é a lista inteira', () => {
    const soma = SECOES.flatMap((s) => clausulasDaSecao(s.numero));
    expect(soma).toHaveLength(CLAUSULAS.length);
    for (const s of SECOES) expect(clausulasDaSecao(s.numero).length, s.numero).toBeGreaterThan(0);
  });
});

describe('achar a cláusula de uma referência', () => {
  it('a referência exata vale por ela mesma', () => {
    expect(clausulaDe('8.5.3')?.ref).toBe('8.5.3');
    expect(clausulaDe('7.2')?.ref).toBe('7.2');
  });

  it('a referência mais funda cai na cláusula que a contém', () => {
    // A norma não desdobra o 8.7 na lista de requisitos, mas todo RNC cita 8.7.2.
    expect(clausulaDe('8.7.2')?.ref).toBe('8.7');
    expect(clausulaDe('10.2.2')?.ref).toBe('10.2');
  });

  it('vale a MAIS ESPECÍFICA que couber, não a raiz', () => {
    // Se pegasse a raiz, a satisfação do cliente (9.1.2) cairia no mesmo balde da medição
    // (9.1.1) — são coisas diferentes, e o auditor pergunta por elas separadamente.
    expect(clausulaDe('9.1.2')?.ref).toBe('9.1.2');
    expect(clausulaDe('9.1.3')?.ref).toBe('9.1.3');
    expect(clausulaDe('7.1.5')?.ref).toBe('7.1.5');
    expect(clausulaDe('7.1.6')?.ref).toBe('7.1.6');
  });

  it('referência que não é da norma não vira cláusula inventada', () => {
    expect(clausulaDe('3.1')).toBe(null);
    expect(clausulaDe('99')).toBe(null);
    expect(clausulaPorRef('8.7.2')).toBe(null);   // existe como referência, não como cláusula
  });
});

describe('cláusula escrita como o auditor fala', () => {
  it('separa as duas de uma frase', () => {
    expect(refsNoTexto('8.7.2 e 10.2.2')).toEqual(['8.7.2', '10.2.2']);
    expect(refsNoTexto('8.5.3 e 8.5.4')).toEqual(['8.5.3', '8.5.4']);
  });

  it('e o formulário do RNC aparece nas DUAS cláusulas, que é onde ele conta', () => {
    expect(tocaClausula('8.7.2 e 10.2.2', '8.7')).toBe(true);
    expect(tocaClausula('8.7.2 e 10.2.2', '10.2')).toBe(true);
    expect(tocaClausula('8.7.2 e 10.2.2', '10.1')).toBe(false);
    expect(tocaClausula('8.7.2 e 10.2.2', '8.6')).toBe(false);
  });

  it('não confunde 8.5.3 com 8.5.6 nem com 8.5', () => {
    // Prefixo de texto casaria "8.5.3" com "8.5.30" e com "8.5". A comparação é por cláusula.
    expect(tocaClausula('8.5.3', '8.5.6')).toBe(false);
    expect(tocaClausula('8.5.6', '8.5.3')).toBe(false);
    expect(tocaClausula('8.5.3', '8.5.3')).toBe(true);
  });
});

/* ══ O cruzamento, contra o perfil real da empresa 01 ════════════════════════════════════════ */

describe('o que a cláusula tem', () => {
  it('a 8.5.3 traz os documentos da empresa E as duas telas onde se registra', () => {
    const r = relacionadosDa('8.5.3', MODULOS)!;
    expect(r.documentos.map((d) => d.codigo)).toEqual(expect.arrayContaining(['FM-020', 'FM-023']));
    // Duas telas atendem a mesma cláusula por caminhos diferentes: a ocorrência com peça de
    // cliente e o livro do portão. É exatamente o que o manual existe para mostrar.
    expect(r.telas.map((t) => t.tela.rota).sort()).toEqual(['cargas', 'propriedade-cliente']);
  });

  it('a 10.2 chega pelo RNC, que declara a cláusula junto com a 8.7.2', () => {
    const r = relacionadosDa('10.2', MODULOS)!;
    expect(r.telas.map((t) => t.tela.rota)).toContain('nao-conformidade');
  });

  it('a 7.2 leva ao registro de treinamento, que é de outro setor', () => {
    const r = relacionadosDa('7.2', MODULOS)!;
    expect(r.telas.map((t) => t.tela.rota)).toContain('treinamento');
  });

  it('cláusula sem tela diz isso, e continua mostrando os documentos', () => {
    // A 10.3 (melhoria contínua) não é formulário: é o que sai da análise crítica e dos
    // indicadores. Era a 9.2 que servia de exemplo aqui, até o plano de auditoria interna ganhar
    // tela em 21/09/2026.
    const r = relacionadosDa('10.3', MODULOS)!;
    expect(r.telas).toEqual([]);
    expect(r.documentos.length).toBeGreaterThan(0);
  });

  it('a cláusula mostra o formulário EM BRANCO — é o que o auditor pede antes do preenchido', () => {
    // O modelo não expõe registro de ninguém: são os campos, não o conteúdo. Quem quiser ver um
    // caso concreto entra no sistema da empresa, na tela, com o login dela.
    const r = relacionadosDa('9.2', MODULOS)!;
    expect(r.formularios.map((f) => f.papel)).toEqual(['plano_auditoria']);
    expect(r.telas.map((t) => t.tela.rota)).toContain('plano-auditoria');

    // E cada campo diz o que exige, que é o que faz o modelo valer como apresentação.
    const def = r.formularios[0];
    expect(def.campos.find((x) => x.chave === 'independencia')!.obrigatorio).toBe(true);
    expect(def.campos.find((x) => x.chave === 'comoGarantida')!.dependeDe)
      .toEqual({ campo: 'independencia', valor: 'Sim' });
  });

  it('cláusula sem formulário nenhum devolve lista vazia, e a tela não desenha o bloco', () => {
    expect(relacionadosDa('5.1', MODULOS)!.formularios).toEqual([]);
  });

  it('referência que não é cláusula devolve null em vez de uma tela vazia', () => {
    expect(relacionadosDa('8.7.2', MODULOS)).toBe(null);
  });

  it('a contagem do índice soma o que EXISTE, não o que falta', () => {
    // Somar a ausência daria número grande em cláusula vazia — o contrário do que a tela diz.
    expect(quantoTem('8.5.3', MODULOS)).toBe(
      relacionadosDa('8.5.3', MODULOS)!.documentos.length + 2,
    );
  });
});

/* ══ Declarar a SEÇÃO inteira — o caso do manual da qualidade ════════════════════════════════ */

describe('quem declara a seção cobre as cláusulas de dentro', () => {
  it('um documento que diz "4" aparece na 4.1', () => {
    // O Manual da Qualidade declara 4, 5, 6, 7, 8, 9 e 10. Antes disto ele não aparecia em
    // cláusula nenhuma, e treze delas pareciam vazias — quando o que faltava era a regra, não o
    // documento.
    expect(tocaClausula('4', '4.1')).toBe(true);
    expect(tocaClausula('8', '8.5.3')).toBe(true);
    expect(relacionadosDa('4.1', MODULOS)!.documentos.map((d) => d.codigo)).toContain('MQ-001');
  });

  it('mas irmão não cobre irmão', () => {
    expect(tocaClausula('4.1', '4.2')).toBe(false);
    expect(tocaClausula('9.1.1', '9.1.2')).toBe(false);
  });

  it('o mais específico vem primeiro na lista', () => {
    // Quem responde pela cláusula antes de quem cobre a seção. Na tela, o manual fica no fim.
    const docs = relacionadosDa('8.5.3', MODULOS)!.documentos.map((d) => d.codigo);
    expect(docs.indexOf('FM-020')).toBeLessThan(docs.indexOf('MQ-001'));
  });

  it('e o índice separa "coberto" de "com documento próprio"', () => {
    // A 5.1 está coberta no papel — o manual percorre a norma inteira. Mas nenhum procedimento,
    // formulário ou tela responde por ela, e é isso que a auditoria cobra.
    expect(quantoTem('5.1', MODULOS)).toBeGreaterThan(0);
    expect(quantosEspecificos('5.1', MODULOS)).toBe(0);
    // Já a 8.5.3 tem dois formulários e duas telas.
    expect(quantosEspecificos('8.5.3', MODULOS)).toBeGreaterThan(0);
  });

  it('a 8.5.5 leva ao chamado de campo, e ainda cobra a política', () => {
    // A cláusula pede as duas coisas. A tela existe (o registro de cada atendimento); o
    // procedimento que diz a política continua na lista do que falta — e é assim que tem de
    // aparecer, porque ter onde registrar não é ter a política escrita.
    const r = relacionadosDa('8.5.5', MODULOS)!;
    expect(r.telas.map((t) => t.tela.rota)).toContain('pos-entrega');
    expect(r.faltando.map((f) => f.chave)).toContain('pos_entrega');
  });

  it('a 7.4 saiu do "só no manual" ao ganhar tela, mesmo sem documento catalogado', () => {
    // A matriz de comunicação virou tela em 21/09/2026. A Minasjato ainda não a catalogou na
    // lista mestra — e é por isso que a tela existe e a falta continua sendo apontada. Uma coisa
    // é ter onde registrar; outra é ter o documento com código, que é o que o auditor pede.
    expect(quantosEspecificos('7.4', MODULOS)).toBeGreaterThan(0);
    expect(relacionadosDa('7.4', MODULOS)!.telas.map((t) => t.tela.rota)).toContain('comunicacao');
    expect(relacionadosDa('7.4', MODULOS)!.faltando.map((f) => f.chave)).toContain('comunicacao_sgq');
  });

  it('a 4.1 e a 4.2 deixaram de ser "só no manual" quando a SWOT entrou na lista', () => {
    // O FM-024 declara 4.1, 4.2 e 6.1. Catalogá-lo em 21/09/2026 não criou documento nenhum —
    // ele já existia, fora da lista, com um código que colidia. Dar endereço ao que já existe
    // fechou duas das treze.
    expect(quantosEspecificos('4.1', MODULOS)).toBeGreaterThan(0);
    expect(quantosEspecificos('4.2', MODULOS)).toBeGreaterThan(0);
    expect(relacionadosDa('4.2', MODULOS)!.documentos.map((d) => d.codigo)).toContain('FM-024');
  });
});
