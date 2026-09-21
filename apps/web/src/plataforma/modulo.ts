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

/** O endereço de uma tela. A lista fica no registro dos módulos, e é lá que se acrescenta uma. */
export type Rota = string;

export interface TelaDeModulo {
  rotulo: string;
  rota: Rota;
  /** O que desenhar. Função, e não componente, para o registro não precisar de JSX. */
  render: () => React.ReactNode;
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
  /** Onde as telas dele entram no menu de cima. Módulos que dividem o mesmo domínio aparecem
   *  como abas dentro dele. */
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
