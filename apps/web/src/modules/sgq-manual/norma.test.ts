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
import { quantoTem, relacionadosDa } from './relacionados';

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
    const r = relacionadosDa('9.2', MODULOS)!;
    expect(r.telas).toEqual([]);
    expect(r.documentos.length).toBeGreaterThan(0);
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
