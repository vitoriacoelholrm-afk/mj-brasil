// REGISTROS DO SGQ — os formulários que a ISO 9001 exige de qualquer empresa certificada.
//
// Quatro cláusulas, quatro registros, e nenhum deles depende do que a empresa fabrica: a 8.5.3
// (peça do cliente que se perdeu ou danificou), a 8.5.6 (mudança na produção), a 8.7.2 com a
// 10.2.2 (saída não conforme e o que se fez para não repetir) e a 7.2 (treinamento e se
// funcionou). Por isso é ESSENCIAL: quem certifica, tem.
//
// A tela é uma só — a `Registros`, que sabe desenhar qualquer definição. O que muda de um
// formulário para o outro é a definição, não a tela.
import { createElement } from 'react';
import type { Modulo } from '@/plataforma/modulo';
import {
  MUDANCA_PRODUCAO, NAO_CONFORMIDADE, PROPRIEDADE_CLIENTE, REGISTRO_TREINAMENTO,
} from './formularios';
import { Registros } from '@/telas/Registros';

export const sgqRegistros: Modulo = {
  chave: 'sgq-registros',
  nome: 'Registros do SGQ',
  descricao:
    'Os registros que a norma exige de qualquer empresa certificada: propriedade do cliente, mudança na produção, saída não conforme e competência.',
  clausulas: ['7.2', '8.5.3', '8.5.6', '8.7.2', '10.2.2'],
  dominio: 'Qualidade',
  exige: 'sgq.ver',
  essencial: true,
  formularios: [PROPRIEDADE_CLIENTE, MUDANCA_PRODUCAO, NAO_CONFORMIDADE, REGISTRO_TREINAMENTO],
  telas: [
    {
      rotulo: 'Não Conformidades',
      rota: 'nao-conformidade',
      render: () => createElement(Registros, { def: NAO_CONFORMIDADE }),
    },
    {
      rotulo: 'Propriedade do Cliente',
      rota: 'propriedade-cliente',
      render: () => createElement(Registros, { def: PROPRIEDADE_CLIENTE }),
    },
    {
      rotulo: 'Mudanças na Produção',
      rota: 'mudanca-producao',
      render: () => createElement(Registros, { def: MUDANCA_PRODUCAO }),
    },
  ],
};

/** A ficha de treinamento é do mesmo módulo e de OUTRO setor: o RH preenche, e quem toca a ordem
 *  de serviço não entra. Por isso é um domínio de menu separado, com permissão própria — mesmo
 *  módulo, porta diferente. */
export const sgqCompetencia: Modulo = {
  chave: 'sgq-registros/competencia',
  nome: 'Pessoas',
  descricao: 'Treinamento dado e a avaliação de que a pessoa ficou competente.',
  clausulas: ['7.2'],
  dominio: 'Pessoas',
  exige: 'rh.ver',
  essencial: true,
  telas: [{
    rotulo: 'Registro de Treinamento',
    rota: 'treinamento',
    render: () => createElement(Registros, { def: REGISTRO_TREINAMENTO }),
  }],
};
