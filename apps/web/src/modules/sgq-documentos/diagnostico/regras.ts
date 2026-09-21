// As regras da cadeia, puras: sem banco, sem rede, sem data do sistema escondida. É aqui que o
// modelo se prova — se uma regra não couber numa função assim, ela está mal modelada.
import {
  type Avaliacao, type GapStatus, type Lado, type Peso, type Severidade, type TarefaStatus,
} from './vocabulario';

/* ── 1. Aderência ────────────────────────────────────────────────────────────────────────────
   O número que o cliente vê na capa do diagnóstico. Cláusula não aplicável sai do denominador —
   incluí-la puniria a empresa por algo que ela declarou não fazer (e a ISO 4.3 permite excluir).
   `atende_parcial` vale meio ponto; item ainda não avaliado não conta em lado nenhum.           */

export interface ItemAvaliado {
  clausulaRef: string;
  avaliacao: Avaliacao | null;
  peso?: Peso;
  justificativaNa?: string | null;
}

export interface Aderencia {
  aplicaveis: number;
  avaliados: number;
  naoAplicaveis: number;
  pendentes: number;
  pontos: number;
  percentual: number | null; // null enquanto nada aplicável foi avaliado
  completo: boolean;         // todo item aplicável tem avaliação
}

const VALOR: Record<Avaliacao, number> = {
  atende: 1,
  atende_parcial: 0.5,
  nao_atende: 0,
  nao_aplicavel: 0,
};

export function aderencia(itens: readonly ItemAvaliado[]): Aderencia {
  let aplicaveis = 0, avaliados = 0, naoAplicaveis = 0, pendentes = 0, pontos = 0;

  for (const i of itens) {
    if (i.avaliacao === null || i.avaliacao === undefined) { pendentes++; aplicaveis++; continue; }
    if (i.avaliacao === 'nao_aplicavel') { naoAplicaveis++; continue; }
    aplicaveis++; avaliados++; pontos += VALOR[i.avaliacao];
  }

  const base = avaliados;
  return {
    aplicaveis, avaliados, naoAplicaveis, pendentes, pontos,
    percentual: base === 0 ? null : Math.round((pontos / base) * 1000) / 10,
    completo: pendentes === 0,
  };
}

/* ── 2. Geração de gaps ──────────────────────────────────────────────────────────────────────
   O diagnóstico não "vira" gaps: cada item reprovado ou parcial gera exatamente um. Atende e
   não aplicável não geram nada. A severidade é DERIVADA — ninguém digita na criação, senão o
   número de aderência e a fila de trabalho contam histórias diferentes.                         */

export function severidadeDe(avaliacao: Avaliacao, peso: Peso = 'normal'): Severidade | null {
  if (avaliacao === 'atende' || avaliacao === 'nao_aplicavel') return null;
  if (avaliacao === 'nao_atende') return peso === 'alto' ? 'critica' : 'alta';
  return peso === 'alto' ? 'alta' : 'media'; // atende_parcial
}

export interface GapGerado {
  clausulaRef: string;
  titulo: string;
  severidade: Severidade;
  origem: Avaliacao;
}

export interface ItemParaGap extends ItemAvaliado {
  clausulaTitulo: string;
}

export function gerarGaps(itens: readonly ItemParaGap[]): GapGerado[] {
  const saida: GapGerado[] = [];
  for (const i of itens) {
    if (!i.avaliacao) continue;
    const sev = severidadeDe(i.avaliacao, i.peso ?? 'normal');
    if (!sev) continue;
    saida.push({
      clausulaRef: i.clausulaRef,
      titulo: `${i.clausulaRef} — ${i.clausulaTitulo}`,
      severidade: sev,
      origem: i.avaliacao,
    });
  }
  // Crítica primeiro: a fila já sai priorizada, sem ninguém ordenar depois.
  const ordem: Record<Severidade, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };
  return saida.sort((a, b) => ordem[a.severidade] - ordem[b.severidade] || a.clausulaRef.localeCompare(b.clausulaRef, 'pt-BR', { numeric: true }));
}

/* ── 3. Guardas de preenchimento ─────────────────────────────────────────────────────────────  */

export type Problema = { codigo: string; clausulaRef?: string; detalhe: string };

/** Não aplicável sem justificativa é a exclusão não justificada que reprova em auditoria. */
export function validarItens(itens: readonly ItemAvaliado[]): Problema[] {
  const problemas: Problema[] = [];
  for (const i of itens) {
    if (i.avaliacao === 'nao_aplicavel' && !i.justificativaNa?.trim()) {
      problemas.push({
        codigo: 'JUSTIFICATIVA_NA_OBRIGATORIA',
        clausulaRef: i.clausulaRef,
        detalhe: 'Cláusula marcada como não aplicável precisa de justificativa (ISO 9001 §4.3).',
      });
    }
  }
  return problemas;
}

/** Concluir um diagnóstico exige todo item aplicável avaliado e nenhuma pendência de validação. */
export function podeConcluirDiagnostico(itens: readonly ItemAvaliado[]): { pode: boolean; problemas: Problema[] } {
  const problemas = validarItens(itens);
  const a = aderencia(itens);
  if (!a.completo) {
    problemas.push({
      codigo: 'ITENS_PENDENTES',
      detalhe: `${a.pendentes} ${a.pendentes === 1 ? 'cláusula ainda não foi avaliada' : 'cláusulas ainda não foram avaliadas'}.`,
    });
  }
  if (itens.length === 0) {
    problemas.push({ codigo: 'DIAGNOSTICO_VAZIO', detalhe: 'Nenhuma cláusula no diagnóstico.' });
  }
  return { pode: problemas.length === 0, problemas };
}

/* ── 4. Fechamento de gap ────────────────────────────────────────────────────────────────────
   Um gap raramente se resolve com uma tarefa. Ele fecha quando TODAS as tarefas dele terminam
   E existe evidência — senão a gente fecha tarefa sem fechar buraco, que é o modo clássico de
   chegar na auditoria achando que está pronto.                                                  */

export interface TarefaDoGap {
  id: string;
  status: TarefaStatus;
  produz?: string;
  produzDocumentoId?: string | null;
}

export function podeFecharGap(
  tarefas: readonly TarefaDoGap[],
  evidencia: string | null | undefined,
): { pode: boolean; problemas: Problema[] } {
  const problemas: Problema[] = [];
  const vivas = tarefas.filter((t) => t.status !== 'cancelada');
  const abertas = vivas.filter((t) => t.status !== 'concluida');

  if (vivas.length === 0) {
    problemas.push({ codigo: 'SEM_TAREFAS', detalhe: 'Gap sem nenhuma tarefa — nada foi feito para fechá-lo.' });
  }
  if (abertas.length > 0) {
    problemas.push({
      codigo: 'TAREFAS_ABERTAS',
      detalhe: `${abertas.length} ${abertas.length === 1 ? 'tarefa ainda aberta' : 'tarefas ainda abertas'}.`,
    });
  }
  if (!evidencia?.trim()) {
    problemas.push({ codigo: 'EVIDENCIA_OBRIGATORIA', detalhe: 'Fechar um gap exige evidência do que foi feito.' });
  }
  // Tarefa que prometeu documento e não entregou deixa a cadeia no ar.
  for (const t of vivas) {
    if (t.produz === 'documento' && t.status === 'concluida' && !t.produzDocumentoId) {
      problemas.push({
        codigo: 'DOCUMENTO_NAO_VINCULADO',
        detalhe: `Tarefa ${t.id} foi concluída como produtora de documento, mas nenhum documento foi vinculado.`,
      });
    }
  }
  return { pode: problemas.length === 0, problemas };
}

/* ── 5. Máquinas de estado ───────────────────────────────────────────────────────────────────  */

export const GAP_TRANSICOES: Record<GapStatus, readonly GapStatus[]> = {
  aberto: ['em_tratamento', 'aceito_como_risco', 'cancelado'],
  em_tratamento: ['pronto_para_verificacao', 'aberto', 'cancelado'],
  pronto_para_verificacao: ['fechado', 'em_tratamento'], // reprovou na verificação: volta
  fechado: [],
  aceito_como_risco: ['aberto'], // o risco pode ser retomado
  cancelado: [],
};

export function transicaoGapValida(de: GapStatus, para: GapStatus): boolean {
  return (GAP_TRANSICOES[de] ?? []).includes(para);
}

export const TAREFA_TRANSICOES: Record<TarefaStatus, readonly TarefaStatus[]> = {
  pendente: ['em_andamento', 'cancelada'],
  em_andamento: ['concluida', 'pendente', 'cancelada'],
  concluida: ['em_andamento'], // reabrir é legítimo; a verificação do gap pode devolver
  cancelada: [],
};

export function transicaoTarefaValida(de: TarefaStatus, para: TarefaStatus): boolean {
  return (TAREFA_TRANSICOES[de] ?? []).includes(para);
}

/* ── 6. Cobertura da cadeia ──────────────────────────────────────────────────────────────────
   A pergunta que vende e que defende em auditoria: cada cláusula reprovada virou documento?
   Percorre diagnóstico → gap → tarefa → documento e devolve onde a corrente arrebenta.          */

export interface EloCadeia {
  clausulaRef: string;
  severidade: Severidade;
  gapStatus: GapStatus;
  tarefas: readonly TarefaDoGap[];
}

export interface Cobertura {
  total: number;
  fechados: number;
  semTarefa: number;
  semDocumento: number;
  percentual: number;
  rompimentos: Problema[];
}

export function coberturaDaCadeia(elos: readonly EloCadeia[]): Cobertura {
  let fechados = 0, semTarefa = 0, semDocumento = 0;
  const rompimentos: Problema[] = [];

  for (const e of elos) {
    if (e.gapStatus === 'fechado') fechados++;
    if (e.gapStatus === 'cancelado' || e.gapStatus === 'aceito_como_risco') continue;

    const vivas = e.tarefas.filter((t) => t.status !== 'cancelada');
    if (vivas.length === 0) {
      semTarefa++;
      rompimentos.push({ codigo: 'GAP_SEM_TAREFA', clausulaRef: e.clausulaRef, detalhe: 'Gap sem tarefa — ninguém está tratando.' });
      continue;
    }
    const prometemDoc = vivas.filter((t) => t.produz === 'documento');
    if (prometemDoc.length > 0 && prometemDoc.every((t) => !t.produzDocumentoId)) {
      semDocumento++;
      rompimentos.push({ codigo: 'GAP_SEM_DOCUMENTO', clausulaRef: e.clausulaRef, detalhe: 'Nenhuma tarefa produtora de documento vinculou um documento.' });
    }
  }

  const total = elos.length;
  return {
    total, fechados, semTarefa, semDocumento,
    percentual: total === 0 ? 0 : Math.round((fechados / total) * 1000) / 10,
    rompimentos,
  };
}
