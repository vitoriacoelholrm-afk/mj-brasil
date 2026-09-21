// O TEXTO DO MANUAL DA EMPRESA, cláusula por cláusula.
//
// O Manual da Qualidade percorre a norma inteira e DIZ, em cada cláusula, o que a empresa faz.
// Esse texto existe desde antes do app: está no arquivo que a empresa emitiu, assinado. O que
// faltava era ele chegar à tela — a cláusula abria mostrando documentos e telas, e a resposta que
// o auditor quer ouvir primeiro ("o que vocês fazem quanto a isto?") ficava fora.
//
// Aqui só existe o FORMATO. O texto é de uma empresa só e entra pelo perfil dela, como o
// diagnóstico e as ordens: `empresas/<nome>.manual.ts` chama `registrarManual` e some do caminho.
// Nenhum nome de empresa passa por este arquivo.
import { empresaAtiva } from '@/plataforma/empresa';

/** Um pedaço do manual dentro de uma cláusula.
 *
 *  Existe porque o manual não escreve a cláusula num bloco só: a 7.1 tem 7.1.1 Generalidades,
 *  7.1.2 Pessoas, 7.1.3 Infraestrutura, 7.1.4 Ambiente. Achatar isso num parágrafo perderia a
 *  numeração que o próprio auditor usa para pedir o trecho. */
export interface TrechoDoManual {
  /** O subitem como o manual o numera — '7.1.2'. Ausente quando a cláusula tem texto direto. */
  sub?: string;
  /** O título do subitem, como o manual o escreve. */
  titulo?: string;
  /** O texto corrido. */
  paragrafos?: string[];
  /** A lista, quando o manual enumera. Vem separada do parágrafo porque é assim que se lê. */
  itens?: string[];
  /** A NOTA da norma, quando o manual a reproduz. */
  nota?: string;
  /** Texto entre aspas no manual — política, escopo, missão. É citação e a tela o destaca. */
  citacao?: string;
}

/** O que o manual da empresa diz sobre uma cláusula da norma. */
export interface ClausulaDoManual {
  /** A cláusula da ISO — '7.4'. É a chave de ligação com `norma.ts`. */
  ref: string;
  /** O título como o MANUAL DA EMPRESA o escreve, que nem sempre é o da norma. */
  titulo: string;
  trechos: TrechoDoManual[];
}

/** O manual de uma empresa: o código dele na lista mestra, e o texto por cláusula. */
export interface ManualDaEmpresa {
  /** O código na lista mestra da empresa — é por ele que a tela carimba e que o texto se grava. */
  codigo: string;
  /** Verdadeiro quando este texto é EXEMPLO a ser editado, e não o manual de uma empresa real.
   *  É o que separa o molde do documento assinado: no molde a tela oferece edição. */
  exemplo?: boolean;
  clausulas: ClausulaDoManual[];
}

const POR_EMPRESA = new Map<string, ManualDaEmpresa>();

export function registrarManual(empresaId: string, manual: ManualDaEmpresa): void {
  POR_EMPRESA.set(empresaId, manual);
}

/** O manual da empresa ativa, ou null quando ela ainda não tem um escrito — que é o estado de
 *  todo cliente novo. A tela diz isso, em vez de mostrar cláusula vazia sem explicar por quê. */
export function manualDaEmpresa(): ManualDaEmpresa | null {
  return POR_EMPRESA.get(empresaAtiva().id) ?? null;
}

/** O que o manual diz sobre esta cláusula. Null quando o manual não a cobre.
 *
 *  Casa por prefixo para baixo: pedir a 8.5 devolve o que o manual escreveu em 8.5 se houver
 *  entrada própria. Não sobe — pedir a 8.5.5 NÃO devolve a 8.5, porque responder a cláusula
 *  filha com o texto da mãe é dizer que está coberta quando não está. */
export function textoDaClausula(ref: string): ClausulaDoManual | null {
  return manualDaEmpresa()?.clausulas.find((x) => x.ref === ref) ?? null;
}

/** As cláusulas que o manual da empresa ativa descreve. */
export function clausulasEscritas(): string[] {
  return manualDaEmpresa()?.clausulas.map((x) => x.ref) ?? [];
}

/** O texto de um trecho em linha corrida — para busca e para o resumo da cláusula. */
export function corridoDo(trecho: TrechoDoManual): string {
  return [
    ...(trecho.paragrafos ?? []),
    trecho.citacao ?? '',
    ...(trecho.itens ?? []),
    trecho.nota ?? '',
  ].filter(Boolean).join(' ');
}
