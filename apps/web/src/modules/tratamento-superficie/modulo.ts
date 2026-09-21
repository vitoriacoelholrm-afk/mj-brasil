// TRATAMENTO DE SUPERFÍCIE — a ordem de serviço do jateamento e da pintura, e o relatório de
// inspeção que sai dela.
//
// Este é o módulo SETORIAL, e o exemplo do que não deve subir para a plataforma: as grandezas
// (espessura de película seca, rugosidade, sais solúveis, ponto de orvalho), as etapas
// (preparação, demão, cura) e a tolerância de medição são de quem jateia e pinta. Uma serralheria
// certificada não tem nada disso, e teria outras.
//
// NÃO é essencial: instala quem faz o serviço.
import { createElement } from 'react';
import type { Modulo } from '@/plataforma/modulo';
import { PlanoServico } from '@/telas/PlanoServico';

export const tratamentoSuperficie: Modulo = {
  chave: 'tratamento-superficie',
  nome: 'Ordens de Serviço',
  descricao:
    'A ordem de serviço do tratamento de superfície: o que foi especificado, o que foi medido, e o relatório de inspeção que vai ao cliente.',
  clausulas: ['8.5.1', '8.6', '8.7.1'],
  dominio: 'Ordens de Serviço',
  exige: 'os.ver',
  essencial: false,
  telas: [{ rotulo: 'Ordens de Serviço', rota: 'plano', render: () => createElement(PlanoServico) }],
};
