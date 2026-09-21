// O registro de monitoramento do SGQ — a ficha de apuração de um indicador.
//
// Mora no módulo dos indicadores porque é a face em formulário do que o motor calcula: o mesmo
// período, a mesma meta, o mesmo resultado. Guardar os dois em lugares diferentes seria pedir
// que divergissem.
import type { FormularioDef } from '@/plataforma/formularios';

/* ══ 9.1.1 — Monitoramento, medição, análise e avaliação ══════════════════════════════════════
   "A organização deve reter informação documentada apropriada como evidência dos resultados."

   Parte disto já existe: o relatório de inspeção mede o PRODUTO. O que faltava é o indicador do
   SISTEMA — o número que a direção olha na análise crítica. Um registro por indicador e por
   período, porque é assim que ele é apurado e é assim que se compara com o período anterior.

   O campo de ação é obrigatório só quando a meta NÃO foi atingida: indicador que estourou e
   ninguém fez nada é achado de auditoria, não é registro.                                       */

export const MONITORAMENTO_SGQ: FormularioDef = {
  papel: 'monitoramento_sgq',
  setor: 'os',
  titulo: 'Indicadores do SGQ',
  clausula: '9.1.1',
  explicacao:
    'O resultado apurado de cada indicador do sistema, período a período. É a matéria-prima da análise crítica pela direção — sem estes números, a reunião não tem o que analisar.',
  campos: [
    { chave: 'periodo', rotulo: 'Período', tipo: 'texto', obrigatorio: true, ajuda: 'Setembro/2026, 3º trimestre/2026 — o mesmo recorte todo período, senão não dá para comparar.' },
    { chave: 'indicador', rotulo: 'Indicador', tipo: 'texto', obrigatorio: true, ajuda: 'Por exemplo: retrabalho por OS, reclamações de cliente, prazo cumprido, RNC abertas, satisfação do cliente.' },
    { chave: 'oQueMede', rotulo: 'Como é apurado', tipo: 'texto_longo', ajuda: 'De onde sai o número. A norma pede o método, e é o que permite outra pessoa apurar igual no mês seguinte.' },
    { chave: 'meta', rotulo: 'Meta', tipo: 'texto', obrigatorio: true },
    { chave: 'resultado', rotulo: 'Resultado', tipo: 'texto', obrigatorio: true },
    { chave: 'atingiu', rotulo: 'Atingiu a meta', tipo: 'sim_nao', obrigatorio: true },
    { chave: 'analise', rotulo: 'Análise', tipo: 'texto_longo', obrigatorio: true, ajuda: 'O que o número diz. A 9.1.3 pede que os dados sejam analisados, não só coletados.' },
    { chave: 'acao', rotulo: 'Ação', tipo: 'texto_longo', obrigatorio: true, dependeDe: { campo: 'atingiu', valor: 'Não' }, ajuda: 'Meta não atingida sem ação registrada é achado de auditoria.' },
    { chave: 'apuradoPor', rotulo: 'Apurado por', tipo: 'pessoa', obrigatorio: true },
    { chave: 'data', rotulo: 'Data da apuração', tipo: 'data', obrigatorio: true },
  ],
};
