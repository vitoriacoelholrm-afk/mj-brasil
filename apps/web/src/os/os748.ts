// A OS 748 do Consórcio Ápia-Real, transcrita do Plano de Serviço preenchido à mão em abril/2026.
// Os valores são os do papel — inclusive a rugosidade 70 µm, que diverge dos 60 µm que foram para
// o cliente no RIP CAR-01-2026. É de propósito: é o que a tela precisa mostrar.
import type { EtapaPreenchida } from './regras';

export interface Tinta {
  especificada: string;
  fabricante: string;
  cor: string;
  metodoAplicacao: string;
  loteA: string | null;
  validadeA: string | null;
  loteB: string | null;
  validadeB: string | null;
}

export interface ItemOs { descricao: string; quantidade: number; unidade: string }

export const OS_748 = {
  folio: '748',
  cliente: 'Consórcio Ápia - Real',
  obraProjeto: 'Obra Samarco',
  equipamento: 'Tubulações',
  pintura: 'externa' as const,
  // A referência do esquema vem do plano de pintura DO CLIENTE — é ele que manda nas tolerâncias.
  esquemaPintura: '5.3.1 do 431572-G-CAR-IT0026 rev.00',
  ordemCompraCliente: null,
  orcamentoProposta: null,
  revisao: null,
  quantidadePecas: null,
  prazoEntrega: null,
  // O RIP gerado a partir desta OS saiu com o número 784 — dígitos trocados.
  ripNumero: 'CAR-01-2026',
  ripOsDeclarada: '784',
  emitidoPor: 'Gustavo Moreira',
  verificadoPor: 'Emerson William de Faria',
};

export const ITENS_748: ItemOs[] = [
  { descricao: 'Tubo 2"', quantidade: 6, unidade: 'm' },
  { descricao: 'Tubo 12"', quantidade: 24, unidade: 'm' },
  { descricao: 'Tubo 3/4"', quantidade: 6, unidade: 'm' },
  { descricao: 'Tubo 6"', quantidade: 6, unidade: 'm' },
  { descricao: 'Tubo 10"', quantidade: 54, unidade: 'm' },
];

/** Tinta de dois componentes: cada demão tem lote A e lote B, com validades separadas. */
export const TINTAS_748: Partial<Record<string, Tinta>> = {
  fundo: {
    especificada: 'Jotamastic 80',
    fabricante: 'Jotun',
    cor: 'Cinza N6,5',
    metodoAplicacao: 'Pistola convencional',
    loteA: '2808676', validadeA: '05/2026',
    loteB: '2805924', validadeB: '05/2026',
  },
  intermediario_i: {
    especificada: 'Hardtop XP',
    fabricante: 'Jotun',
    cor: 'Verde emblema',
    metodoAplicacao: 'Pistola convencional',
    loteA: '3357681', validadeA: '11/2027',
    loteB: '3343296', validadeB: '12/2027',
  },
};

const G = 'Gustavo Moreira';
const E = 'Emerson William de Faria';

export const ETAPAS_748: EtapaPreenchida[] = [
  {
    etapa: 'jateamento',
    ativa: true,
    medicoes: [
      { grandeza: 'padrao_jateamento', especificado: 'SA 2½', encontrado: 'SA 2½', dataInspecao: '2026-04-07', responsavelProcesso: G, responsavelInspecao: E },
      { grandeza: 'grau_intemperismo', especificado: 'A', encontrado: 'A', dataInspecao: '2026-04-07', responsavelProcesso: G, responsavelInspecao: E },
      { grandeza: 'abrasivo', especificado: 'Óx. Al.', encontrado: 'Óx. Al.', dataInspecao: '2026-04-07', responsavelProcesso: G, responsavelInspecao: E },
      { grandeza: 'padrao_rugosidade', especificado: '50-100', encontrado: '70', dataInspecao: '2026-04-07', responsavelProcesso: G, responsavelInspecao: E, instrumentoCodigo: 'RL-01' },
    ],
  },
  {
    etapa: 'fundo',
    ativa: true,
    medicoes: [
      { grandeza: 'camada_umida', especificado: '160', encontrado: '180', dataInspecao: '2026-04-07', responsavelProcesso: G, responsavelInspecao: E, instrumentoCodigo: '232212' },
      { grandeza: 'camada_seca', especificado: '140', encontrado: '156', dataInspecao: '2026-04-08', responsavelProcesso: G, responsavelInspecao: E, instrumentoCodigo: '232212' },
      { grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X0Y0', dataInspecao: '2026-04-08', responsavelProcesso: G, responsavelInspecao: E },
    ],
  },
  {
    etapa: 'intermediario_i',
    ativa: true,
    medicoes: [
      { grandeza: 'camada_umida', especificado: '72', encontrado: '84', dataInspecao: '2026-04-09', responsavelProcesso: G, responsavelInspecao: E, instrumentoCodigo: '232212' },
      { grandeza: 'camada_seca', especificado: '60', encontrado: '66', dataInspecao: '2026-04-10', responsavelProcesso: G, responsavelInspecao: E, instrumentoCodigo: '232212' },
      { grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X0Y0', dataInspecao: '2026-04-10', responsavelProcesso: G, responsavelInspecao: E },
    ],
  },
  // O esquema deste cliente não usa intermediário II nem acabamento — as faixas vieram riscadas
  // no papel. No sistema elas simplesmente não ficam ativas.
  { etapa: 'intermediario_ii', ativa: false, medicoes: [] },
  { etapa: 'acabamento', ativa: false, medicoes: [] },
];
