// SUPRIMENTOS — compras, recebimento e expedição.
//
// Nasceu em 21/09/2026 por decisão dela. Os quatro formulários já estavam na lista mestra da
// empresa 01, com código, e não tinham nada atrás — e não tinham porque faltava responder a
// pergunta que vem antes do formulário: quem preenche. Os setores existentes eram ordem de
// serviço, pessoas, portaria e gestão do sistema, e nenhum deles é compras.
//
// Os três momentos moram juntos porque são um caminho só: o que se pede, o que chega e o que sai.
// Quem confere a nota fiscal na entrada é quem assina o romaneio na saída, na maioria das casas
// desse tamanho — e separá-los criaria dois setores com uma pessoa cada.
//
// ESSENCIAL: não há empresa certificada que não compre. A 8.4 é uma das cláusulas que a auditoria
// sempre abre, porque é por onde o problema de outro entra no processo da casa.
import { createElement } from 'react';
import type { Modulo } from '@/plataforma/modulo';
import { AVALIACAO_FORNECEDOR, PEDIDO_COMPRA, RECEBIMENTO, ROMANEIO } from './formularios';
import { Registros } from '@/ui/Registros';

export const suprimentos: Modulo = {
  chave: 'suprimentos',
  nome: 'Suprimentos',
  descricao:
    'O que a empresa compra, o que ela recebe e o que ela expede: pedido com requisito comunicado, inspeção de entrada, avaliação do fornecedor e romaneio.',
  clausulas: ['8.4', '8.4.1', '8.4.3', '8.5.4'],
  dominio: 'Suprimentos',
  exige: 'suprimentos.ver',
  essencial: true,
  formularios: [PEDIDO_COMPRA, RECEBIMENTO, AVALIACAO_FORNECEDOR, ROMANEIO],
  telas: [
    {
      rotulo: 'Pedidos de Compra',
      rota: 'pedido-compra',
      formulario: 'pedido_compra',
      render: () => createElement(Registros, { def: PEDIDO_COMPRA }),
    },
    {
      rotulo: 'Recebimento',
      rota: 'recebimento',
      formulario: 'recebimento',
      render: () => createElement(Registros, { def: RECEBIMENTO }),
    },
    {
      rotulo: 'Fornecedores',
      rota: 'avaliacao-fornecedor',
      formulario: 'avaliacao_fornecedor',
      render: () => createElement(Registros, { def: AVALIACAO_FORNECEDOR }),
    },
    {
      rotulo: 'Expedição',
      rota: 'romaneio',
      formulario: 'romaneio',
      render: () => createElement(Registros, { def: ROMANEIO }),
    },
  ],
};
