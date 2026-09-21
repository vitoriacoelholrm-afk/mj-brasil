// AS ORDENS DE SERVIÇO DA EMPRESA ATIVA.
//
// O módulo não conhece nenhuma ordem e não pode conhecer: as ordens são da empresa atendida, e o
// módulo tem de servir para a próxima. Quem entrega é o perfil — `empresas/<nome>.ordens.ts`
// chama `registrarOrdens` e some do caminho.
//
// É o mesmo desenho do registro de empresas, um andar abaixo: o de fora conhece o de dentro, e
// nunca o contrário. Há um teste que falha se um arquivo daqui citar o nome de uma empresa.
//
// Enquanto a ordem de serviço não tem banco, isto é o que alimenta a tela. Quando tiver, este
// arquivo vira a leitura do banco e nada mais muda de lugar.
import { empresaAtiva } from '@/plataforma/empresa';
import type { OrdemServico } from './documentos';

const POR_EMPRESA = new Map<string, OrdemServico[]>();

export function registrarOrdens(empresaId: string, ordens: OrdemServico[]): void {
  POR_EMPRESA.set(empresaId, ordens);
}

/** As ordens da empresa ativa. Vazio quando ela não tem nenhuma — que é o caso de todo cliente
 *  novo no primeiro dia, e não é erro. */
export function ordensDaEmpresa(): OrdemServico[] {
  return POR_EMPRESA.get(empresaAtiva().id) ?? [];
}
