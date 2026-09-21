// O QUE É UM MÓDULO.
//
// Um módulo é um pedaço do sistema da qualidade que se instala inteiro ou não se instala: as
// regras, os formulários e as telas dele viajam juntos, numa pasta só. Quem tem portão instala a
// portaria; quem jateia e pinta instala o tratamento de superfície; quem não tem, não leva —
// e não fica com menu apontando para tela que não serve.
//
// A plataforma define o que um módulo É e não conhece nenhum. Quem conhece a lista é o registro
// (`modules/index.ts`), e quem escolhe é o perfil de cada empresa. A seta aponta sempre nesse
// sentido: módulo importa plataforma, plataforma não importa módulo. Se um dia inverter, o motor
// deixa de servir para o cliente seguinte — que é o problema que tudo isto existe para evitar.
import type { Permissao } from './acesso';
import type { ModoDeContratacao } from './contratacao';
import { temAuditoria, temGestao } from './contratacao';
import type { FormularioDef } from './formularios';
import type { PapelDeFormulario } from './empresa';

/** O endereço de uma tela. A lista fica no registro dos módulos, e é lá que se acrescenta uma. */
export type Rota = string;

/** O que a tela recebe para funcionar sem conhecer o app: para onde navegar, e quais módulos
 *  estão instalados. Passar isto em vez de deixar a tela importar o registro é o que impede a
 *  volta circular — o registro conhece os módulos, os módulos não conhecem o registro. */
export interface ContextoDeTela {
  irPara: (rota: Rota) => void;
  /** Os módulos que ESTE usuário enxerga. É o que monta menu e navegação. */
  modulos: Modulo[];
  /** Todos os módulos que a EMPRESA tem, antes do filtro de permissão.
   *
   *  Existe por causa do manual. O que ele mostra de um formulário é o MODELO em branco — os
   *  campos, não o conteúdo —, e modelo em branco é documento de apresentação, não registro.
   *  Esconder o modelo de quem não preenche esconderia justamente de quem apresenta: a coordenação
   *  da qualidade não escreve pedido de compra, e é ela quem mostra o FM-011 ao auditor.
   *
   *  O registro PREENCHIDO continua atrás da regra do setor, que é onde a regra importa. */
  instalados: Modulo[];
}

export interface TelaDeModulo {
  rotulo: string;
  rota: Rota;
  /** A permissão DESTA tela, quando ela é diferente da do módulo.
   *
   *  Existe porque um módulo é uma unidade de INSTALAÇÃO — as regras, os formulários e as telas
   *  que viajam juntos — e não uma unidade de acesso. "Registros do SGQ" traz oito telas, e o
   *  auditor interno e o operador não são a mesma pessoa. Enquanto a permissão era só do módulo,
   *  liberar a não conformidade para quem a preenche liberava, junto, o plano de auditoria de
   *  quem vai ser auditado.
   *
   *  Ausente é o caso normal: a tela herda a do módulo, e nada muda para quem não precisa da
   *  distinção. */
  exige?: Permissao;
  /** O que o contrato precisa incluir para esta tela EXISTIR. Ausente é o caso normal: a tela
   *  serve aos três produtos.
   *
   *  `'auditoria'` é a tela que é trabalho da consultoria — o diagnóstico é o levantamento que
   *  ela entrega, e num contrato só de gestão ele não tem autor. `'gestao'` é o contrário: tela
   *  de operação diária, que num contrato só de auditoria não teria quem a preenchesse.
   *
   *  Diferente de `exige`: permissão é QUEM, dentro da empresa; modo é O QUE a empresa comprou.
   *  Uma tela pode cair pelos dois motivos, e são motivos que não se substituem. */
  modo?: 'auditoria' | 'gestao';
  /** O formulário que esta tela preenche, quando é uma tela de formulário. É o que permite ao
   *  manual mandar a pessoa da cláusula direto para o lugar de registrar. */
  formulario?: PapelDeFormulario;
  /** O que desenhar. Função, e não componente, para o registro não precisar de JSX. */
  render: (ctx: ContextoDeTela) => React.ReactNode;
}

export interface Modulo {
  /** O nome da pasta. Também é a chave que o perfil da empresa lista. */
  chave: string;
  /** Como ele aparece para quem usa. */
  nome: string;
  /** Uma frase: o que ele resolve. */
  descricao: string;
  /** As cláusulas da ISO 9001 que ele atende. É o que liga o módulo à auditoria. */
  clausulas: string[];
  /** A seção da coluna em que as telas dele entram. Módulos que dividem o mesmo domínio caem
   *  na mesma seção — é assim que "Registros" junta oito telas de um módulo só e "Monitoramento"
   *  junta as de dois.
   *
   *  Domínio de uma tela só não vira seção: viraria título para um item. Nesse caso o próprio
   *  domínio é o item, com o nome pelo qual a pessoa o procura. */
  dominio: string;
  /** Sem esta permissão, o módulo inteiro some do menu. Esconder é diferente de travar: um setor
   *  que não é seu não deveria nem sugerir que existe algo ali para você. */
  exige?: Permissao;
  telas: TelaDeModulo[];
  /** Os formulários que ele traz. É daqui que sai a lista da plataforma inteira. */
  formularios?: FormularioDef[];
  /** Verdadeiro quando todo cliente certificado precisa dele — é norma, não é opção.
   *  Falso quando depende do que a empresa faz (ter portão, jatear e pintar). */
  essencial: boolean;
}

/** Verdadeiro quando o contrato desta empresa inclui o que a tela exige. Tela sem `modo` serve
 *  aos três produtos, que é o caso da grande maioria. */
function cabeNoContrato(tela: TelaDeModulo, modo: ModoDeContratacao): boolean {
  if (tela.modo === 'auditoria') return temAuditoria(modo);
  if (tela.modo === 'gestao') return temGestao(modo);
  return true;
}

/** Os módulos que este papel enxerga, JÁ COM AS TELAS FILTRADAS, na ordem em que foram declarados.
 *
 *  Dois cortes, e a ordem entre eles não importa porque são independentes:
 *
 *    · o do MÓDULO — um setor que não é seu não deveria nem sugerir que existe algo ali;
 *    · o da TELA — dentro de um setor que é seu, ainda há o que não é.
 *
 *  Módulo que fica sem nenhuma tela SOME. Deixá-lo como título vazio seria pior do que escondê-lo:
 *  anuncia que existe alguma coisa ali e não entrega nada.
 *
 *  Devolve cópias quando filtra. Os módulos são constantes compartilhadas por todo mundo — recortar
 *  o original faria o filtro de um usuário valer para o próximo. */
export function modulosVisiveis(
  modulos: Modulo[], pode: (p: Permissao) => boolean, modo: ModoDeContratacao = 'auditoria_e_gestao',
): Modulo[] {
  const saida: Modulo[] = [];
  for (const m of modulos) {
    if (m.exige && !pode(m.exige)) continue;
    const telas = m.telas.filter((t) => (!t.exige || pode(t.exige)) && cabeNoContrato(t, modo));
    if (!telas.length) continue;
    saida.push(telas.length === m.telas.length ? m : { ...m, telas });
  }
  return saida;
}

/** A tela de uma rota, entre os módulos dados — ou null quando a rota não é de nenhum deles.
 *  Null acontece de verdade: uma empresa sem portaria não tem a rota de cargas, e um link velho
 *  para ela tem de cair em algum lugar em vez de quebrar. */
export function telaDaRota(modulos: Modulo[], rota: Rota): TelaDeModulo | null {
  for (const m of modulos) {
    const tela = m.telas.find((t) => t.rota === rota);
    if (tela) return tela;
  }
  return null;
}

/** Todos os formulários dos módulos dados. A plataforma não tem formulário próprio: ela sabe
 *  desenhar qualquer um, e quem os traz são os módulos. */
export function formulariosDe(modulos: Modulo[]): FormularioDef[] {
  return modulos.flatMap((m) => m.formularios ?? []);
}
