// PORTARIA — o livro de entrada e saída de cargas.
//
// Este arquivo é o que o módulo diz sobre si mesmo: o que atende, que telas põe no menu, que
// formulário traz e quem pode entrar. Nada fora da pasta precisa saber como ele funciona por
// dentro; o registro (`modules/index.ts`) só lê isto.
//
// NÃO é essencial: a norma não exige um livro de portaria. Exige duas coisas que passam por ele
// — a §8.5.3 (propriedade do cliente que chega avariada) e a §8.5.4 (o que sai, sai preservado).
// Empresa que recebe e despacha carga precisa; consultório de engenharia, não.
import { createElement } from 'react';
import type { Modulo } from '@/plataforma/modulo';
import { Registros } from '@/telas/Registros';
import { CONTROLE_CARGAS } from './formularios';
import { PainelDaPortaria } from './ui/Painel';

export const portaria: Modulo = {
  chave: 'portaria',
  nome: 'Portaria',
  descricao:
    'O livro do portão: o que entrou, o que saiu, em que veículo e com quem — e, somado, o que é do cliente e está no pátio agora.',
  clausulas: ['8.5.3', '8.5.4'],
  dominio: 'Portaria',
  exige: 'portaria.ver',
  essencial: false,
  formularios: [CONTROLE_CARGAS],
  telas: [{
    rotulo: 'Entrada e Saída de Cargas',
    rota: 'cargas',
    // `createElement` em vez de JSX porque este arquivo é o manifesto, não a tela: mantê-lo em
    // .ts deixa claro que não há desenho aqui dentro.
    render: () => createElement(Registros, {
      def: CONTROLE_CARGAS,
      painel: (registros) => createElement(PainelDaPortaria, { registros }),
    }),
  }],
};
