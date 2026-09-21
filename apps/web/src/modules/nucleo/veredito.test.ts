// O VEREDITO DA HOME.
//
// O primeiro grupo é o motivo de tudo isto existir como função separada. A home é o que alguém
// olha de relance antes de decidir NÃO ir olhar mais nada — e enquanto o veredito tinha dois
// estados, a única saída possível para "não consegui ler" era anunciar que estava tudo em dia.
import { describe, it, expect } from 'vitest';
import { motivoLegivel, quantosEmAtencao, vereditoDe } from './veredito';

describe('não ter lido não é estar em dia', () => {
  it('erro vence a contagem, mesmo que a contagem esteja limpa', () => {
    // O caso exato do defeito: sem dado, `counts` vem vazio, a soma dá zero, e a leitura ingênua
    // conclui "em dia". Dizer que está tudo certo sem ter lido manda a pessoa embora; dizer que
    // não sabe manda ela conferir.
    expect(vereditoDe('falha ao carregar', {})).toBe('sem_leitura');
    expect(vereditoDe('qualquer erro', { expired: 0, d7: 0, d15: 0, d30: 0, later: 5 })).toBe('sem_leitura');
  });

  it('e vence até quando a contagem acusaria atenção', () => {
    // Se houvesse dado parcial, o veredito ainda é "não sei": metade de uma leitura não é leitura.
    expect(vereditoDe('erro', { expired: 3 })).toBe('sem_leitura');
  });

  it('sem erro, o veredito é a contagem', () => {
    expect(vereditoDe(null, {})).toBe('em_dia');
    expect(vereditoDe(undefined, { later: 5 })).toBe('em_dia');
    expect(vereditoDe(null, { expired: 1, later: 4 })).toBe('atencao');
    expect(vereditoDe('', { d30: 2 })).toBe('atencao');   // string vazia não é erro
  });
});

describe('o que conta como atenção', () => {
  it('vencido e a vencer em até 30 dias', () => {
    expect(quantosEmAtencao({ expired: 1, d7: 2, d15: 3, d30: 4 })).toBe(10);
  });

  it('e o que está controlado NÃO conta', () => {
    // `later` é o estado normal e saudável — é onde estão os cinco instrumentos da empresa 01.
    // Somá-lo faria a home nascer alarmada e ninguém mais olharia para o alarme.
    expect(quantosEmAtencao({ later: 99 })).toBe(0);
    expect(vereditoDe(null, { later: 99 })).toBe('em_dia');
  });

  it('e balde ausente vale zero, não quebra', () => {
    expect(quantosEmAtencao({})).toBe(0);
  });
});

describe('a falha dita em português', () => {
  it('HTML no lugar de dado quer dizer que não há servidor ali', () => {
    // É a mensagem literal que aparece num site estático: o endereço devolve a própria página.
    const m = motivoLegivel(`Unexpected token '<', "<!doctype "... is not valid JSON`);
    expect(m).toContain('não há servidor');
  });

  it('rede fora e sessão recusada são coisas diferentes', () => {
    expect(motivoLegivel('Failed to fetch')).toContain('não respondeu');
    expect(motivoLegivel('no active membership')).toContain('não aceitou');
  });

  it('e o que não se reconhece vira uma frase honesta, não um palpite', () => {
    expect(motivoLegivel('coisa estranha nunca vista')).toBe('O banco não pôde ser lido.');
  });

  it('a mensagem crua não some — some do lugar de destaque', () => {
    // Quem vai consertar precisa do texto original. O que mudou é que ele deixou de ser a única
    // coisa que a tela diz.
    for (const bruto of ['Failed to fetch', 'no active membership', 'outra qualquer']) {
      expect(motivoLegivel(bruto)).not.toBe(bruto);
    }
  });
});
