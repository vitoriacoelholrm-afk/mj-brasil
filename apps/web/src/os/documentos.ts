// Os dois documentos do processo, e o confronto entre eles.
//
//   ORDEM DE SERVIÇO  — o que o cliente pediu no orçamento e o que o serviço contratado
//                       especifica. É interna, manuscrita, assinada linha a linha.
//   RELATÓRIO (RIP)   — a prova de que o trabalho foi feito, entregue ao cliente. É digitado,
//                       traz condições ambientais, lotes, instrumentos, normas e um veredito.
//
// Hoje os dois carregam os mesmos números, digitados em momentos diferentes por pessoas
// diferentes. É daí que nasce a divergência. `compararComRelatorio` faz de máquina a conferência
// que hoje depende de alguém pôr um papel ao lado do outro.
import { lerNumero, normalizar, type EtapaPreenchida } from './regras';
import { ETAPA_ROTULO } from './vocabulario';

/* ── Ordem de Serviço ─────────────────────────────────────────────────────────────────────── */

export interface Tinta {
  especificada: string;
  /** Em branco em boa parte das OS — no papel, essas linhas ficam vazias. */
  fabricante: string | null;
  cor: string | null;
  metodoAplicacao: string | null;
  loteA: string | null; validadeA: string | null;
  loteB: string | null; validadeB: string | null;
}

export interface ItemOs { descricao: string; quantidade: number; unidade: string }

export interface OrdemServico {
  id: string;
  folio: string;
  cliente: string;
  obra: string | null;
  equipamento: string;
  pintura: 'externa' | 'interna' | 'ambas';
  esquemaPintura: string;
  ripNumero: string | null;
  ripFolha: string | null;
  emitidoPor: string;
  verificadoPor: string;
  /** O que o documento de origem não permite afirmar. */
  observacoes: string[];
  itens: ItemOs[];
  tintas: Partial<Record<string, Tinta>>;
  etapas: EtapaPreenchida[];
  /** O relatório emitido para o cliente, quando já foi transcrito. */
  relatorio?: Relatorio;
}

/* ── Relatório de Inspeção de Jateamento e Pintura ────────────────────────────────────────── */

/** Uma demão como o RELATÓRIO a enxerga: numerada (1ª, 2ª, 3ª, 4ª), não posicionada por função.
 *  A OS enxerga a mesma demão por posição no esquema (fundo, intermediário, acabamento). */
export interface DemaoRelatorio {
  ordem: number;
  /** Data da aplicação — corresponde à data da camada úmida na OS. */
  data: string | null;
  tempAmbiente: number | null;
  umidadeRelativa: number | null;
  tempSubstrato: number | null;
  tinta: string | null;
  cor: string | null;
  fabricante: string | null;
  metodoAplicacao: string | null;
  loteA: string | null; validadeA: string | null;
  loteB: string | null; validadeB: string | null;
  espessuraEspecificada: string | null;
  espessuraEncontrada: string | null;
  /** Data da inspeção — corresponde à data da camada seca na OS. */
  dataInspecao: string | null;
  aderencia: string | null;
}

export interface Relatorio {
  numero: string;
  folha: string;
  dataEmissao: string;
  esquema: string;
  obra: string;
  equipamento: string;
  /** A OS que o próprio relatório declara cobrir. */
  osReferida: string;
  padraoJateamento: string | null;
  grauIntemperismo: string | null;
  abrasivo: string | null;
  abrasivoCertificado: string | null;
  dataJateamento: string | null;
  rugosidade: string | null;
  demaos: DemaoRelatorio[];
  instrumentos: string[];
  normas: string[];
  ressalvas: string[];
  resultado: 'aprovado' | 'reprovado';
  emitidoPor: string;
  verificadoPor: string;
}

/* ── O confronto ──────────────────────────────────────────────────────────────────────────── */

export interface Divergencia {
  onde: string;
  naOs: string | null;
  noRelatorio: string | null;
  gravidade: 'alta' | 'media';
  /** Quando a diferença pode vir da leitura do manuscrito, e não do processo. */
  nota?: string;
}

const ETAPAS_DE_TINTA = ['fundo', 'intermediario_i', 'intermediario_ii', 'acabamento'] as const;
const ORDINAL = ['1ª', '2ª', '3ª', '4ª'];

function difereTexto(a: string | null, b: string | null): boolean {
  if (!a?.trim() || !b?.trim()) return false; // falta de dado não é divergência
  return normalizar(a) !== normalizar(b);
}

function difereNumero(a: string | null, b: string | null): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  const x = lerNumero(a), y = lerNumero(b);
  return x !== null && y !== null ? x !== y : normalizar(a) !== normalizar(b);
}

function valorDe(
  e: EtapaPreenchida | undefined,
  grandeza: string,
  campo: 'especificado' | 'encontrado' | 'dataInspecao',
): string | null {
  return e?.medicoes.find((m) => m.grandeza === grandeza)?.[campo] ?? null;
}

function semPrefixo(etapa: EtapaPreenchida): string {
  return ETAPA_ROTULO[etapa.etapa].replace('Aplicação de tinta — ', '');
}

/** Confronta a OS com o relatório que saiu dela. Só aponta o que os DOIS documentos afirmam —
 *  campo vazio de um lado é falta de registro, não desacordo. */
export function compararComRelatorio(os: OrdemServico): Divergencia[] {
  const rel = os.relatorio;
  if (!rel) return [];
  const d: Divergencia[] = [];

  // O relatório declara a sua própria OS. Se não bate com o folio, um dos dois está errado.
  if (!rel.osReferida.startsWith(os.folio)) {
    d.push({ onde: 'Número da OS', naOs: os.folio, noRelatorio: rel.osReferida, gravidade: 'alta' });
  }

  const jat = os.etapas.find((e) => e.etapa === 'jateamento');

  if (difereTexto(valorDe(jat, 'padrao_jateamento', 'encontrado'), rel.padraoJateamento)) {
    d.push({
      onde: 'Jateamento · padrão',
      naOs: valorDe(jat, 'padrao_jateamento', 'encontrado'), noRelatorio: rel.padraoJateamento,
      gravidade: 'media',
    });
  }
  if (difereTexto(valorDe(jat, 'grau_intemperismo', 'encontrado'), rel.grauIntemperismo)) {
    d.push({
      onde: 'Jateamento · grau de intemperismo',
      naOs: valorDe(jat, 'grau_intemperismo', 'encontrado'), noRelatorio: rel.grauIntemperismo,
      gravidade: 'media', nota: 'A OS traz abreviação manuscrita; pode ser leitura da caligrafia.',
    });
  }
  if (difereNumero(valorDe(jat, 'padrao_rugosidade', 'encontrado'), rel.rugosidade)) {
    d.push({
      onde: 'Jateamento · rugosidade medida',
      naOs: valorDe(jat, 'padrao_rugosidade', 'encontrado'), noRelatorio: rel.rugosidade,
      gravidade: 'alta',
    });
  }
  if (difereTexto(valorDe(jat, 'padrao_rugosidade', 'dataInspecao'), rel.dataJateamento)) {
    d.push({
      onde: 'Jateamento · data',
      naOs: valorDe(jat, 'padrao_rugosidade', 'dataInspecao'), noRelatorio: rel.dataJateamento,
      gravidade: 'media',
    });
  }

  // Demãos: a N-ésima etapa de tinta ATIVA da OS é a N-ésima demão do relatório.
  const ativas = ETAPAS_DE_TINTA
    .map((nome) => os.etapas.find((e) => e.etapa === nome && e.ativa))
    .filter((e): e is EtapaPreenchida => Boolean(e));

  if (ativas.length !== rel.demaos.length) {
    d.push({
      onde: 'Quantidade de demãos',
      naOs: `${ativas.length} — ${ativas.map(semPrefixo).join(', ')}`,
      noRelatorio: `${rel.demaos.length}`,
      gravidade: 'alta',
    });
  }

  for (let i = 0; i < Math.min(ativas.length, rel.demaos.length); i++) {
    const e = ativas[i];
    const r = rel.demaos[i];
    const onde = (campo: string) => `${ORDINAL[i]} demão (${semPrefixo(e)}) · ${campo}`;

    if (difereNumero(valorDe(e, 'camada_seca', 'especificado'), r.espessuraEspecificada)) {
      d.push({ onde: onde('espessura especificada'), naOs: valorDe(e, 'camada_seca', 'especificado'), noRelatorio: r.espessuraEspecificada, gravidade: 'alta' });
    }
    if (difereNumero(valorDe(e, 'camada_seca', 'encontrado'), r.espessuraEncontrada)) {
      d.push({ onde: onde('espessura medida'), naOs: valorDe(e, 'camada_seca', 'encontrado'), noRelatorio: r.espessuraEncontrada, gravidade: 'alta' });
    }
    if (difereTexto(valorDe(e, 'camada_umida', 'dataInspecao'), r.data)) {
      d.push({ onde: onde('data de aplicação'), naOs: valorDe(e, 'camada_umida', 'dataInspecao'), noRelatorio: r.data, gravidade: 'media' });
    }
    if (difereTexto(valorDe(e, 'camada_seca', 'dataInspecao'), r.dataInspecao)) {
      d.push({ onde: onde('data de inspeção'), naOs: valorDe(e, 'camada_seca', 'dataInspecao'), noRelatorio: r.dataInspecao, gravidade: 'media' });
    }

    // MJ-RAI-01 §8 manda registrar o lote na OP. Quando ele só existe no relatório, a
    // rastreabilidade do lote foi reconstruída depois — não capturada na aplicação.
    const naOs = os.tintas[e.etapa];
    if (r.loteA && !naOs?.loteA) {
      d.push({
        onde: onde('lote de fabricação'),
        naOs: null,
        noRelatorio: `A ${r.loteA}${r.loteB ? ` · B ${r.loteB}` : ''}`,
        gravidade: 'alta',
        nota: 'Lote registrado só no relatório do cliente. MJ-RAI-01 §8 pede o registro na OP.',
      });
    }
  }

  return d;
}
