// O DIAGNÓSTICO DA EMPRESA ATIVA.
//
// O módulo traz as REGRAS do diagnóstico — como uma cláusula vira gap, como se calcula aderência.
// O que ele não traz, e não pode trazer, é o diagnóstico de alguém: aquilo sai de visita, leitura
// de documento e entrevista, e é de uma empresa só.
//
// Quem entrega é o perfil — `empresas/<nome>.diagnostico.ts` chama `registrarDiagnostico`. Mesmo
// desenho das ordens de serviço: o de fora conhece o de dentro, nunca o contrário.
import { empresaAtiva } from '@/plataforma/empresa';
import type { ItemParaGap } from './regras';

const POR_EMPRESA = new Map<string, ItemParaGap[]>();

export function registrarDiagnostico(empresaId: string, itens: ItemParaGap[]): void {
  POR_EMPRESA.set(empresaId, itens);
}

/** O levantamento da empresa ativa. Vazio quando ainda não foi feito — que é o estado de todo
 *  cliente novo, e a tela diz isso em vez de mostrar zero por cento de aderência. */
export function diagnosticoDaEmpresa(): ItemParaGap[] {
  return POR_EMPRESA.get(empresaAtiva().id) ?? [];
}
