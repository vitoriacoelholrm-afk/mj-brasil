// INDICADORES — a §9.1, o que a empresa mede para saber se o sistema funciona.
//
// O módulo guarda o motor que calcula o resultado a partir do numerador e do denominador, decide
// sozinho se a meta foi atingida, e confere a série inteira atrás do que não fecha: mês com
// resultado impossível, fórmula invertida, dois indicadores diferentes com números idênticos,
// indicador parado há meses ainda mostrando verde.
//
// O veredito é calculado, nunca marcado — é a regra da casa. Indicador em que alguém digita
// "atingiu: sim" não é indicador, é opinião com número do lado.
import { createElement } from 'react';
import type { Modulo } from '@/plataforma/modulo';
import { MONITORAMENTO_SGQ } from './formularios';
import { Indicadores } from '@/telas/Indicadores';

export const sgqIndicadores: Modulo = {
  chave: 'sgq-indicadores',
  nome: 'Indicadores',
  descricao:
    'As metas do sistema da qualidade, o apurado de cada período e o que não fecha na série.',
  clausulas: ['9.1.1', '9.1.3'],
  dominio: 'Qualidade',
  exige: 'sgq.ver',
  essencial: true,
  formularios: [MONITORAMENTO_SGQ],
  telas: [{ rotulo: 'Indicadores', rota: 'indicadores', render: () => createElement(Indicadores) }],
};
