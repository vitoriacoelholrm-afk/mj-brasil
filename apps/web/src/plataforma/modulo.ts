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

/** Os módulos que este papel enxerga, na ordem em que foram declarados. */
export function modulosVisiveis(
  modulos: Modulo[], pode: (p: Permissao) => boolean,
): Modulo[] {
  return modulos.filter((m) => !m.exige || pode(m.exige));
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
