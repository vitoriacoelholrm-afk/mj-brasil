// O PERFIL DA EMPRESA ATENDIDA — a camada que troca de cliente para cliente.
//
// Cuidado com a palavra "cliente", porque ela tem dois donos aqui:
//   · EMPRESA ATENDIDA  — quem contrata a consultoria. É o que este arquivo descreve, e é o que
//                         troca quando a plataforma ganha mais um.
//   · CLIENTE DA EMPRESA — quem contrata a empresa atendida. Esses vivem dentro da ordem de
//                         serviço, no campo `cliente`.
//
// A regra do corte: se dois clientes da consultoria podem ter valores diferentes, o dado mora
// aqui. Se o valor é o mesmo para todo mundo que jateia e pinta, mora no módulo setorial
// (`src/os`). Se é o mesmo para qualquer setor, mora na plataforma (`src/plataforma`).
import type { Documentacao } from './documentos';

/** Quanto o medido pode se afastar do especificado antes de virar não conformidade.
 *  É número combinado com cada empresa — não existe tolerância universal. */
export interface Tolerancia {
  abaixo: number;
  acima: number;
}

/** O que o app precisa saber para se apresentar como sendo daquela empresa. */
export interface Identidade {
  nome: string;
  subtitulo: string;
  /** A cor de acento, normalmente a da marca ou a que os formulários dela já usam. */
  acento: string;
  acentoFraco: string;
}

/** O PAPEL que um formulário cumpre, independente do código que cada empresa lhe dá.
 *  A tela pede o papel; o perfil diz qual é o código. É o que permite a mesma tela servir uma
 *  empresa que chama a ordem de serviço de FM-001 e outra que a chama de FOR-001. */
export type PapelDeFormulario =
  | 'ordem_servico' | 'relatorio_inspecao' | 'nao_conformidade'
  | 'plano_acao' | 'recebimento' | 'romaneio' | 'avaliacao_fornecedor'
  | 'pesquisa_satisfacao' | 'registro_treinamento' | 'plano_auditoria' | 'pedido_compra';

export interface PerfilDaEmpresa {
  id: string;
  identidade: Identidade;
  tolerancia: Tolerancia;
  documentacao: Documentacao;
  /** Qual código desta empresa cumpre cada papel. O que ela não tem, fica de fora — e a tela
   *  correspondente avisa em vez de quebrar. */
  formularios: Partial<Record<PapelDeFormulario, string>>;
  /** Os módulos setoriais que esta empresa usa. Quem não jateia não recebe surface-treatment. */
  modulos: string[];
  /** Verdadeiro para o perfil em branco que serve de ponto de partida ao próximo cliente. */
  modelo?: boolean;
}

/* ── O registro ────────────────────────────────────────────────────────────────────────────── */

const REGISTRO = new Map<string, PerfilDaEmpresa>();
let ativa: string | null = null;

export function registrar(perfil: PerfilDaEmpresa): PerfilDaEmpresa {
  REGISTRO.set(perfil.id, perfil);
  ativa ??= perfil.id;
  return perfil;
}

export function empresas(): PerfilDaEmpresa[] {
  return [...REGISTRO.values()];
}

export function empresaAtiva(): PerfilDaEmpresa {
  const p = ativa ? REGISTRO.get(ativa) : null;
  if (!p) throw new Error('Nenhuma empresa ativa. Registre um perfil antes de usar o app.');
  return p;
}

export function definirEmpresaAtiva(id: string): PerfilDaEmpresa {
  if (!REGISTRO.has(id)) throw new Error(`Empresa "${id}" não está registrada.`);
  ativa = id;
  return empresaAtiva();
}

/** A tolerância da empresa ativa. As funções puras aceitam uma tolerância explícita; esta é
 *  só o padrão de quem não passa nenhuma. */
export function toleranciaAtiva(): Tolerancia {
  return empresaAtiva().tolerancia;
}
