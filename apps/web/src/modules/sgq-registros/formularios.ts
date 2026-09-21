// Os formulários que a ISO 9001 exige de qualquer empresa certificada.
//
// Não são de empresa nenhuma nem de setor nenhum: a 8.5.3, a 8.5.6 e a 8.7.2 pedem os mesmos
// campos de quem jateia, de quem usina e de quem monta. Por isso este módulo é essencial e
// qualquer cliente novo já o recebe pronto.
import type { FormularioDef } from '@/plataforma/formularios';

/* ══ 8.5.3 — Propriedade pertencente ao cliente ══════════════════════════════════════════════
   "Quando a propriedade de um cliente for perdida, danificada ou de outra forma constatada
   inadequada para uso, a organização deve relatar isso ao cliente e reter informação
   documentada sobre o que ocorreu."

   Duas obrigações, não uma: comunicar E registrar. Por isso os campos de comunicação são
   obrigatórios — sem eles o registro prova metade.                                             */

export const PROPRIEDADE_CLIENTE: FormularioDef = {
  papel: 'propriedade_cliente',
  setor: 'os',
  titulo: 'Ocorrência com Propriedade do Cliente',
  clausula: '8.5.3',
  explicacao:
    'Peça de cliente que se perdeu, danificou ou chegou inadequada para uso. A norma pede duas coisas: comunicar ao cliente e guardar o registro do que houve.',
  campos: [
    { chave: 'cliente', rotulo: 'Cliente', tipo: 'texto', obrigatorio: true },
    { chave: 'peca', rotulo: 'Peça ou lote', tipo: 'texto', obrigatorio: true, ajuda: 'Como a peça é identificada — a mesma identificação da ordem de serviço.' },
    { chave: 'os', rotulo: 'Ordem de serviço', tipo: 'texto', ajuda: 'Se houver uma OS em andamento para esta peça.' },
    {
      chave: 'ocorrencia', rotulo: 'O que houve', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Perdida', 'Danificada', 'Inadequada para uso'],
    },
    { chave: 'descricao', rotulo: 'Descrição', tipo: 'texto_longo', obrigatorio: true, ajuda: 'O que aconteceu, onde e em que etapa do processo.' },
    { chave: 'data', rotulo: 'Data da constatação', tipo: 'data', obrigatorio: true },
    { chave: 'constatadoPor', rotulo: 'Constatado por', tipo: 'pessoa', obrigatorio: true },
    { chave: 'comunicado', rotulo: 'Comunicado ao cliente', tipo: 'sim_nao', obrigatorio: true, ajuda: 'A norma exige a comunicação. Registrar sem comunicar não atende.' },
    { chave: 'comunicadoA', rotulo: 'Comunicado a quem', tipo: 'texto', obrigatorio: true, dependeDe: { campo: 'comunicado', valor: 'Sim' } },
    { chave: 'comunicadoEm', rotulo: 'Comunicado em', tipo: 'data', obrigatorio: true, dependeDe: { campo: 'comunicado', valor: 'Sim' } },
    { chave: 'meio', rotulo: 'Por qual meio', tipo: 'escolha', opcoes: ['E-mail', 'Telefone', 'Presencial', 'Ofício'], dependeDe: { campo: 'comunicado', valor: 'Sim' } },
    { chave: 'tratativa', rotulo: 'Tratativa acordada', tipo: 'texto_longo', ajuda: 'O que ficou combinado: refazer, substituir, abater, devolver como está.' },
  ],
};

/* ══ 8.5.6 — Controle de mudanças ════════════════════════════════════════════════════════════
   "A organização deve analisar criticamente e controlar mudanças para produção ou provisão de
   serviço [...] e reter informação documentada que descreva os resultados da análise crítica de
   mudanças, as pessoas que autorizam a mudança e quaisquer ações necessárias."

   Três coisas para reter: o resultado da análise, quem autorizou e as ações. São exatamente os
   três campos obrigatórios abaixo.                                                             */

export const MUDANCA_PRODUCAO: FormularioDef = {
  papel: 'mudanca_producao',
  setor: 'os',
  titulo: 'Análise Crítica de Mudança na Produção',
  clausula: '8.5.6',
  explicacao:
    'Mudança no processo, no insumo ou no esquema depois do serviço começado. Trocar de tinta, de abrasivo ou de esquema no meio de uma obra é exatamente isto.',
  campos: [
    {
      chave: 'tipo', rotulo: 'O que mudou', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Insumo (tinta, abrasivo)', 'Esquema de pintura', 'Processo ou método', 'Equipamento', 'Sequência ou prazo'],
    },
    { chave: 'descricao', rotulo: 'Descrição da mudança', tipo: 'texto_longo', obrigatorio: true, ajuda: 'De que para que, com nome e código do produto. "Troca de tinta" não serve: daqui a um ano ninguém lembra qual era qual.' },
    { chave: 'os', rotulo: 'Ordens de serviço afetadas', tipo: 'texto', ajuda: 'Quais OS já abertas mudam por causa disto.' },
    { chave: 'motivo', rotulo: 'Motivo', tipo: 'texto_longo', obrigatorio: true },
    { chave: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true },
    { chave: 'analisadoPor', rotulo: 'Analisado criticamente por', tipo: 'pessoa', obrigatorio: true },
    { chave: 'resultado', rotulo: 'Resultado da análise', tipo: 'texto_longo', obrigatorio: true, ajuda: 'O que a mudança afeta: conformidade, prazo, custo, garantia. É o que a norma manda reter.' },
    { chave: 'autorizadoPor', rotulo: 'Autorizado por', tipo: 'pessoa', obrigatorio: true, ajuda: 'A norma exige identificar quem autorizou — não basta dizer que foi autorizada.' },
    { chave: 'acoes', rotulo: 'Ações necessárias', tipo: 'texto_longo', ajuda: 'O que precisa ser feito por causa da mudança: avisar o cliente, refazer medição, trocar a especificação da OS.' },
    { chave: 'clienteAvisado', rotulo: 'Cliente precisa ser avisado', tipo: 'sim_nao' },
  ],
};

/* ══ 8.7.2 — Controle de saídas não conformes ═════════════════════════════════════════════════
   "A organização deve reter informação documentada que: a) descreva a não conformidade;
   b) descreva as ações tomadas; c) descreva as concessões obtidas; d) identifique a autoridade
   que decide a ação com relação à não conformidade."

   Quatro coisas, e as quatro são obrigatórias aqui. A "d" é a que mais falta na prática: o
   formulário diz o que foi feito com a peça e não diz QUEM decidiu — e é exatamente isso que o
   auditor pergunta.

   O mesmo registro atende também a 10.2.2 (ação corretiva), que é o bloco de baixo. São duas
   cláusulas num formulário só porque é um fato só: a peça saiu errada. O que a 8.7.2 quer saber
   é o que se fez com a PEÇA; o que a 10.2.2 quer saber é o que se fez com a CAUSA.              */

export const NAO_CONFORMIDADE: FormularioDef = {
  papel: 'nao_conformidade',
  setor: 'os',
  titulo: 'Relatório de Não Conformidade (RNC)',
  clausula: '8.7.2 e 10.2.2',
  explicacao:
    'Produto ou serviço que saiu fora do especificado. O que a norma pede é o que se fez com a peça, a concessão se houve, e o nome de quem decidiu — sem isso o registro não prova nada.',
  campos: [
    { chave: 'detectadaEm', rotulo: 'Detectada em', tipo: 'data', obrigatorio: true },
    { chave: 'detectadaPor', rotulo: 'Detectada por', tipo: 'pessoa', obrigatorio: true },
    {
      chave: 'origem', rotulo: 'Onde apareceu', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Recebimento', 'Durante o processo', 'Inspeção final', 'Reclamação do cliente', 'Auditoria'],
    },
    { chave: 'os', rotulo: 'Ordem de serviço', tipo: 'texto', ajuda: 'A OS em que a peça estava.' },
    { chave: 'peca', rotulo: 'Peça ou lote', tipo: 'texto', obrigatorio: true },
    { chave: 'descricao', rotulo: 'Descrição da não conformidade', tipo: 'texto_longo', obrigatorio: true, ajuda: 'O que estava especificado e o que se encontrou. Número contra número, não "fora do padrão".' },

    {
      chave: 'disposicao', rotulo: 'O que foi feito com a peça', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Correção / retrabalho', 'Segregação', 'Reclassificação', 'Devolução ao fornecedor', 'Sucateamento', 'Liberação sob concessão'],
      ajuda: 'A norma chama isto de ação tomada. É o destino da peça, não a ação sobre a causa.',
    },
    { chave: 'acoesTomadas', rotulo: 'Como foi feito', tipo: 'texto_longo', obrigatorio: true },
    { chave: 'reverificado', rotulo: 'Reverificado depois da correção', tipo: 'sim_nao', obrigatorio: true, dependeDe: { campo: 'disposicao', valor: 'Correção / retrabalho' }, ajuda: 'Peça corrigida tem de ser conferida de novo contra o especificado. A 8.7.1 é explícita nisso.' },

    { chave: 'concessao', rotulo: 'Houve concessão do cliente', tipo: 'sim_nao', obrigatorio: true, ajuda: 'Concessão é o cliente aceitar por escrito uma peça fora do especificado. Se houve, tem de estar registrada.' },
    { chave: 'concedidaPor', rotulo: 'Concedida por quem', tipo: 'texto', obrigatorio: true, dependeDe: { campo: 'concessao', valor: 'Sim' }, ajuda: 'Nome e cargo de quem, do lado do cliente, autorizou.' },
    { chave: 'concessaoEm', rotulo: 'Concedida em', tipo: 'data', obrigatorio: true, dependeDe: { campo: 'concessao', valor: 'Sim' } },

    { chave: 'autoridade', rotulo: 'Quem decidiu a disposição', tipo: 'pessoa', obrigatorio: true, ajuda: 'A autoridade que decidiu o destino da peça. É o campo que a 8.7.2 exige e que quase todo RNC esquece.' },

    { chave: 'causa', rotulo: 'Causa', tipo: 'texto_longo', ajuda: 'Daqui para baixo é a 10.2.2: o que se faz para não acontecer de novo.' },
    { chave: 'acaoCorretiva', rotulo: 'Ação corretiva', tipo: 'texto_longo' },
    { chave: 'eficaciaVerificadaPor', rotulo: 'Eficácia verificada por', tipo: 'pessoa' },
    { chave: 'eficaciaEm', rotulo: 'Eficácia verificada em', tipo: 'data' },
  ],
};

/* ══ 7.2 — Competência ═══════════════════════════════════════════════════════════════════════
   "A organização deve [...] onde aplicável, tomar ações para adquirir a competência necessária
   e avaliar a eficácia das ações tomadas [e] reter informação documentada apropriada como
   evidência de competência."

   Duas obrigações de novo, e a segunda é a que falta na prática: quase toda empresa guarda a
   lista de presença e nenhuma guarda a AVALIAÇÃO DA EFICÁCIA. Lista de presença prova que a
   pessoa sentou na sala; não prova que ficou competente.

   Este é também o registro de onde sai o indicador de eficácia de treinamento — o mesmo que
   apareceu com 200% na planilha de 2025.                                                      */

export const REGISTRO_TREINAMENTO: FormularioDef = {
  papel: 'registro_treinamento',
  setor: 'rh',
  titulo: 'Registro de Treinamento',
  clausula: '7.2',
  explicacao:
    'Treinamento dado, e se ele funcionou. A norma pede as duas coisas: a evidência de que a pessoa foi treinada e a avaliação de que ficou competente.',
  campos: [
    { chave: 'colaborador', rotulo: 'Colaborador', tipo: 'texto', obrigatorio: true },
    { chave: 'funcao', rotulo: 'Função', tipo: 'texto', obrigatorio: true, ajuda: 'O posto que a pessoa ocupa — é contra ele que a competência se mede.' },
    { chave: 'treinamento', rotulo: 'Treinamento', tipo: 'texto', obrigatorio: true },
    {
      chave: 'tipo', rotulo: 'Tipo', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Integração', 'Interno', 'Externo', 'No posto de trabalho', 'Reciclagem'],
    },
    { chave: 'instrutor', rotulo: 'Instrutor', tipo: 'texto', obrigatorio: true },
    { chave: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true },
    { chave: 'cargaHoraria', rotulo: 'Carga horária', tipo: 'texto', ajuda: 'Em horas.' },
    { chave: 'conteudo', rotulo: 'Conteúdo', tipo: 'texto_longo' },

    {
      chave: 'eficacia', rotulo: 'Avaliação da eficácia', tipo: 'escolha', obrigatorio: true,
      opcoes: ['A avaliar', 'Eficaz', 'Não eficaz'],
      ajuda: 'A norma não pede só o treinamento: pede avaliar se ele funcionou. Deixar em "a avaliar" é aceitável enquanto o prazo não venceu.',
    },
    { chave: 'comoAvaliado', rotulo: 'Como foi avaliado', tipo: 'texto_longo', obrigatorio: true, dependeDe: { campo: 'eficacia', valor: 'Eficaz' }, ajuda: 'Prova, observação no posto, reinspeção de peça. Sem isto, "eficaz" é opinião.' },
    { chave: 'avaliadoPor', rotulo: 'Avaliado por', tipo: 'pessoa', obrigatorio: true, dependeDe: { campo: 'eficacia', valor: 'Eficaz' } },
    { chave: 'acaoSeNaoEficaz', rotulo: 'Ação tomada', tipo: 'texto_longo', obrigatorio: true, dependeDe: { campo: 'eficacia', valor: 'Não eficaz' }, ajuda: 'Treinamento que não funcionou e não gerou ação é achado de auditoria.' },
  ],
};
