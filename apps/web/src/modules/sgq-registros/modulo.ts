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
  COMUNICACAO_SGQ, MUDANCA_PRODUCAO, NAO_CONFORMIDADE, POS_ENTREGA, PROPRIEDADE_CLIENTE,
  REGISTRO_TREINAMENTO,
} from './formularios';
import { PESQUISA_SATISFACAO, PLANO_ACAO, PLANO_AUDITORIA } from './formularios.gestao';
import { Registros } from '@/ui/Registros';

export const sgqRegistros: Modulo = {
  chave: 'sgq-registros',
  nome: 'Registros do SGQ',
  descricao:
    'Os registros que a norma exige de qualquer empresa certificada: propriedade do cliente, mudança na produção, saída não conforme e competência.',
  clausulas: ['7.2', '7.4', '8.5.3', '8.5.5', '8.5.6', '8.7.2', '9.1.2', '9.2', '10.2', '10.2.2'],
  dominio: 'Qualidade',
  exige: 'sgq.ver',
  essencial: true,
  formularios: [
    PROPRIEDADE_CLIENTE, MUDANCA_PRODUCAO, NAO_CONFORMIDADE, REGISTRO_TREINAMENTO, COMUNICACAO_SGQ,
    POS_ENTREGA, PLANO_ACAO, PLANO_AUDITORIA, PESQUISA_SATISFACAO,
  ],
  telas: [
    {
      rotulo: 'Não Conformidades',
      rota: 'nao-conformidade',
      formulario: 'nao_conformidade',
      render: () => createElement(Registros, { def: NAO_CONFORMIDADE }),
    },
    {
      rotulo: 'Propriedade do Cliente',
      rota: 'propriedade-cliente',
      formulario: 'propriedade_cliente',
      render: () => createElement(Registros, { def: PROPRIEDADE_CLIENTE }),
    },
    {
      rotulo: 'Mudanças na Produção',
      rota: 'mudanca-producao',
      formulario: 'mudanca_producao',
      render: () => createElement(Registros, { def: MUDANCA_PRODUCAO }),
    },
    // A matriz de comunicação fica no mesmo domínio de menu, mas é de OUTRO setor: quem a
    // determina é a direção (§7.4 manda a organização determinar, e determinar é liderança).
    // A tela abre para todos e só escreve quem tem o setor — a própria tela explica isso.
    {
      rotulo: 'Comunicação',
      rota: 'comunicacao',
      formulario: 'comunicacao_sgq',
      render: () => createElement(Registros, { def: COMUNICACAO_SGQ }),
    },
    // O chamado de campo é do setor da ordem de serviço: quem executou o serviço é quem vai
    // atender o que voltou dele, e a OS original é onde está o que foi medido e liberado.
    {
      rotulo: 'Pós-Entrega',
      rota: 'pos-entrega',
      formulario: 'pos_entrega',
      render: () => createElement(Registros, { def: POS_ENTREGA }),
    },
    // O plano de ação é do mesmo setor da não conformidade de onde ele nasce. Separar os dois
    // faria o tratamento parar no meio, esperando outra pessoa entrar noutro setor.
    {
      rotulo: 'Planos de Ação',
      rota: 'plano-acao',
      formulario: 'plano_acao',
      render: () => createElement(Registros, { def: PLANO_ACAO }),
    },
    // Estas duas são da gestão do sistema, e por isso do setor da direção: o programa de auditoria
    // e a percepção do cliente são o que a empresa mede sobre SI MESMA.
    {
      rotulo: 'Auditoria Interna',
      rota: 'plano-auditoria',
      formulario: 'plano_auditoria',
      render: () => createElement(Registros, { def: PLANO_AUDITORIA }),
    },
    {
      rotulo: 'Satisfação do Cliente',
      rota: 'satisfacao',
      formulario: 'pesquisa_satisfacao',
      render: () => createElement(Registros, { def: PESQUISA_SATISFACAO }),
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
    formulario: 'registro_treinamento',
    render: () => createElement(Registros, { def: REGISTRO_TREINAMENTO }),
  }],
};
