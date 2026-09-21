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
import { clausulaPorRef, especificidade, tocaClausula, type ClausulaDaNorma } from './norma';

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

  // Do mais específico para o mais geral: o procedimento que responde por esta cláusula vem
  // antes do manual, que cobre a seção inteira. Ordem alfabética de código poria o manual no
  // topo de todas as 37 e empurraria para baixo justamente quem responde.
  const documentos = catalogados()
    .map((d) => ({ d, peso: Math.max(0, ...(d.clausulas ?? []).map((c) => especificidade(c, ref))) }))
    .filter((x) => x.peso > 0)
    .sort((a, b) => b.peso - a.peso || a.d.codigo.localeCompare(b.d.codigo))
    .map((x) => x.d);

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

/** Quantos NOMEIAM a cláusula — declaram 8.5.3, e não a seção 8 inteira.
 *
 *  A diferença importa na auditoria. O manual da qualidade declara as sete seções, então toda
 *  cláusula tem alguma cobertura no papel. O auditor não pergunta "onde está coberto": pergunta
 *  "qual documento responde por esta cláusula". Quando a resposta é só o manual, a resposta é
 *  fraca — e é isso que este número mostra. */
export function quantosNomeiam(ref: string, modulos: Modulo[]): number {
  const r = relacionadosDa(ref, modulos);
  if (!r) return 0;
  const nomeada = r.documentos.filter(
    (d) => (d.clausulas ?? []).some((c) => c.split('.').length >= 2 && tocaClausula(c, ref)),
  );
  return nomeada.length + r.telas.length;
}

/** As cláusulas que nenhum documento nomeia e nenhuma tela atende — cobertas só pela declaração
 *  de seção do manual. Não é ausência de sistema; é ausência de endereço. */
export function clausulasSemEndereco(refs: string[], modulos: Modulo[]): string[] {
  return refs.filter((ref) => quantosNomeiam(ref, modulos) === 0);
}

/** O catálogo padrão da empresa ativa, para a tela dizer o que a norma pede em cada cláusula. */
export const catalogoDaEmpresa = () => catalogoPara(empresaAtiva().modulos);
