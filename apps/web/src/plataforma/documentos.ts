// MOTOR de controle de documentos. Não sabe de nenhuma empresa.
//
// Aqui só existem as REGRAS: o que é um documento controlado, o que conta como conflito de
// identificação, como se acha o próximo código livre. Os documentos em si — os de cada empresa
// atendida — entram por parâmetro, nunca importados daqui.
//
// A prova de que isto é genérico está em `plataforma/empresa.test.ts`: duas empresas com
// codificações diferentes passam pelas mesmas funções e produzem conflitos diferentes, sem que
// uma linha deste arquivo mude.

/** `em_elaboracao` é o documento que ainda não existe e já tem código.
 *
 *  Reservar o código antes de escrever é para o que a lista mestra serve: sem isso, duas pessoas
 *  pegam o mesmo número na mesma semana. Mas catalogar como VIGENTE o que ainda não foi escrito
 *  seria pior que não catalogar — a lista passaria a afirmar que existe documento onde há
 *  intenção, e é a lista que o auditor lê. */
export type SituacaoDoc = 'vigente' | 'obsoleto' | 'em_revisao' | 'em_elaboracao';
export type Acesso = 'irrestrito' | 'restrito' | 'confidencial';
export type Natureza = 'manual' | 'procedimento' | 'instrucao' | 'formulario' | 'registro';

export const NATUREZA_ROTULO: Record<Natureza, string> = {
  manual: 'Manual',
  procedimento: 'Procedimento',
  instrucao: 'Instrução de trabalho',
  formulario: 'Formulário',
  registro: 'Registro',
};

/** Sem código de verdade: o lugar de código fica vazio, não com um rótulo inventado. */
export const SEM_CODIGO = 'SEM-CODIGO';

export interface DocumentoMestre {
  /** O código da lista mestra da empresa. É o oficial — o que o app carimba. */
  codigo: string;
  titulo: string;
  natureza: Natureza;
  categoria: string;
  revisao: string | null;
  emissao: string | null;
  proximaRevisao: string | null;
  situacao: SituacaoDoc;
  acesso: Acesso;
  responsavel: string | null;
  /** Cláusulas da norma que este documento atende. */
  clausulas: string[];
  local: string | null;
  /** Códigos que o arquivo real carrega, quando não são o da lista mestra. */
  codigosParalelos?: string[];
  /** Quando a planilha da lista mestra diz outra coisa que o arquivo. O que vale aqui é sempre o
   *  ARQUIVO — é ele que a pessoa abre. Isto guarda o que a planilha alega, para a correção ter
   *  para onde apontar. */
  divergenciaNaLista?: { revisao: string; emissao: string };
  /** A tela do app que emite ou consome este documento. */
  tela?: string;
  /** As chaves dos documentos padrão que este aqui cumpre. É a IDENTIDADE — o código é só o
   *  apelido local. São VÁRIAS porque um manual da qualidade sozinho costuma atender o escopo,
   *  a política e mais meia dúzia de cláusulas. */
  padroes?: string[];
  /** Requisitos da norma que a empresa declarou não aplicáveis, com a justificativa. A 4.3 exige
   *  que a exclusão esteja documentada — sem justificativa, é lacuna, não exclusão. */
  exclusoes?: { requisito: string; justificativa: string }[];
  /** Verdadeiro quando o documento circula sem entrada própria na lista mestra. */
  foraDaLista?: boolean;
  nota?: string;
}

/** O cabeçalho da lista mestra de uma empresa. */
export interface ListaMestraMeta {
  codigo: string;
  revisao: string;
  emissao: string;
  proximaRevisao: string;
  totalCatalogado: number;
  norma: string;
  aprovadoPor: string | null;
  elaboradoPor: string | null;
  /** Outros códigos pelos quais a própria lista responde. Vazio é o estado saudável. */
  codigosParalelos: string[];
  nota?: string;
}

/** A codificação de uma empresa: quais prefixos existem e o que cada um quer dizer.
 *  Cada empresa tem a sua — não há prefixo universal. */
export type Legenda = Record<string, string>;

/** Um rótulo da coluna "Responsável" que, na verdade, é de FORA da empresa.
 *
 *  Existe porque a coluna não distingue. Ao lado de "Ger. Qualidade", que é um posto da empresa,
 *  pode estar um rótulo que é a consultoria que implanta o sistema — e quem lê a lista não tem
 *  como saber qual é qual. O rótulo parece gente de dentro, e não é. */
export interface ResponsavelExterno {
  /** O rótulo exatamente como está na coluna Responsável — "RQ", "Consultoria". */
  rotulo: string;
  /** Quem é, em palavras. É isto que a lista não dizia em lugar nenhum. */
  quem: string;
  /** Por que ainda é assim, quando há motivo — implantação em curso, contrato vigente. */
  nota?: string;
}

/** Tudo que o motor precisa saber sobre a documentação de uma empresa. */
export interface Documentacao {
  meta: ListaMestraMeta;
  legenda: Legenda;
  documentos: DocumentoMestre[];
  /** Ausente ou vazio é o estado saudável: todo responsável é posto de dentro. */
  responsaveisExternos?: ResponsavelExterno[];
}

const br = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');
const codigoReal = (d: DocumentoMestre) => (d.codigo.startsWith(SEM_CODIGO) ? null : d.codigo);

/* ── Consulta ──────────────────────────────────────────────────────────────────────────────── */

export function indexar(docs: DocumentoMestre[]): Map<string, DocumentoMestre[]> {
  const mapa = new Map<string, DocumentoMestre[]>();
  for (const d of docs) mapa.set(d.codigo, [...(mapa.get(d.codigo) ?? []), d]);
  return mapa;
}

/** O documento sob este código. Estoura se não estiver catalogado — é o que impede uma tela de
 *  carimbar um código que a lista mestra da empresa não conhece. */
export function acharDoc(docs: DocumentoMestre[], codigo: string): DocumentoMestre {
  const achado = docs.find((d) => d.codigo === codigo);
  if (!achado) {
    throw new Error(`Código "${codigo}" não está na lista mestra desta empresa. Cadastre-o no perfil dela antes de usá-lo numa tela.`);
  }
  return achado;
}

/** O carimbo que vai no rodapé de um documento emitido pelo app. */
export function montarCarimbo(d: DocumentoMestre): string {
  return d.revisao ? `${d.codigo} rev. ${d.revisao}` : d.codigo;
}

/** O que o prefixo de um código significa na legenda da empresa. Null se ela não o conhece. */
export function significadoDoPrefixo(legenda: Legenda, codigo: string): string | null {
  return legenda[codigo.split('-')[0]] ?? null;
}

/** O próximo código livre de um prefixo — para cadastrar o que hoje circula sem entrada. */
export function proximoCodigoLivre(docs: DocumentoMestre[], prefixo: string): string {
  const usados = docs
    .map((d) => d.codigo)
    .filter((c) => c.startsWith(`${prefixo}-`))
    .map((c) => Number(c.slice(prefixo.length + 1)))
    .filter((n) => Number.isFinite(n));
  const proximo = usados.length ? Math.max(...usados) + 1 : 1;
  return `${prefixo}-${String(proximo).padStart(3, '0')}`;
}

export function porCategoria(docs: DocumentoMestre[]): { categoria: string; total: number }[] {
  const mapa = new Map<string, number>();
  for (const d of docs) mapa.set(d.categoria, (mapa.get(d.categoria) ?? 0) + 1);
  return [...mapa].map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total);
}

/** Os documentos que atendem uma cláusula da norma — é o que o auditor pergunta. */
export function porClausula(docs: DocumentoMestre[], clausula: string): DocumentoMestre[] {
  return docs.filter((d) => d.clausulas.some((c) => c === clausula || c.startsWith(`${clausula}.`)));
}

/* ── Conflitos ─────────────────────────────────────────────────────────────────────────────── */

export type TipoConflito =
  | 'codigo_duplicado' | 'fora_da_lista' | 'codigo_paralelo'
  | 'revisao_vencida' | 'revisao_divergente' | 'prefixo_desconhecido' | 'sem_aprovacao'
  | 'contagem_divergente' | 'responsavel_externo';

export interface Conflito {
  tipo: TipoConflito;
  /** O código sob conflito, ou null quando o documento não tem código nenhum. */
  codigo: string | null;
  titulo: string;
  detalhe: string;
  gravidade: 'alta' | 'media';
}

export const CONFLITO_ROTULO: Record<TipoConflito, string> = {
  codigo_duplicado: 'Dois documentos, o mesmo código',
  fora_da_lista: 'Circula sem entrada na lista mestra',
  codigo_paralelo: 'O arquivo real usa outro código',
  revisao_vencida: 'Revisão vencida',
  revisao_divergente: 'A revisão da lista não bate com a do arquivo',
  prefixo_desconhecido: 'Prefixo que a legenda não conhece',
  sem_aprovacao: 'Sem aprovação registrada',
  contagem_divergente: 'A planilha declara um total que não bate',
  responsavel_externo: 'O responsável não é de dentro da empresa',
};

/** O rótulo externo por trás de um nome de responsável, ou null quando é posto da própria empresa.
 *  A tela usa para marcar a célula: "RQ" sozinho não conta a quem pertence. */
export function responsavelExterno(
  docs: Documentacao, responsavel: string | null,
): ResponsavelExterno | null {
  if (!responsavel) return null;
  return docs.responsaveisExternos?.find((r) => r.rotulo === responsavel) ?? null;
}

/** Tudo que impede a lista mestra de ser a única fonte de identificação. Oito verificações, e
 *  nenhuma delas sabe de que empresa é — todas leem o que veio por parâmetro. */
export function acharConflitos(docs: Documentacao, hoje = new Date()): Conflito[] {
  const out: Conflito[] = [];
  const { meta, legenda, documentos } = docs;

  for (const [codigo, iguais] of indexar(documentos)) {
    if (iguais.length > 1) {
      out.push({
        tipo: 'codigo_duplicado', codigo, titulo: iguais.map((d) => d.titulo).join(' × '),
        detalhe: `${iguais.length} documentos vigentes disputam o código ${codigo}.`,
        gravidade: 'alta',
      });
    }
  }

  for (const d of documentos) {
    if (d.foraDaLista) {
      out.push({
        tipo: 'fora_da_lista', codigo: codigoReal(d), titulo: d.titulo,
        detalhe: d.nota ?? 'Documento em uso, sem entrada própria na lista mestra.',
        gravidade: d.natureza === 'formulario' ? 'alta' : 'media',
      });
    }
    if (d.codigosParalelos?.length) {
      out.push({
        tipo: 'codigo_paralelo', codigo: codigoReal(d), titulo: d.titulo,
        detalhe: `O arquivo real se identifica como ${d.codigosParalelos.join(' e ')}. São o mesmo documento com códigos diferentes.`,
        gravidade: 'media',
      });
    }
    if (d.divergenciaNaLista) {
      out.push({
        tipo: 'revisao_divergente', codigo: codigoReal(d), titulo: d.titulo,
        detalhe: `A planilha da lista mestra traz rev. ${d.divergenciaNaLista.revisao} de ${br(d.divergenciaNaLista.emissao)}; o arquivo em uso é rev. ${d.revisao} de ${br(d.emissao ?? '')}. Vale o arquivo.`,
        gravidade: 'alta',
      });
    }
    if (!d.codigo.startsWith(SEM_CODIGO) && !significadoDoPrefixo(legenda, d.codigo)) {
      out.push({
        tipo: 'prefixo_desconhecido', codigo: d.codigo, titulo: d.titulo,
        detalhe: `A legenda desta empresa reconhece ${Object.keys(legenda).join(', ')} — "${d.codigo.split('-')[0]}" não está entre eles.`,
        gravidade: 'alta',
      });
    }
  }

  // Vencimento é do sistema, não de cada linha. Quando tudo foi emitido no mesmo dia, tudo vence
  // no mesmo dia — e uma carta por documento esconderia justamente isso.
  const vencidos = new Map<string, DocumentoMestre[]>();
  for (const d of documentos) {
    if (d.proximaRevisao && new Date(d.proximaRevisao) < hoje) {
      vencidos.set(d.proximaRevisao, [...(vencidos.get(d.proximaRevisao) ?? []), d]);
    }
  }
  for (const [data, iguais] of vencidos) {
    const emissoes = new Set(iguais.map((d) => d.emissao).filter(Boolean));
    const mesmaEmissao = emissoes.size === 1 ? [...emissoes][0]! : null;
    out.push({
      tipo: 'revisao_vencida', codigo: null,
      titulo: `${iguais.length} documento${iguais.length > 1 ? 's' : ''} da lista mestra`,
      detalhe: `Revisão prevista para ${br(data)} e ainda não feita.${mesmaEmissao ? ` Vence tudo na mesma data porque tudo foi emitido na mesma data — ${br(mesmaEmissao)}.` : ''}`,
      gravidade: 'alta',
    });
  }

  // Responsável que não é da empresa. Uma carta por rótulo, e não uma por documento: o que está em
  // aberto é uma decisão só — quem, lá dentro, assume o que hoje é de fora. Dez cartas iguais
  // esconderiam que a pergunta é uma.
  //
  // Gravidade média de propósito. Durante a implantação isto é o estado esperado, e não um erro:
  // a consultoria escreve o sistema porque ninguém lá dentro sabe escrevê-lo ainda. O que não pode
  // é chegar à certificação assim — por isso aparece, e por isso não pinta de vermelho.
  for (const r of docs.responsaveisExternos ?? []) {
    const seus = documentos.filter((d) => d.responsavel === r.rotulo);
    if (!seus.length) continue;
    const n = seus.length;
    out.push({
      tipo: 'responsavel_externo', codigo: null,
      titulo: `${n} documento${n > 1 ? 's' : ''} sob "${r.rotulo}"`,
      detalhe: `"${r.rotulo}" é ${r.quem} — não é posto de dentro da empresa, e a lista não diz isso em lugar nenhum: na coluna Responsável ele aparece igual a "Ger. Qualidade", que é gente de lá. A ${meta.norma} §5.3 manda a direção atribuir e comunicar as responsabilidades DENTRO da organização; enquanto ninguém de lá for nomeado, ${n > 1 ? 'estes documentos ficam' : 'este documento fica'} sem dono no dia em que o contrato terminar. ${n > 1 ? 'São' : 'É'}: ${seus.map((d) => codigoReal(d) ?? d.titulo).join(', ')}.${r.nota ? ` ${r.nota}` : ''}`,
      gravidade: 'media',
    });
  }

  // A própria lista mestra não se cataloga, então é verificada à parte.
  if (new Date(meta.proximaRevisao) < hoje) {
    out.push({
      tipo: 'revisao_vencida', codigo: meta.codigo, titulo: 'Lista mestra de documentos',
      detalhe: `Emitida em ${br(meta.emissao)}, revisão prevista para ${br(meta.proximaRevisao)}.`,
      gravidade: 'alta',
    });
  }
  if (meta.codigosParalelos.length) {
    out.push({
      tipo: 'codigo_duplicado', codigo: meta.codigo, titulo: 'Lista mestra de documentos',
      detalhe: meta.nota ?? `A própria lista responde também por ${meta.codigosParalelos.join(' e ')}.`,
      gravidade: 'alta',
    });
  }
  const catalogados = documentos.filter((d) => !d.foraDaLista).length;
  if (meta.totalCatalogado !== catalogados) {
    const a = catalogados > meta.totalCatalogado;
    out.push({
      tipo: 'contagem_divergente', codigo: meta.codigo, titulo: 'Lista mestra de documentos',
      detalhe: `O cabeçalho declara ${meta.totalCatalogado} documentos e a lista tem ${catalogados}. ${a ? 'Entraram documentos e o total não foi atualizado' : 'Saíram documentos e o total não foi atualizado'} — quem confere pelo número não encontra.`,
      gravidade: 'media',
    });
  }
  if (!meta.aprovadoPor || !meta.elaboradoPor) {
    out.push({
      tipo: 'sem_aprovacao', codigo: meta.codigo, titulo: 'Lista mestra de documentos',
      detalhe: `Os campos "Elaborado por" e "Aprovado por" estão em branco. A ${meta.norma} §7.5.2 pede aprovação registrada.`,
      gravidade: 'alta',
    });
  }

  return out;
}
