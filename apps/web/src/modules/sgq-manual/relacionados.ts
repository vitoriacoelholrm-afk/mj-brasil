// TUDO QUE UMA CLÁUSULA TEM.
//
// A pergunta que o manual responde é a do auditor: "me mostre a 8.5.3". Hoje isso se responde
// abrindo quatro lugares — a lista mestra, o diagnóstico, as telas do sistema e o catálogo do que
// a norma pede. Aqui as quatro viram uma.
//
// Nada disto é dado novo: é o que já existe, cruzado pela cláusula. O manual não guarda nada —
// se ele guardasse, seria mais um lugar para divergir dos outros quatro.
import type { Modulo, TelaDeModulo } from '@/plataforma/modulo';
import type { DocumentoMestre } from '@/plataforma/documentos';
import { catalogados } from '@/modules/sgq-documentos/listaMestra';
import { catalogoPara, cobertura, type DocumentoPadrao } from '@/modules/sgq-documentos/catalogoPadrao';
import { diagnosticoDaEmpresa } from '@/modules/sgq-documentos/diagnostico/itens';
import type { Avaliacao } from '@/modules/sgq-documentos/diagnostico/vocabulario';
import { empresaAtiva } from '@/plataforma/empresa';
import { clausulaPorRef, tocaClausula, type ClausulaDaNorma } from './norma';

/** Uma tela do sistema que atende a cláusula, com o módulo de onde ela vem. */
export interface TelaRelacionada {
  tela: TelaDeModulo;
  modulo: Modulo;
}

export interface Relacionados {
  clausula: ClausulaDaNorma;
  /** Os documentos da empresa que declaram esta cláusula na lista mestra. */
  documentos: DocumentoMestre[];
  /** As telas onde se registra o que a cláusula pede. */
  telas: TelaRelacionada[];
  /** O que a norma exige para esta cláusula e a empresa ainda não tem. */
  faltando: DocumentoPadrao[];
  /** Os módulos instalados que declaram atender esta cláusula. */
  modulos: Modulo[];
  /** Como o diagnóstico avaliou — null quando não foi avaliada. */
  avaliacao: Avaliacao | null;
}

export function relacionadosDa(ref: string, modulos: Modulo[]): Relacionados | null {
  const clausula = clausulaPorRef(ref);
  if (!clausula) return null;

  const documentos = catalogados()
    .filter((d) => (d.clausulas ?? []).some((c) => tocaClausula(c, ref)));

  // O formulário é procurado entre TODOS os módulos, não dentro do módulo da tela: a ficha de
  // treinamento é declarada pelos registros do SGQ e preenchida numa tela do setor de pessoas,
  // que é outro domínio de menu. Procurar só dentro do próprio módulo perdia justamente essa.
  const porPapel = new Map(modulos.flatMap((m) => (m.formularios ?? []).map((f) => [f.papel, f])));

  const telas: TelaRelacionada[] = [];
  for (const modulo of modulos) {
    for (const tela of modulo.telas) {
      // A tela entra por DOIS caminhos: porque o formulário que ela preenche declara a cláusula,
      // ou porque o módulo dela declara. O segundo pega as telas que não são de formulário — o
      // painel de indicadores atende a 9.1 sem ser um formulário.
      const def = tela.formulario ? porPapel.get(tela.formulario) : undefined;
      const peloFormulario = def ? tocaClausula(def.clausula, ref) : false;
      const peloModulo = !tela.formulario && modulo.clausulas.some((c) => tocaClausula(c, ref));
      if (peloFormulario || peloModulo) telas.push({ tela, modulo });
    }
  }

  const cob = cobertura(empresaAtiva().documentacao.documentos, empresaAtiva().modulos);
  const faltando = cob.faltando.filter((x) => x.clausulas.some((c) => tocaClausula(c, ref)));

  const item = diagnosticoDaEmpresa().find((i) => i.clausulaRef === ref);

  return {
    clausula,
    documentos,
    telas,
    faltando,
    modulos: modulos.filter((m) => m.clausulas.some((c) => tocaClausula(c, ref))),
    avaliacao: item?.avaliacao ?? null,
  };
}

/** Quantas coisas a cláusula tem, para o índice mostrar sem abrir. Conta o que EXISTE — documento
 *  e tela. O que falta não entra na conta: seria somar a ausência ao que há. */
export function quantoTem(ref: string, modulos: Modulo[]): number {
  const r = relacionadosDa(ref, modulos);
  return r ? r.documentos.length + r.telas.length : 0;
}

/** As cláusulas que a norma exige e para as quais a empresa não tem nada — nem documento, nem
 *  tela. É o buraco de verdade, e é por onde a auditoria começa. */
export function clausulasVazias(refs: string[], modulos: Modulo[]): string[] {
  return refs.filter((ref) => quantoTem(ref, modulos) === 0);
}

/** O catálogo padrão da empresa ativa, para a tela dizer o que a norma pede em cada cláusula. */
export const catalogoDaEmpresa = () => catalogoPara(empresaAtiva().modulos);
