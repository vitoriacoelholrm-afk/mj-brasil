// A APLICABILIDADE DA NORMA, POR EMPRESA.
//
// O que estes testes guardam é uma decisão de arquitetura, não um número: a norma é a mesma para
// todos os clientes da consultoria, e o ESCOPO é de cada um. A tentação, com um cliente só, é
// apagar a 8.3 da árvore — resolve a Minasjato hoje e quebra o cliente 02 que projeta.
//
// O segundo grupo é o que mais importa depois do banco: exclusão é DADO DE CLIENTE, e dado de
// cliente vive em três lugares que precisam concordar — o perfil, a lista mestra e o diagnóstico.
// Divergirem não quebra tela nenhuma; só faz o auditor achar uma contradição que ninguém viu.
import { describe, it, expect } from 'vitest';
import '@/empresas';
import { empresas, definirEmpresaAtiva, exclusoesAtivas } from './empresa';
import { aplicaveis, exclusaoDe, seAplica, type ExclusaoDeRequisito } from './aplicabilidade';
import { CLAUSULAS } from '@/modules/sgq-manual/norma';
import { clausulasEscritas } from '@/modules/sgq-manual/texto';
import { quantosEspecificos } from '@/modules/sgq-manual/relacionados';
import { diagnosticoDaEmpresa } from '@/modules/sgq-documentos/diagnostico/itens';
import { doc } from '@/modules/sgq-documentos/listaMestra';

const PROJETO: ExclusaoDeRequisito[] = [
  { clausula: '8.3', justificativa: 'Executa conforme requisito do contratante.', declaradaEm: 'MQ-001 §8.3' },
];

describe('a regra de leitura', () => {
  it('sem exclusão declarada, a norma inteira se aplica', () => {
    // É o padrão certo, e é o que todo cliente novo herda: o requisito vale até alguém dizer, por
    // escrito e com justificativa, que não vale. O contrário — precisar declarar o que se aplica —
    // faria uma empresa perder requisito por esquecimento.
    for (const x of CLAUSULAS) expect(seAplica(x.ref)).toBe(true);
    expect(aplicaveis(CLAUSULAS)).toHaveLength(CLAUSULAS.length);
  });

  it('excluir a mãe exclui as filhas', () => {
    // Quem não projeta não faz nada do 8.3 — nem o 8.3.2 nem o 8.3.5. Cobrar a filha de um
    // requisito excluído é cobrar o requisito por outro nome.
    expect(seAplica('8.3', PROJETO)).toBe(false);
    expect(seAplica('8.3.2', PROJETO)).toBe(false);
    expect(exclusaoDe('8.3.5', PROJETO)?.clausula).toBe('8.3');
  });

  it('e não exclui a seção, nem a irmã, nem quem só começa igual', () => {
    // '8' continua valendo: a empresa executa a operação inteira, menos o projeto.
    expect(seAplica('8', PROJETO)).toBe(true);
    expect(seAplica('8.4', PROJETO)).toBe(true);
    // O ponto é o que separa filha de vizinha: '8.30' não é parte de '8.3'.
    expect(seAplica('8.30', PROJETO)).toBe(true);
  });
});

describe('o cliente 01 exclui uma cláusula, e só uma', () => {
  it('a 8.3 não se aplica à Minasjato; as outras 36 se aplicam', () => {
    definirEmpresaAtiva('minasjato');
    const fora = CLAUSULAS.filter((x) => !seAplica(x.ref, exclusoesAtivas())).map((x) => x.ref);
    expect(fora).toEqual(['8.3']);
  });

  it('e some da CONTAGEM sem sumir da tela', () => {
    definirEmpresaAtiva('minasjato');
    const exclusoes = exclusoesAtivas();
    const modulos: never[] = [];
    // A cláusula continua na árvore da norma — é dali que a tela a mostra, com a justificativa.
    expect(CLAUSULAS.some((x) => x.ref === '8.3')).toBe(true);
    // O que muda é a conta de "sem documento próprio": a 8.3 entrava nela como se fosse pendência.
    const todas = CLAUSULAS.filter((x) => quantosEspecificos(x.ref, modulos) === 0);
    const doEscopo = aplicaveis(CLAUSULAS, exclusoes).filter((x) => quantosEspecificos(x.ref, modulos) === 0);
    expect(todas.map((x) => x.ref)).toContain('8.3');
    expect(doEscopo.map((x) => x.ref)).not.toContain('8.3');
    expect(doEscopo.length).toBe(todas.length - 1);
  });
});

describe('o cliente novo começa com a norma inteira', () => {
  it('o perfil modelo não exclui nada — quem não declarou, atende tudo', () => {
    definirEmpresaAtiva('modelo');
    expect(exclusoesAtivas()).toEqual([]);
    expect(aplicaveis(CLAUSULAS, exclusoesAtivas())).toHaveLength(CLAUSULAS.length);
  });
});

describe('toda exclusão de todo cliente se sustenta em auditoria', () => {
  const comExclusao = empresas().filter((e) => (e.exclusoes ?? []).length > 0);

  it('não se exclui o que a norma não tem', () => {
    const refs = new Set(CLAUSULAS.map((x) => x.ref));
    for (const e of comExclusao) {
      for (const x of e.exclusoes!) expect(refs.has(x.clausula), `${e.id} · ${x.clausula}`).toBe(true);
    }
  });

  it('justificativa e origem vêm preenchidas — sem elas é lacuna, não exclusão', () => {
    // A §4.3 admite não aplicar um requisito; não admite omitir por quê. E justificativa que não
    // está em documento nenhum não se apresenta: por isso `declaradaEm` também é obrigatório.
    for (const e of comExclusao) {
      for (const x of e.exclusoes!) {
        expect(x.justificativa.trim().length, `${e.id} · ${x.clausula}`).toBeGreaterThan(20);
        expect(x.declaradaEm.trim(), `${e.id} · ${x.clausula}`).not.toBe('');
      }
    }
  });

  it('o documento que a exclusão cita existe na lista mestra da empresa', () => {
    // `declaradaEm` é 'MQ-001 §8.3'. O código antes do § tem de ser um documento catalogado —
    // apontar para documento que não existe é a exclusão não ter onde ser lida.
    for (const e of comExclusao) {
      definirEmpresaAtiva(e.id);
      for (const x of e.exclusoes!) {
        const codigo = x.declaradaEm.split(/[\s§]/)[0];
        expect(doc(codigo), `${e.id} · ${x.declaradaEm}`).toBeTruthy();
      }
    }
  });

  it('e o manual escreve a cláusula excluída — a exclusão É informação documentada', () => {
    // O reflexo errado seria não escrever o que não se faz. A norma pede o oposto: a cláusula
    // aparece no manual justamente para dizer que não se aplica, e por quê.
    for (const e of comExclusao) {
      definirEmpresaAtiva(e.id);
      const escritas = new Set(clausulasEscritas());
      for (const x of e.exclusoes!) expect(escritas.has(x.clausula), `${e.id} · ${x.clausula}`).toBe(true);
    }
  });
});

describe('perfil, lista mestra e diagnóstico contam a mesma história', () => {
  it('o que o perfil exclui, o diagnóstico marca como não aplicável — e vice-versa', () => {
    // São a mesma decisão vista de dois ângulos. Se um dia divergirem, o auditor abre as duas
    // telas e encontra a contradição antes da gente.
    for (const e of empresas()) {
      definirEmpresaAtiva(e.id);
      const doDiagnostico = diagnosticoDaEmpresa()
        .filter((i) => i.avaliacao === 'nao_aplicavel')
        .map((i) => i.clausulaRef)
        .sort();
      const doPerfil = (e.exclusoes ?? []).map((x) => x.clausula).sort();
      expect(doDiagnostico, e.id).toEqual(doPerfil);
    }
  });

  it('e a justificativa é UMA só, citada nos três lugares', () => {
    definirEmpresaAtiva('minasjato');
    const x = exclusoesAtivas()[0];
    const noManualDaLista = doc('MQ-001')!.exclusoes!.find((y) => y.requisito.startsWith(x.clausula));
    expect(noManualDaLista?.justificativa).toBe(x.justificativa);
    const noDiagnostico = diagnosticoDaEmpresa().find((i) => i.clausulaRef === x.clausula);
    expect(noDiagnostico?.justificativaNa).toContain(x.justificativa);
    expect(noDiagnostico?.justificativaNa).toContain(x.declaradaEm);
  });
});
