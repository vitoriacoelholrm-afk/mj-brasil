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
  /** Só aparece quando outro campo tem certo valor. */
  dependeDe?: { campo: string; valor: string };
}

export interface FormularioDef {
  papel: PapelDeFormulario;
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

export const FORMULARIOS: FormularioDef[] = [PROPRIEDADE_CLIENTE, MUDANCA_PRODUCAO];

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
  return valores[campo.dependeDe.campo] === campo.dependeDe.valor;
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
