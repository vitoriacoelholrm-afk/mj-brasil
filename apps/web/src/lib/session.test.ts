// A ENTRADA POR USUÁRIO E SENHA.
//
// É provisória — a senha é uma constante em código, igual para todos, até o banco entrar. Ainda
// assim tem teste, por dois motivos.
//
// O primeiro é que "provisório" é o que mais dura. Quando a autenticação de verdade chegar, é
// `autenticar` que muda; estes testes dizem o que o resto do app espera dela e continuam valendo
// depois, porque nenhum deles fala da senha em si — falam de quem entra e de quem não entra.
//
// O segundo é que os erros aqui são silenciosos. Entrar como a pessoa errada não quebra nada:
// só faz o registro sair assinado por quem não o preencheu, que é a falsificação de evidência
// que este sistema inteiro existe para impedir.
import { describe, it, expect } from 'vitest';
import { EQUIPE, SENHA_PROVISORIA, autenticar } from './session';

const VITORIA = 'Vitória Coelho Mendes';

describe('quem entra', () => {
  it('nome e senha certos entram, e entram como a pessoa certa', () => {
    const p = autenticar(VITORIA, SENHA_PROVISORIA);
    expect(p?.nome).toBe(VITORIA);
    expect(p?.papel).toBe('coordenacao_qualidade');
  });

  it('sem acento, em caixa qualquer, com espaço sobrando', () => {
    // Ninguém digita acento no meio de uma entrada com pressa, e nome copiado de planilha vem
    // com espaço na ponta. Recusar por isso é recusar por digitação, não por identidade.
    for (const tentativa of ['vitoria coelho mendes', 'VITÓRIA COELHO MENDES', '  Vitoria   Coelho Mendes  ']) {
      expect(autenticar(tentativa, SENHA_PROVISORIA)?.nome).toBe(VITORIA);
    }
  });

  it('o primeiro nome basta quando não há dúvida', () => {
    expect(autenticar('vitoria', SENHA_PROVISORIA)?.nome).toBe(VITORIA);
    expect(autenticar('Edine', SENHA_PROVISORIA)?.cargo).toBe('Financeiro e RH');
  });

  it('e não basta quando há duas pessoas com ele', () => {
    // Entrar como a pessoa errada é pior do que não entrar: o registro sai assinado por quem não
    // o preencheu. Havendo dúvida, ninguém entra.
    const primeiros = EQUIPE.map((p) => p.nome.split(' ')[0].toLowerCase());
    const repetido = primeiros.find((n, i) => primeiros.indexOf(n) !== i);
    if (repetido) expect(autenticar(repetido, SENHA_PROVISORIA)).toBeNull();
    else expect(new Set(primeiros).size).toBe(primeiros.length);   // hoje são todos distintos
  });
});

describe('quem não entra', () => {
  it('senha errada não entra, nem com o nome certo', () => {
    expect(autenticar(VITORIA, 'senha errada')).toBeNull();
    expect(autenticar(VITORIA, '')).toBeNull();
    expect(autenticar(VITORIA, '12345')).toBeNull();
  });

  it('nome que não existe não entra, nem com a senha certa', () => {
    expect(autenticar('Fulano de Tal', SENHA_PROVISORIA)).toBeNull();
  });

  it('usuário vazio não entra — nem em branco, nem só com espaço', () => {
    // Sem esta guarda, um campo vazio bateria com o primeiro nome vazio de alguém e entraria.
    expect(autenticar('', SENHA_PROVISORIA)).toBeNull();
    expect(autenticar('   ', SENHA_PROVISORIA)).toBeNull();
  });

  it('e a recusa é a MESMA nos dois casos', () => {
    // Responder "usuário não existe" transformaria a tela de entrada numa lista de quem trabalha
    // na empresa: bastaria testar nomes até um deles responder diferente.
    expect(autenticar('Fulano', SENHA_PROVISORIA)).toBeNull();
    expect(autenticar(VITORIA, 'errada')).toBeNull();
  });
});

describe('a senha é provisória, e isso está dito', () => {
  it('é uma constante única — trocar a autenticação é trocar um lugar só', () => {
    // Se a senha estivesse comparada em linha na tela, a troca pelo banco teria de achar cada
    // lugar onde ela foi escrita. Está numa constante, e quem a usa é só `autenticar`.
    expect(SENHA_PROVISORIA).toBe('123456');
  });

  it('todo mundo da equipe entra com ela — é isso que provisório quer dizer', () => {
    for (const p of EQUIPE) {
      expect(autenticar(p.nome, SENHA_PROVISORIA)?.id).toBe(p.id);
    }
  });
});
