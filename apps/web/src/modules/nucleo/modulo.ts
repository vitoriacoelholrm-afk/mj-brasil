// NÚCLEO — as telas que existem em qualquer instalação, de qualquer setor.
//
// A situação (a home, que responde "estamos em dia?"), os vencimentos e os instrumentos de
// medição, e o cadastro de clientes. As três últimas são a face dos módulos do catálogo que já
// vieram instalados; a home é do app.
//
// Não se desinstala: um sistema sem home e sem cadastro de cliente não é um sistema.
import { createElement } from 'react';
import type { Modulo } from '@/plataforma/modulo';
import { Clientes } from '@/modules/nucleo/ui/Clientes';
import { Instrumentos } from '@/modules/nucleo/ui/Instrumentos';
import { Vencimentos } from '@/modules/nucleo/ui/Vencimentos';

/** A home fica fora da lista de telas comuns: ela é o destino padrão, e quem a desenha precisa
 *  saber navegar para as outras. O registro a trata à parte. */
export const nucleo: Modulo = {
  chave: 'nucleo',
  nome: 'Núcleo',
  descricao: 'A situação do sistema, os vencimentos controlados, os instrumentos e os clientes.',
  clausulas: ['7.1.5', '9.3'],
  // Vencimento e instrumento são o que se acompanha para saber se ainda vale — 7.1.5 e a
  // validade das certificações. Acompanha-se, não se emite nem se arquiva.
  dominio: 'Monitoramento',
  exige: 'sgq.ver',
  essencial: true,
  telas: [
    { rotulo: 'Vencimentos', rota: 'vencimentos', render: () => createElement(Vencimentos) },
    { rotulo: 'Instrumentos', rota: 'instrumentos', render: () => createElement(Instrumentos) },
  ],
};

export const cadastros: Modulo = {
  chave: 'nucleo/cadastros',
  nome: 'Cadastros',
  descricao: 'Quem a empresa atende.',
  clausulas: ['8.2'],
  dominio: 'Cadastros',
  exige: 'sgq.ver',
  essencial: true,
  telas: [{ rotulo: 'Clientes', rota: 'clientes', render: () => createElement(Clientes) }],
};
