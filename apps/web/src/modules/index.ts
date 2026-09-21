// O REGISTRO DOS MÓDULOS — a única lista de tudo que existe.
//
// Acrescentar um módulo é acrescentar uma pasta e uma linha aqui. Nada mais: o menu, as rotas, os
// formulários e a lista de cláusulas atendidas se montam a partir desta lista.
//
// A ORDEM importa: é a ordem do menu, da esquerda para a direita. Situação primeiro porque é o
// veredito; o que a empresa faz no dia a dia depois; cadastro por último.
//
// Quem escolhe quais destes uma empresa tem é o perfil dela (`empresas/<nome>.ts`). Uma empresa
// que não jateia não recebe `tratamento-superficie`, e o menu dela nasce sem a ordem de serviço —
// não travada, não escondida atrás de aviso: inexistente.
import { formulariosDe, type Modulo } from '@/plataforma/modulo';
import type { PapelDeFormulario } from '@/plataforma/empresa';
import type { FormularioDef } from '@/plataforma/formularios';
import { cadastros, nucleo } from './nucleo/modulo';
import { portaria } from './portaria/modulo';
import { sgqCompetencia, sgqRegistros } from './sgq-registros/modulo';
import { sgqDocumentos } from './sgq-documentos/modulo';
import { sgqIndicadores } from './sgq-indicadores/modulo';
import { tratamentoSuperficie } from './tratamento-superficie/modulo';

export const MODULOS: Modulo[] = [
  tratamentoSuperficie,
  sgqDocumentos,
  sgqRegistros,
  sgqIndicadores,
  nucleo,
  sgqCompetencia,
  portaria,
  cadastros,
];

/** Os módulos de uma instalação. `instalados` vem do perfil da empresa; sem ele, tudo — que é o
 *  caso enquanto houver um cliente só. */
export function modulosDe(instalados?: readonly string[]): Modulo[] {
  if (!instalados) return MODULOS;
  return MODULOS.filter((m) => m.essencial || instalados.includes(chaveRaiz(m)));
}

/** A chave do módulo sem o sufixo de sub-área: 'sgq-registros/competencia' → 'sgq-registros'.
 *  O perfil lista MÓDULOS, não pedaços deles. */
export const chaveRaiz = (m: Modulo) => m.chave.split('/')[0];

/** Todo módulo, com o que ele atende — é o que o diagnóstico cruza com o catálogo da norma. */
export const clausulasAtendidas = (modulos: Modulo[] = MODULOS) =>
  [...new Set(modulos.flatMap((m) => m.clausulas))].sort();

/** Todos os formulários que existem, de todos os módulos. A plataforma não tem os seus: ela sabe
 *  desenhar qualquer um, e quem os traz são os módulos. */
export const FORMULARIOS: FormularioDef[] = formulariosDe(MODULOS);

export function formularioDoPapel(papel: PapelDeFormulario): FormularioDef | null {
  return FORMULARIOS.find((f) => f.papel === papel) ?? null;
}
