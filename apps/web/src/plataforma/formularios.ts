// DEFINIÇÃO DE FORMULÁRIO — os campos que a norma exige, declarados como dado.
//
// Os dois formulários que nascem aqui não são de empresa nenhuma: a 8.5.3 e a 8.5.6 pedem os
// mesmos campos de qualquer empresa certificada. Por isso vivem na plataforma, e qualquer
// cliente novo já os recebe prontos.
//
// A escolha de declarar os campos em vez de escrever duas telas: a partir daqui, digitalizar um
// formulário é acrescentar uma definição, não escrever uma tela. Era o que ela pediu lá atrás —
// "precisamos ter todos esses formulários dentro do aplicativo".
import type { PapelDeFormulario } from './empresa';
import type { Setor } from './acesso';

export type TipoCampo = 'texto' | 'texto_longo' | 'data' | 'escolha' | 'pessoa' | 'sim_nao';

export interface CampoDef {
  chave: string;
  rotulo: string;
  tipo: TipoCampo;
  opcoes?: string[];
  /** Sem ele o registro não fecha. A norma manda, não é preferência de tela. */
  obrigatorio?: boolean;
  /** Uma frase curta de ajuda, para quem preenche não ter de adivinhar. */
  ajuda?: string;
  /** Só aparece quando outro campo tem certo valor — ou um de vários.
   *
   *  A lista existe porque a mesma pergunta costuma valer para opções diferentes: peça do
   *  cliente e insumo do cliente são coisas distintas na carga e a mesma coisa na norma. */
  dependeDe?: { campo: string; valor: string | string[] };
}

export interface FormularioDef {
  papel: PapelDeFormulario;
  /** A que setor este registro pertence. É o que decide quem preenche: a ficha de
   *  treinamento é do RH, a ocorrência com peça de cliente é de quem toca a ordem. */
  setor: Setor;
  titulo: string;
  clausula: string;
  /** Por que este formulário existe, em uma frase. Vai no topo da tela. */
  explicacao: string;
  campos: CampoDef[];
}

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
/* ══ Portaria — entrada e saída de cargas ════════════════════════════════════════════════════
   A norma não exige um livro de portaria. Exige duas coisas que passam por ele:

     · 8.5.3 — peça de cliente que chega avariada tem de ser relatada e registrada;
     · 8.5.4 — o que sai tem de sair preservado, e dá para provar quando saiu e com quem.

   Por isso este registro NÃO substitui o controle de recebimento nem o romaneio: aqueles
   inspecionam a carga, este registra o veículo passando pelo portão. São fatos diferentes, e
   juntá-los faria a portaria assinar uma inspeção que ela não fez.

   O campo de estado aparente existe pelo mesmo motivo: a portaria não inspeciona, mas é a
   primeira pessoa a ver a peça. Avaria vista no portão e não registrada vira discussão sobre
   quem amassou.                                                                                */

export const CONTROLE_CARGAS: FormularioDef = {
  papel: 'controle_cargas',
  setor: 'portaria',
  titulo: 'Entrada e Saída de Cargas',
  clausula: '8.5.3 e 8.5.4',
  explicacao:
    'O que passou pelo portão: em que sentido, quando, em que veículo e com quem. É o registro da portaria, não a inspeção da carga — quem confere o que chegou é o recebimento.',
  campos: [
    {
      chave: 'sentido', rotulo: 'Sentido', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Entrada', 'Saída'],
    },
    { chave: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true },
    { chave: 'hora', rotulo: 'Hora', tipo: 'texto', obrigatorio: true, ajuda: 'No formato hh:mm. É o que permite comparar com o horário da nota.' },
    {
      chave: 'tipo', rotulo: 'O que é a carga', tipo: 'escolha', obrigatorio: true,
      opcoes: [
        // As três do cliente vêm juntas e primeiro: é o caso que a norma cobra, e o caminhão
        // costuma trazer peça e tinta do cliente na mesma viagem.
        'Peça de cliente', 'Matéria-prima ou insumo do cliente', 'Peças e insumos do cliente',
        'Matéria-prima ou insumo da empresa', 'Produto acabado', 'Resíduo', 'Equipamento', 'Outro',
      ],
      ajuda: 'De quem é a carga importa tanto quanto o que ela é: o que pertence ao cliente entra na 8.5.3, venha como peça ou como lata de tinta.',
    },
    { chave: 'parte', rotulo: 'Cliente, fornecedor ou destinatário', tipo: 'texto', obrigatorio: true },
    { chave: 'documento', rotulo: 'Documento', tipo: 'texto', ajuda: 'Nota fiscal, romaneio ou ordem de coleta que acompanha a carga.' },
    { chave: 'os', rotulo: 'Ordem de serviço', tipo: 'texto', ajuda: 'Quando a carga é peça de cliente, é o que liga o portão ao serviço.' },
    { chave: 'volumes', rotulo: 'Volumes', tipo: 'texto', ajuda: 'Quantidade e tipo: 12 tubos, 3 paletes, 1 caçamba.' },

    { chave: 'transportadora', rotulo: 'Transportadora', tipo: 'texto' },
    { chave: 'placa', rotulo: 'Placa do veículo', tipo: 'texto', obrigatorio: true },
    { chave: 'motorista', rotulo: 'Motorista', tipo: 'texto', obrigatorio: true },

    {
      chave: 'estado', rotulo: 'Estado aparente', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Íntegra', 'Avaria aparente'],
      dependeDe: { campo: 'tipo', valor: [
        'Peça de cliente', 'Matéria-prima ou insumo do cliente', 'Peças e insumos do cliente',
      ] },
      ajuda: 'Vale para tudo que é do cliente, peça ou insumo. A portaria não inspeciona, mas é quem vê primeiro — avaria aparente aqui abre uma ocorrência de propriedade do cliente (§8.5.3).',
    },
    { chave: 'descricaoAvaria', rotulo: 'O que se viu', tipo: 'texto_longo', obrigatorio: true, dependeDe: { campo: 'estado', valor: 'Avaria aparente' }, ajuda: 'Onde e como. Sem isto, daqui a uma semana ninguém sabe se a avaria veio de fora ou aconteceu dentro.' },
    { chave: 'avisou', rotulo: 'Avisou quem', tipo: 'texto', obrigatorio: true, dependeDe: { campo: 'estado', valor: 'Avaria aparente' }, ajuda: 'A quem da empresa a portaria comunicou na hora.' },

    { chave: 'registradoPor', rotulo: 'Registrado por', tipo: 'pessoa', obrigatorio: true },
    { chave: 'observacoes', rotulo: 'Observações', tipo: 'texto_longo' },
  ],
};

export const FORMULARIOS: FormularioDef[] =
  [PROPRIEDADE_CLIENTE, MUDANCA_PRODUCAO, NAO_CONFORMIDADE, MONITORAMENTO_SGQ,
    REGISTRO_TREINAMENTO, CONTROLE_CARGAS];

export function formularioDoPapel(papel: PapelDeFormulario): FormularioDef | null {
  return FORMULARIOS.find((f) => f.papel === papel) ?? null;
}

/* ── O registro preenchido ─────────────────────────────────────────────────────────────────── */

export type Valores = Record<string, string>;

export interface Registro {
  id: string;
  papel: PapelDeFormulario;
  valores: Valores;
  criadoEm: string;
  criadoPor: string | null;
}

/** Um campo só conta quando a condição dele está satisfeita. */
export function campoVisivel(campo: CampoDef, valores: Valores): boolean {
  if (!campo.dependeDe) return true;
  const { campo: pai, valor } = campo.dependeDe;
  const aceitos = Array.isArray(valor) ? valor : [valor];
  return aceitos.includes(valores[pai]);
}

/** Quais obrigatórios ainda estão vazios. Vazio = o registro pode fechar. */
export function pendencias(def: FormularioDef, valores: Valores): CampoDef[] {
  return def.campos.filter(
    (c) => c.obrigatorio && campoVisivel(c, valores) && !valores[c.chave]?.trim(),
  );
}

/** Uma linha curta para a lista, montada dos primeiros campos preenchidos. */
export function resumoDoRegistro(def: FormularioDef, valores: Valores): string {
  return def.campos
    .filter((c) => c.tipo !== 'texto_longo' && valores[c.chave]?.trim())
    .slice(0, 3)
    .map((c) => valores[c.chave])
    .join(' · ');
}
