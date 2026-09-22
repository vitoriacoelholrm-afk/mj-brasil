// O QUE O CONTRATO ABRE — e, principalmente, o que ele NÃO abre.
//
// Estes testes guardam uma mudança de decisão, e é por isso que existem. Até 21/09/2026 a
// coordenação da qualidade não escrevia NADA numa empresa de verdade: era a leitura estrita de
// "quem confere não preenche". A leitura estava larga demais. Ela protege o REGISTRO — a
// evidência de que a empresa fez o trabalho —, e o manual não é registro: é a declaração do que a
// empresa faz, e mantê-lo é o ofício do Coordenador da Qualidade (MQ-001 §5.3).
//
// A linha nova passa entre DECLARAR e AFIRMAR QUE FEZ. Os dois primeiros grupos abrem a porta; o
// terceiro é o que impede a porta de virar corredor — e é o mais importante dos três.
import { describe, it, expect } from 'vitest';
import '@/empresas';
import { empresas } from './empresa';
import {
  MODOS, MODO_ROTULO, temAuditoria, temGestao, type ModoDeContratacao,
} from './contratacao';
import {
  PAPEL_ROTULO, podeAnexarEmDocumento, podeEditar, podeEditarOModelo, podeEscreverOManual,
  type Papel, type Setor,
} from './acesso';

const PAPEIS = Object.keys(PAPEL_ROTULO) as Papel[];
const SETORES: Setor[] = ['os', 'rh', 'portaria', 'sgq', 'suprimentos'];
const COM_GESTAO: ModoDeContratacao[] = ['gestao', 'auditoria_e_gestao'];

describe('os três modos', () => {
  it('cada um diz se tem gestão e se tem auditoria', () => {
    expect(MODOS.filter(temGestao)).toEqual(['gestao', 'auditoria_e_gestao']);
    expect(MODOS.filter(temAuditoria)).toEqual(['auditoria', 'auditoria_e_gestao']);
  });

  it('e todo modo tem rótulo — é o que vai na proposta comercial', () => {
    for (const m of MODOS) expect(MODO_ROTULO[m]?.length, m).toBeGreaterThan(3);
  });
});

describe('com gestão contratada, a coordenação mantém o manual', () => {
  it('escreve a cláusula na empresa do cliente', () => {
    for (const modo of COM_GESTAO) {
      expect(podeEscreverOManual('coordenacao_qualidade', modo, false), modo).toBe(true);
      expect(podeAnexarEmDocumento('coordenacao_qualidade', modo), modo).toBe(true);
    }
  });

  it('e nenhum outro papel escreve, em modo nenhum', () => {
    // Inclusive a direção. Ela DETERMINA o que o sistema comunica (`sgq.editar`, §7.4) e assina o
    // manual; redigir cláusula por cláusula é ofício da coordenação. Se um dia for decisão dela
    // que a direção também escreva, é aqui que a mudança aparece.
    for (const papel of PAPEIS.filter((p) => p !== 'coordenacao_qualidade')) {
      for (const modo of MODOS) {
        expect(podeEscreverOManual(papel, modo, false), `${papel}/${modo}`).toBe(false);
        expect(podeAnexarEmDocumento(papel, modo), `${papel}/${modo}`).toBe(false);
      }
    }
  });
});

describe('em contrato só de auditoria, ninguém escreve o manual do cliente', () => {
  it('nem a coordenação', () => {
    // É o produto "apenas auditoria": o sistema APRESENTA o que a empresa emitiu e aponta o que
    // falta. Quem confere não escreve o que vai conferir — aí sim a §9.2 estaria em jogo.
    expect(podeEscreverOManual('coordenacao_qualidade', 'auditoria', false)).toBe(false);
    expect(podeAnexarEmDocumento('coordenacao_qualidade', 'auditoria')).toBe(false);
  });

  it('e nenhum papel, em nenhum setor', () => {
    for (const papel of PAPEIS) {
      expect(podeEscreverOManual(papel, 'auditoria', false), papel).toBe(false);
    }
  });
});

describe('a porta não virou corredor', () => {
  it('manter o manual NÃO abre registro nenhum, em modo nenhum', () => {
    // O ponto inteiro da mudança. Declarar o que a empresa faz é uma coisa; afirmar que ela fez é
    // outra, e é a segunda que a §9.2 protege. Se algum dia `podeEditar` responder verdadeiro
    // aqui, a independência da conferência caiu — e caiu em silêncio, que é como essas coisas caem.
    for (const setor of SETORES) {
      expect(podeEditar('coordenacao_qualidade', setor), setor).toBe(false);
    }
  });

  it('a ordem de serviço continua de quem executa e de quem inspeciona', () => {
    expect(podeEditar('coordenacao_qualidade', 'os')).toBe(false);
    expect(podeEditar('inspecao', 'os')).toBe(true);
  });

  it('e as exclusividades de setor seguem de pé', () => {
    // Decididas por ela em 17/09 e 21/09: registros de pessoas só do RH, suprimentos só do apoio,
    // e desde 21/09 a gestão do sistema também — quem apura indicador é o administrativo.
    for (const setor of ['rh', 'suprimentos', 'sgq'] as const) {
      expect(podeEditar('apoio', setor), setor).toBe(true);
      for (const papel of PAPEIS.filter((p) => p !== 'apoio')) {
        expect(podeEditar(papel, setor), `${papel} · ${setor}`).toBe(false);
      }
    }
  });
});

describe('o modelo é outra porta, e continua sendo', () => {
  it('no modelo vale `modelo.editar`, e o modo contratado não entra na conta', () => {
    // O molde é o produto da consultoria, escrito antes de existir cliente. Quem o escreve é quem
    // conhece a norma, e não depende do que empresa nenhuma comprou.
    for (const modo of MODOS) {
      expect(podeEscreverOManual('coordenacao_qualidade', modo, true), modo).toBe(true);
    }
    expect(podeEditarOModelo('coordenacao_qualidade', true)).toBe(true);
    expect(podeEditarOModelo('coordenacao_qualidade', false)).toBe(false);
  });
});

describe('toda empresa registrada declara o que contratou', () => {
  it('o campo é obrigatório e o valor é um dos três', () => {
    // Sem isto um cliente novo herdaria a decisão por acidente — e o acidente seria abrir a
    // escrita para quem comprou só auditoria.
    for (const e of empresas()) {
      expect(MODOS, e.id).toContain(e.modo);
    }
  });
});
