// MANUAL — a norma como índice do sistema inteiro.
//
// Não traz formulário nem guarda dado: ele cruza o que os outros módulos já têm, pela cláusula.
// Por isso atende, na declaração, a 4.4 (o SGQ e seus processos) e a 7.5.1 — é o lugar onde o
// sistema se mostra por inteiro, que é o que um manual da qualidade faz no papel.
//
// Essencial: a empresa pode não ter portaria, mas não existe SGQ sem norma.
import { createElement } from 'react';
import type { Modulo } from '@/plataforma/modulo';
import { Manual } from './ui/Manual';

export const sgqManual: Modulo = {
  chave: 'sgq-manual',
  nome: 'Manual',
  descricao:
    'A ISO 9001:2015 cláusula por cláusula, e o que a empresa tem em cada uma: documento, tela de registro e o que ainda falta.',
  clausulas: ['4.4', '7.5.1'],
  dominio: 'Manual',
  exige: 'sgq.ver',
  essencial: true,
  telas: [{ rotulo: 'Manual', rota: 'manual', render: (ctx) => createElement(Manual, ctx) }],
};
