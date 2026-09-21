// O PLANO DE UNIFICAÇÃO — de duplicidade para decisão, com código concreto.
//
// A tela de conflitos diz o que está errado. Isto diz o que fazer: qual código sai, qual fica,
// qual documento se funde com qual. Sem isso, "FM-011 está duplicado" fica sendo um lembrete
// eterno que ninguém sabe por onde resolver.
//
// E uma coisa que este arquivo NÃO faz, de propósito: propor fusão por semelhança. Tentei e saiu
// errado — dois procedimentos no mesmo padrão viravam "duplicados", quando eram a demão de fundo
// e a de acabamento. Só vira proposta de fusão o que tem PROVA de ser o mesmo documento: dois
// arquivos reais disputando o mesmo código. O resto fica listado para ser olhado por quem conhece
// o conteúdo, que não é o software.
import {
  SEM_CODIGO, aposentado, proximoCodigoLivre,
  type Documentacao, type DocumentoMestre, type Natureza,
} from '@/plataforma/documentos';
import { cobertura, type DocumentoPadrao } from './catalogoPadrao';

export type TipoProposta =
  | 'renumerar'          // o documento tem código de outro; recebe um livre
  | 'aposentar_codigo'   // o arquivo responde por dois códigos; um deles sai
  | 'fundir'             // dois documentos dizem a mesma coisa
  | 'cadastrar'          // circula sem código; entra na lista
  | 'conciliar_revisao'; // a lista e o arquivo discordam da revisão

export interface Proposta {
  tipo: TipoProposta;
  titulo: string;
  /** Como está hoje. */
  de: string;
  /** Como fica. */
  para: string;
  porque: string;
  gravidade: 'alta' | 'media';
}

export const PROPOSTA_ROTULO: Record<TipoProposta, string> = {
  renumerar: 'Recebe código livre',
  aposentar_codigo: 'Aposentar o código paralelo',
  fundir: 'Fundir num documento só',
  cadastrar: 'Cadastrar na lista mestra',
  conciliar_revisao: 'Conciliar a revisão',
};

/** Um padrão cumprido por mais de um documento. */
export interface ParNatural {
  padrao: DocumentoPadrao;
  documentos: DocumentoMestre[];
  naturezas: Natureza[];
}

export interface PlanoDeUnificacao {
  propostas: Proposta[];
  /** Padrões cumpridos por mais de um documento. NÃO é duplicidade: fica aqui para ser olhado,
   *  porque fundir procedimento com formulário, ou demão de fundo com demão de acabamento, é
   *  perder informação. */
  agrupados: ParNatural[];
}

/** Distribui códigos livres do prefixo, um por vez, sem repetir.
 *  Continua do MAIOR, nunca preenche buraco: um número vago pode ser código aposentado, e
 *  reaproveitá-lo faz dois documentos diferentes terem o mesmo número em épocas diferentes. */
function distribuidor(documentos: DocumentoMestre[], prefixo: string) {
  const usados = new Set(documentos.map((d) => d.codigo));
  return () => {
    let proximo = proximoCodigoLivre([...usados].map((codigo) => ({ codigo }) as DocumentoMestre), prefixo);
    while (usados.has(proximo)) {
      usados.add(proximo);
      proximo = proximoCodigoLivre([...usados].map((codigo) => ({ codigo }) as DocumentoMestre), prefixo);
    }
    usados.add(proximo);
    return proximo;
  };
}

/** O prefixo que a empresa mais usa para formulário. É nele que o que falta código vai entrar. */
function prefixoDeFormulario(documentos: DocumentoMestre[]): string {
  const contagem = new Map<string, number>();
  for (const d of documentos) {
    if (d.natureza !== 'formulario' || d.codigo.startsWith(SEM_CODIGO)) continue;
    const p = d.codigo.split('-')[0];
    contagem.set(p, (contagem.get(p) ?? 0) + 1);
  }
  return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'FR';
}

export function planoDeUnificacao(docs: Documentacao, modulos: string[]): PlanoDeUnificacao {
  const { meta } = docs;
  const propostas: Proposta[] = [];
  // O plano só propõe sobre documento VIVO. Renumerar, fundir ou conciliar a revisão de um
  // documento aposentado é trabalho sobre papel que ninguém vai abrir de novo — e a fila de
  // decisões existe para caber na cabeça de quem vai executá-la.
  //
  // O distribuidor de códigos, esse, continua olhando a lista INTEIRA: código de documento
  // aposentado não se reaproveita, senão dois documentos diferentes carregam o mesmo número em
  // épocas diferentes, e o arquivo morto passa a colidir com o vivo.
  const documentos = docs.documentos.filter((d) => !aposentado(d));
  const prefixo = prefixoDeFormulario(documentos);
  const proximo = distribuidor(docs.documentos, prefixo);

  /* ── 1. Dois documentos, o mesmo código ────────────────────────────────────────────────── */
  const porCodigo = new Map<string, DocumentoMestre[]>();
  for (const d of documentos) {
    if (d.codigo.startsWith(SEM_CODIGO)) continue;
    porCodigo.set(d.codigo, [...(porCodigo.get(d.codigo) ?? []), d]);
  }
  for (const [codigo, iguais] of porCodigo) {
    if (iguais.length < 2) continue;
    // Quem estava catalogado primeiro fica; quem chegou por fora recebe um código livre.
    const intruso = iguais.find((d) => d.foraDaLista) ?? iguais[iguais.length - 1];
    const novo = proximo();
    propostas.push({
      tipo: 'renumerar',
      titulo: intruso.titulo,
      de: codigo,
      para: novo,
      porque: `O código ${codigo} já é de "${iguais.find((d) => d !== intruso)!.titulo}". Dois documentos vigentes com o mesmo código significa que um dos dois vai ser aberto no lugar do outro.`,
      gravidade: 'alta',
    });
  }

  /* ── 2. Prefixo que a legenda não conhece, ou nenhum código ────────────────────────────── */
  for (const d of documentos) {
    const semCodigo = d.codigo.startsWith(SEM_CODIGO);
    const prefixoDele = d.codigo.split('-')[0];
    const desconhecido = !semCodigo && !docs.legenda[prefixoDele];
    if (!semCodigo && !desconhecido) continue;
    if ((porCodigo.get(d.codigo)?.length ?? 0) > 1) continue; // já tratado acima

    const novo = proximo();
    propostas.push({
      tipo: semCodigo ? 'cadastrar' : 'renumerar',
      titulo: d.titulo,
      de: semCodigo ? 'sem código' : d.codigo,
      para: novo,
      porque: semCodigo
        ? 'Registro em uso sem código e sem entrada na lista mestra: não tem como ser pedido, revisado nem retido.'
        : `O prefixo "${prefixoDele}" não está na legenda desta empresa. Prefixo inventado por fora é como a lista perde o controle.`,
      gravidade: 'alta',
    });
  }

  /* ── 3. O arquivo responde por dois códigos ───────────────────────────────────────────── */
  for (const d of documentos) {
    if (!d.codigosParalelos?.length) continue;
    propostas.push({
      tipo: 'aposentar_codigo',
      titulo: d.titulo,
      de: `${d.codigo} e ${d.codigosParalelos.join(' e ')}`,
      para: d.codigo,
      porque: `O arquivo se identifica de ${d.codigosParalelos.length + 1} jeitos. Fica o da lista mestra; ${d.codigosParalelos.join(' e ')} ${d.codigosParalelos.length > 1 ? 'saem' : 'sai'} do cabeçalho do documento.`,
      gravidade: 'media',
    });
  }
  if (meta.codigosParalelos.length) {
    propostas.push({
      tipo: 'aposentar_codigo',
      titulo: 'A própria lista mestra',
      de: `${meta.codigo} e ${meta.codigosParalelos.join(' e ')}`,
      para: meta.codigo,
      porque: 'A lista que controla os códigos responde por três. Fica o que o próprio arquivo usa.',
      gravidade: 'alta',
    });
  }

  /* ── 4. A revisão da lista não bate com a do arquivo ───────────────────────────────────── */
  for (const d of documentos) {
    if (!d.divergenciaNaLista) continue;
    propostas.push({
      tipo: 'conciliar_revisao',
      titulo: d.titulo,
      de: `planilha: rev. ${d.divergenciaNaLista.revisao}`,
      para: `rev. ${d.revisao}`,
      porque: 'Quem tem razão é o arquivo: é ele que a pessoa abre e é ele que traz elaboração, verificação e aprovação assinadas. A linha da planilha é que precisa ser corrigida.',
      gravidade: 'alta',
    });
  }

  /* ── 5. Dois ARQUIVOS se dizendo o mesmo documento ────────────────────────────────────────
     Aqui há prova: o mesmo documento da lista tem dois arquivos reais disputando ser ele. Não é
     questão de código, é de conteúdo — alguém vai abrir o errado.                              */
  for (const d of documentos) {
    if ((d.codigosParalelos?.length ?? 0) < 2) continue;
    propostas.push({
      tipo: 'fundir',
      titulo: d.titulo,
      de: d.codigosParalelos!.join(' e '),
      para: d.codigo,
      porque: `Existem ${d.codigosParalelos!.length} arquivos diferentes se declarando ${d.codigo}. Um texto só, com uma revisão só — os outros viram obsoletos.`,
      gravidade: 'alta',
    });
  }

  /* ── 6. Vários documentos no mesmo padrão ─────────────────────────────────────────────────
     NÃO é defeito, e por isso não vira proposta. O procedimento diz como se faz, o formulário é
     o registro, a instrução é o passo a passo na máquina — e duas demãos diferentes são dois
     procedimentos legítimos. Fica listado para ser olhado, não para ser fundido às cegas.      */
  const cob = cobertura(documentos, modulos);
  const agrupados: ParNatural[] = cob.atendidos
    .filter(({ locais }) => locais.length > 1)
    .map(({ padrao, locais }) => ({
      padrao,
      documentos: locais,
      naturezas: [...new Set(locais.map((d) => d.natureza))],
    }));

  return { propostas, agrupados };
}

/** Quantas decisões o plano pede, por gravidade. */
export function resumoDoPlano(plano: PlanoDeUnificacao) {
  return {
    total: plano.propostas.length,
    graves: plano.propostas.filter((p) => p.gravidade === 'alta').length,
    agrupados: plano.agrupados.length,
  };
}
