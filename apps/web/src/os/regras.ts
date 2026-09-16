// surface-treatment — as regras do Plano de Serviço. Puras, sem banco.
//
// A regra central é `avaliarMedicao`: dado o especificado e o encontrado, ela diz se está
// conforme. É o que teria pego a divergência de rugosidade entre o Plano de Serviço da OS 748
// (70 µm) e o RIP CAR-01-2026 (60 µm) — hoje os dois são digitados à mão, em arquivos separados.
import { GRANDEZA_POR_CHAVE, type Etapa, type Resultado } from './vocabulario';

/** Uma linha do formulário: o átomo que se repete no jateamento e em cada demão. */
export interface Medicao {
  grandeza: string;
  especificado: string | null;
  encontrado: string | null;
  dataInspecao: string | null;
  responsavelProcesso: string | null;
  responsavelInspecao: string | null;
  /** O instrumento usado. Sem ele, medição numérica não tem rastreabilidade (ISO 7.1.5). */
  instrumentoCodigo?: string | null;
}

export interface Problema { codigo: string; grandeza?: string; detalhe: string }

/* ── Leitura de especificação ────────────────────────────────────────────────────────────────
   "50-100" é faixa. "140" é mínimo. "SA 2½" é categórico. A planilha guarda tudo como texto,
   e é por isso que hoje ninguém consegue verificar nada automaticamente.                       */

export function lerFaixa(txt: string): { min: number; max: number } | null {
  const m = txt.replace(',', '.').match(/(-?\d+(?:\.\d+)?)\s*[-–a]\s*(-?\d+(?:\.\d+)?)/i);
  if (!m) return null;
  const a = Number(m[1]), b = Number(m[2]);
  return Number.isFinite(a) && Number.isFinite(b) ? { min: Math.min(a, b), max: Math.max(a, b) } : null;
}

/** ESTRITO de propósito: o texto inteiro tem que ser um número, com unidade opcional no fim.
 *  "70" e "70 µm" passam; "07/04/2026" NÃO — senão a data vira 7 e o erro do RIP Metta (campo de
 *  rugosidade preenchido com data) sairia como "7 µm fora da faixa", escondendo a causa real. */
export function lerNumero(txt: string): number | null {
  const t = txt.trim().replace(',', '.');
  if (!/^-?\d+(?:\.\d+)?\s*[a-zA-Zµ%°]*$/.test(t)) return null;
  const n = Number(t.match(/-?\d+(?:\.\d+)?/)![0]);
  return Number.isFinite(n) ? n : null;
}

/** Normaliza para comparar categórico: "SA 2 1/2", "Sa 2.1/2\"", "SA2½" caem no mesmo texto. */
export function normalizar(txt: string): string {
  return txt
    .toLowerCase()
    .replace(/½/g, '1/2').replace(/¼/g, '1/4').replace(/¾/g, '3/4')
    .replace(/[."']/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/* ── A avaliação ─────────────────────────────────────────────────────────────────────────── */

export function avaliarMedicao(m: Medicao): { resultado: Resultado; motivo?: string } {
  const g = GRANDEZA_POR_CHAVE.get(m.grandeza);
  if (!g) return { resultado: 'pendente', motivo: 'grandeza desconhecida' };
  if (!m.especificado?.trim() || !m.encontrado?.trim()) return { resultado: 'pendente' };

  const esp = m.especificado.trim();
  const enc = m.encontrado.trim();

  if (g.tipo === 'categorico') {
    return normalizar(esp) === normalizar(enc)
      ? { resultado: 'conforme' }
      : { resultado: 'nao_conforme', motivo: `especificado ${esp}, encontrado ${enc}` };
  }

  const n = lerNumero(enc);
  if (n === null) {
    // O campo de rugosidade do RIP Metta foi preenchido com uma data. É este o caso.
    return { resultado: 'nao_conforme', motivo: `"${enc}" não é um número` };
  }

  if (g.tipo === 'faixa') {
    const f = lerFaixa(esp);
    if (!f) return { resultado: 'pendente', motivo: `especificação "${esp}" não é uma faixa` };
    return n >= f.min && n <= f.max
      ? { resultado: 'conforme' }
      : { resultado: 'nao_conforme', motivo: `${n}${g.unidade ?? ''} fora da faixa ${f.min}–${f.max}${g.unidade ?? ''}` };
  }

  // minimo: o encontrado tem que alcançar ou passar o especificado
  const min = lerNumero(esp);
  if (min === null) return { resultado: 'pendente', motivo: `especificação "${esp}" não é um número` };
  return n >= min
    ? { resultado: 'conforme' }
    : { resultado: 'nao_conforme', motivo: `${n}${g.unidade ?? ''} abaixo do mínimo ${min}${g.unidade ?? ''}` };
}

/* ── Guardas de registro (o que a ISO exige em toda evidência) ──────────────────────────────  */

export function validarMedicao(m: Medicao): Problema[] {
  const p: Problema[] = [];
  const g = GRANDEZA_POR_CHAVE.get(m.grandeza);
  if (!m.encontrado?.trim()) return p; // ainda não medido, nada a cobrar

  if (!m.dataInspecao) p.push({ codigo: 'DATA_OBRIGATORIA', grandeza: m.grandeza, detalhe: 'Toda medição precisa da data da inspeção.' });
  if (!m.responsavelProcesso) p.push({ codigo: 'RESPONSAVEL_PROCESSO', grandeza: m.grandeza, detalhe: 'Quem executou o processo.' });
  if (!m.responsavelInspecao) p.push({ codigo: 'RESPONSAVEL_INSPECAO', grandeza: m.grandeza, detalhe: 'Quem inspecionou.' });
  if (g && g.tipo !== 'categorico' && !m.instrumentoCodigo) {
    p.push({ codigo: 'INSTRUMENTO_OBRIGATORIO', grandeza: m.grandeza, detalhe: 'Medição numérica sem instrumento não é rastreável (ISO 9001 §7.1.5).' });
  }
  return p;
}

/* ── Resumo da OS ────────────────────────────────────────────────────────────────────────── */

export interface EtapaPreenchida {
  etapa: Etapa;
  ativa: boolean; // o esquema do cliente pode não ter intermediário II nem acabamento
  medicoes: Medicao[];
}

export interface ResumoOs {
  medidas: number;
  conformes: number;
  naoConformes: number;
  pendentes: number;
  problemas: Problema[];
  divergencias: { grandeza: string; etapa: Etapa; motivo: string }[];
  liberavel: boolean;
}

export function resumirOs(etapas: readonly EtapaPreenchida[]): ResumoOs {
  let medidas = 0, conformes = 0, naoConformes = 0, pendentes = 0;
  const problemas: Problema[] = [];
  const divergencias: ResumoOs['divergencias'] = [];

  for (const e of etapas) {
    if (!e.ativa) continue;
    for (const m of e.medicoes) {
      const r = avaliarMedicao(m);
      if (r.resultado === 'conforme') { medidas++; conformes++; }
      else if (r.resultado === 'nao_conforme') {
        medidas++; naoConformes++;
        divergencias.push({ grandeza: m.grandeza, etapa: e.etapa, motivo: r.motivo ?? '' });
      } else pendentes++;
      problemas.push(...validarMedicao(m));
    }
  }

  return {
    medidas, conformes, naoConformes, pendentes, problemas, divergencias,
    // Liberar exige tudo medido, tudo conforme e nenhuma evidência faltando.
    liberavel: pendentes === 0 && naoConformes === 0 && problemas.length === 0 && medidas > 0,
  };
}
