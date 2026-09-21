// DOCUMENTOS DO SGQ — a lista mestra e o diagnóstico contra a norma.
//
// A §7.5.3 manda controlar a informação documentada: saber quais documentos existem, em que
// revisão, e que a versão em uso é a atual. É o que a lista mestra faz.
//
// O diagnóstico é o outro lado da mesma moeda: compara a lista da empresa com o catálogo do que
// a norma pede e mostra o que falta. É a ferramenta de quem implanta — e por isso ele aponta
// buraco em vez de esconder.
import { createElement } from 'react';
import type { Modulo } from '@/plataforma/modulo';
import { Diagnostico } from '@/modules/sgq-documentos/ui/Diagnostico';
import { ListaMestra } from '@/modules/sgq-documentos/ui/ListaMestra';

export const sgqDocumentos: Modulo = {
  chave: 'sgq-documentos',
  nome: 'Documentos',
  descricao:
    'A lista mestra da empresa, a codificação dela, e o diagnóstico do que a norma pede e ainda não existe.',
  clausulas: ['7.5.1', '7.5.2', '7.5.3'],
  dominio: 'Qualidade',
  exige: 'sgq.ver',
  essencial: true,
  telas: [
    { rotulo: 'Diagnóstico', rota: 'diagnostico', render: () => createElement(Diagnostico) },
    { rotulo: 'Lista Mestra', rota: 'lista-mestra', render: () => createElement(ListaMestra) },
  ],
};
