// OS REGISTROS DA GESTÃO DO SISTEMA — o que se preenche sobre o próprio SGQ.
//
// Separados dos registros de operação porque a pergunta "quem preenche" tem resposta diferente. O
// que se registra sobre uma peça é de quem toca a peça; o que se registra sobre o SISTEMA é de
// quem responde pelo sistema. O plano de ação é a exceção e está aqui por parentesco: ele nasce
// da não conformidade, e quem trata a NC é quem o escreve.
//
// Nenhum deles inventa cláusula: a 10.2 pede a ação corretiva e a evidência da eficácia dela, a
// 9.2 pede o programa de auditoria, a 9.1.2 pede monitorar a percepção do cliente.
import type { FormularioDef } from '@/plataforma/formularios';

/** 5W2H — o plano que fecha uma não conformidade.
 *
 *  A 10.2.1 não se satisfaz com "ação tomada": manda analisar criticamente a EFICÁCIA da ação. Por
 *  isso o formulário tem duas metades, e a segunda só abre quando a primeira venceu o prazo — um
 *  plano sem verificação de eficácia é a não conformidade mais comum em auditoria de recertificação. */
export const PLANO_ACAO: FormularioDef = {
  papel: 'plano_acao',
  // Mesmo setor da não conformidade de onde ele nasce: quem trata a NC escreve o plano. Separar os
  // dois faria o registro parar no meio, esperando outra pessoa entrar noutro setor.
  setor: 'os',
  titulo: 'Plano de Ação (5W2H)',
  clausula: '10.2',
  explicacao:
    'O que vai ser feito para a não conformidade não se repetir — e, depois do prazo, se funcionou. A norma pede as duas coisas: a ação e a análise crítica da eficácia dela.',
  campos: [
    { chave: 'origem', rotulo: 'Origem', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Não conformidade', 'Auditoria interna', 'Auditoria externa', 'Reclamação de cliente', 'Análise crítica pela direção', 'Indicador fora da meta', 'Oportunidade de melhoria'],
      ajuda: 'De onde veio a necessidade. É o que liga o plano ao fato que o gerou.' },
    { chave: 'numeroDaNc', rotulo: 'Número do RNC', tipo: 'texto',
      dependeDe: { campo: 'origem', valor: 'Não conformidade' },
      ajuda: 'O RNC que este plano responde. Sem ele, os dois registros ficam soltos um do outro.' },

    { chave: 'oQue', rotulo: 'O quê — a ação', tipo: 'texto_longo', obrigatorio: true,
      ajuda: 'A ação em si. "Treinar a equipe" é intenção; "treinar os 4 pintores no PO-005, com prova prática" é ação.' },
    { chave: 'porQue', rotulo: 'Por quê — a causa que ataca', tipo: 'texto_longo', obrigatorio: true,
      ajuda: 'A CAUSA, não o sintoma. Ação que não aponta causa é correção, e correção não impede a repetição.' },
    { chave: 'onde', rotulo: 'Onde', tipo: 'texto', obrigatorio: true },
    { chave: 'quem', rotulo: 'Quem — responsável pela ação', tipo: 'pessoa', obrigatorio: true },
    { chave: 'quando', rotulo: 'Quando — prazo', tipo: 'data', obrigatorio: true,
      ajuda: 'A data em que a ação tem de estar concluída. É contra ela que o atraso se mede.' },
    { chave: 'como', rotulo: 'Como', tipo: 'texto_longo', obrigatorio: true },
    { chave: 'quanto', rotulo: 'Quanto custa', tipo: 'texto',
      ajuda: 'Recurso necessário, quando houver. Em branco quer dizer que a ação não pede recurso próprio.' },

    { chave: 'abertoEm', rotulo: 'Aberto em', tipo: 'data', obrigatorio: true, preenchidoCom: 'hoje' },
    { chave: 'abertoPor', rotulo: 'Aberto por', tipo: 'pessoa', obrigatorio: true, preenchidoCom: 'quem_registra' },

    { chave: 'situacao', rotulo: 'Situação', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Em andamento', 'Concluída', 'Cancelada'] },
    { chave: 'concluidaEm', rotulo: 'Concluída em', tipo: 'data', obrigatorio: true,
      dependeDe: { campo: 'situacao', valor: 'Concluída' } },
    { chave: 'motivoDoCancelamento', rotulo: 'Por que foi cancelada', tipo: 'texto_longo', obrigatorio: true,
      dependeDe: { campo: 'situacao', valor: 'Cancelada' },
      ajuda: 'Ação cancelada sem justificativa registrada é ação que sumiu — e o auditor procura as que sumiram.' },

    { chave: 'eficacia', rotulo: 'A ação foi eficaz?', tipo: 'escolha', obrigatorio: true,
      dependeDe: { campo: 'situacao', valor: 'Concluída' },
      opcoes: ['A verificar', 'Eficaz', 'Não eficaz'],
      ajuda: 'A 10.2.1 manda analisar criticamente a eficácia. "A verificar" é honesto enquanto o prazo de verificação não chegou.' },
    { chave: 'comoVerificado', rotulo: 'Como foi verificado', tipo: 'texto_longo', obrigatorio: true,
      dependeDe: { campo: 'eficacia', valor: 'Eficaz' },
      ajuda: 'Reinspeção, indicador que voltou à meta, auditoria de acompanhamento. Sem isto, "eficaz" é opinião.' },
    { chave: 'verificadoPor', rotulo: 'Verificado por', tipo: 'pessoa', obrigatorio: true,
      dependeDe: { campo: 'eficacia', valor: 'Eficaz' } },
    { chave: 'novaAcao', rotulo: 'O que se fez então', tipo: 'texto_longo', obrigatorio: true,
      dependeDe: { campo: 'eficacia', valor: 'Não eficaz' },
      ajuda: 'Ação que não funcionou e não gerou outra é achado de auditoria: o problema continua e o sistema parou de olhar.' },

    { chave: 'observacoes', rotulo: 'Observações', tipo: 'texto_longo' },
  ],
  anexos: {
    titulo: 'Evidências da ação e da verificação',
    vazio: 'Sem anexo. A evidência da eficácia costuma ser um documento: reinspeção, lista de presença do treinamento, relatório do indicador.',
  },
};

/** O programa de auditoria interna — a 9.2.2 lista o que ele precisa ter, e são seis coisas. */
export const PLANO_AUDITORIA: FormularioDef = {
  papel: 'plano_auditoria',
  // Gestão do próprio sistema: quem determina o programa de auditoria é a direção. E há um motivo
  // a mais aqui — a 9.2.2 manda assegurar objetividade e imparcialidade na seleção do auditor.
  setor: 'sgq',
  titulo: 'Plano de Auditoria Interna',
  clausula: '9.2',
  explicacao:
    'Uma auditoria planejada: o que vai ser auditado, contra qual critério, por quem e quando. A norma pede o programa documentado e a evidência de que ele foi executado.',
  campos: [
    { chave: 'numero', rotulo: 'Número da auditoria', tipo: 'texto', obrigatorio: true,
      ajuda: 'Ex.: 01/2026. É por ele que o relatório e as não conformidades voltam a este plano.' },
    { chave: 'tipo', rotulo: 'Tipo', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Programada', 'Extraordinária', 'Acompanhamento de ação corretiva'] },
    { chave: 'escopo', rotulo: 'Escopo', tipo: 'texto_longo', obrigatorio: true,
      ajuda: 'Quais processos e quais áreas entram nesta auditoria.' },
    { chave: 'criterios', rotulo: 'Critérios', tipo: 'texto_longo', obrigatorio: true,
      ajuda: 'Contra o quê se audita: a ISO 9001:2015, os procedimentos da casa, requisito de cliente. A 9.2.2 pede os critérios definidos.' },
    { chave: 'clausulas', rotulo: 'Cláusulas auditadas', tipo: 'texto',
      ajuda: 'Ex.: 8.5, 8.6, 9.1. Em branco quer dizer a norma inteira.' },

    { chave: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true },
    { chave: 'horaInicio', rotulo: 'Início', tipo: 'hora' },
    { chave: 'horaFim', rotulo: 'Término', tipo: 'hora' },

    { chave: 'auditor', rotulo: 'Auditor', tipo: 'pessoa', obrigatorio: true },
    { chave: 'auditados', rotulo: 'Auditados', tipo: 'texto_longo', obrigatorio: true,
      ajuda: 'Quem responde por cada processo auditado.' },
    { chave: 'independencia', rotulo: 'O auditor audita a própria área?', tipo: 'sim_nao', obrigatorio: true,
      ajuda: 'A 9.2.2 manda assegurar objetividade e imparcialidade. "Sim" precisa de justificativa — e é o primeiro lugar onde o auditor externo olha.' },
    { chave: 'comoGarantida', rotulo: 'Como a imparcialidade foi assegurada', tipo: 'texto_longo', obrigatorio: true,
      dependeDe: { campo: 'independencia', valor: 'Sim' },
      ajuda: 'Empresa pequena costuma ter esse problema. A saída honesta é registrar o arranjo: auditor de outra área acompanha, ou a direção revisa o resultado.' },

    { chave: 'resultado', rotulo: 'Resultado', tipo: 'escolha', obrigatorio: true,
      opcoes: ['A realizar', 'Realizada', 'Cancelada'] },
    { chave: 'naoConformidades', rotulo: 'Não conformidades levantadas', tipo: 'texto', obrigatorio: true,
      dependeDe: { campo: 'resultado', valor: 'Realizada' },
      ajuda: 'Quantas, e os números dos RNC. Zero é uma resposta — e uma que o auditor externo costuma questionar.' },
    { chave: 'observacoesDoResultado', rotulo: 'Observações e oportunidades de melhoria', tipo: 'texto_longo',
      dependeDe: { campo: 'resultado', valor: 'Realizada' } },
    { chave: 'relatadoPara', rotulo: 'Relatado para', tipo: 'texto', obrigatorio: true,
      dependeDe: { campo: 'resultado', valor: 'Realizada' },
      ajuda: 'A 9.2.2 manda assegurar que os resultados sejam relatados à gerência pertinente.' },

    { chave: 'planejadoEm', rotulo: 'Planejado em', tipo: 'data', obrigatorio: true, preenchidoCom: 'hoje' },
    { chave: 'planejadoPor', rotulo: 'Planejado por', tipo: 'pessoa', obrigatorio: true, preenchidoCom: 'quem_registra' },
  ],
  anexos: {
    titulo: 'Relatório da auditoria e evidências',
    vazio: 'Sem anexo. O relatório assinado é a evidência de que o programa foi executado.',
  },
};

/** A percepção do cliente — 9.1.2. Note que a norma pede MONITORAR A PERCEPÇÃO, e não aplicar
 *  pesquisa: reunião, elogio, reclamação e pleito de garantia contam igual. Por isso a origem é
 *  um campo, e não uma suposição de que houve formulário respondido. */
export const PESQUISA_SATISFACAO: FormularioDef = {
  papel: 'pesquisa_satisfacao',
  setor: 'sgq',
  titulo: 'Satisfação do Cliente',
  clausula: '9.1.2',
  explicacao:
    'O que o cliente achou do serviço, e por qual caminho isso chegou. A norma pede monitorar a percepção — pesquisa é um caminho, reclamação e elogio são outros, e valem igual.',
  campos: [
    { chave: 'cliente', rotulo: 'Cliente', tipo: 'texto', obrigatorio: true },
    { chave: 'contato', rotulo: 'Quem respondeu', tipo: 'texto',
      ajuda: 'A pessoa do cliente. Serve para a próxima conversa não recomeçar do zero.' },
    { chave: 'os', rotulo: 'Ordem de serviço', tipo: 'texto',
      ajuda: 'O serviço a que a avaliação se refere, quando é de um serviço específico.' },
    { chave: 'periodo', rotulo: 'Período avaliado', tipo: 'texto',
      ajuda: 'Ex.: 1º semestre/2026. Para avaliação que não é de uma OS só.' },

    { chave: 'origem', rotulo: 'Como chegou', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Pesquisa enviada', 'Reunião com o cliente', 'Elogio espontâneo', 'Reclamação', 'Pleito de garantia', 'Retorno em visita', 'Outro'] },

    { chave: 'qualidade', rotulo: 'Qualidade do serviço', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Ótimo', 'Bom', 'Regular', 'Ruim'] },
    { chave: 'prazo', rotulo: 'Cumprimento do prazo', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Ótimo', 'Bom', 'Regular', 'Ruim'] },
    { chave: 'atendimento', rotulo: 'Atendimento', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Ótimo', 'Bom', 'Regular', 'Ruim'] },
    { chave: 'voltariaAContratar', rotulo: 'Voltaria a contratar?', tipo: 'sim_nao', obrigatorio: true },

    { chave: 'relato', rotulo: 'O que o cliente disse', tipo: 'texto_longo', obrigatorio: true,
      ajuda: 'Nas palavras dele, tanto quanto possível. É o que tem valor na análise crítica — nota sem frase não explica nada.' },
    { chave: 'geraAcao', rotulo: 'Gera ação?', tipo: 'sim_nao', obrigatorio: true,
      ajuda: 'Avaliação ruim que não gera ação é achado: a empresa mediu a insatisfação e não fez nada.' },
    { chave: 'qualAcao', rotulo: 'Qual ação', tipo: 'texto_longo', obrigatorio: true,
      dependeDe: { campo: 'geraAcao', valor: 'Sim' } },
    { chave: 'abriuNc', rotulo: 'Abriu RNC?', tipo: 'texto',
      dependeDe: { campo: 'geraAcao', valor: 'Sim' },
      ajuda: 'O número do RNC, quando a insatisfação virou não conformidade formal.' },

    { chave: 'registradoEm', rotulo: 'Registrado em', tipo: 'data', obrigatorio: true, preenchidoCom: 'hoje' },
    { chave: 'registradoPor', rotulo: 'Registrado por', tipo: 'pessoa', obrigatorio: true, preenchidoCom: 'quem_registra' },
  ],
  anexos: {
    titulo: 'Pesquisa respondida, e-mail ou ata',
    vazio: 'Sem anexo. O e-mail do cliente ou a pesquisa respondida é a evidência de que a percepção veio dele, e não de dentro da casa.',
  },
};
