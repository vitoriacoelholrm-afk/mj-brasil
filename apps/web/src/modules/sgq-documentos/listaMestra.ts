// A ponte entre as telas e o motor de documentos.
//
// As telas não querem saber de qual empresa está ativa — chamam `doc('FM-001')` e pronto. Este
// arquivo amarra o motor (`plataforma/documentos.ts`, que não sabe de empresa nenhuma) ao perfil
// ativo (`plataforma/empresa.ts`). Quem põe as empresas no registro é `empresas/index.ts` —
// aqui dentro não se sabe o nome de nenhuma.
import { empresaAtiva, type PapelDeFormulario } from '@/plataforma/empresa';
import {
  acharConflitos, acharDoc, montarCarimbo, porCategoria as agruparPorCategoria,
  porClausula as filtrarPorClausula, proximoCodigoLivre as acharProximoLivre,
  responsavelExterno as lerResponsavelExterno,
  significadoDoPrefixo as lerPrefixo,
  type Conflito, type DocumentoMestre, type ResponsavelExterno,
} from '@/plataforma/documentos';

export type { PapelDeFormulario } from '@/plataforma/empresa';
export {
  CONFLITO_ROTULO, NATUREZA_ROTULO, SEM_CODIGO,
  type Acesso, type Conflito, type DocumentoMestre, type Legenda,
  type ListaMestraMeta, type Natureza, type ResponsavelExterno, type SituacaoDoc, type TipoConflito,
} from '@/plataforma/documentos';

const docs = () => empresaAtiva().documentacao;

/** Todos os documentos da empresa ativa — catalogados e fora da lista. */
export function listaMestra(): DocumentoMestre[] {
  return docs().documentos;
}

/** Só os que a lista mestra realmente cataloga. */
export function catalogados(): DocumentoMestre[] {
  return docs().documentos.filter((d) => !d.foraDaLista);
}

export function listaMestraMeta() {
  return docs().meta;
}

export function legenda() {
  return docs().legenda;
}

/** O documento sob este código. Estoura se não estiver catalogado. */
export function doc(codigo: string): DocumentoMestre {
  return acharDoc(docs().documentos, codigo);
}

/** O carimbo que vai no rodapé de um documento emitido pelo app. */
export function carimbo(codigo: string): string {
  return montarCarimbo(doc(codigo));
}

export function significadoDoPrefixo(codigo: string): string | null {
  return lerPrefixo(docs().legenda, codigo);
}

/** Quando este responsável é de fora da empresa, quem ele é. Null quando é posto de dentro. */
export function responsavelDeFora(responsavel: string | null): ResponsavelExterno | null {
  return lerResponsavelExterno(docs(), responsavel);
}

export function proximoCodigoLivre(prefixo: string): string {
  return acharProximoLivre(docs().documentos, prefixo);
}

export function porCategoria() {
  return agruparPorCategoria(catalogados());
}

export function porClausula(clausula: string): DocumentoMestre[] {
  return filtrarPorClausula(catalogados(), clausula);
}

export function conflitos(hoje = new Date()): Conflito[] {
  return acharConflitos(docs(), hoje);
}

/** O código que esta empresa dá ao formulário que cumpre este papel. Null se ela não o tem. */
export function codigoDoPapel(papel: PapelDeFormulario): string | null {
  return empresaAtiva().formularios[papel] ?? null;
}

/** O carimbo do formulário que cumpre este papel, pronto para o rodapé. Null se a empresa ainda
 *  não cadastrou esse formulário — a tela avisa, não quebra. */
export function carimboDoPapel(papel: PapelDeFormulario): string | null {
  const codigo = codigoDoPapel(papel);
  return codigo ? carimbo(codigo) : null;
}
