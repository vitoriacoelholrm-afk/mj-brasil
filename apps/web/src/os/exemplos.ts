// Duas ordens de serviço reais e INDEPENDENTES, transcritas dos documentos.
//
//   OS 748  Consórcio Ápia-Real · Obra Samarco · tubulações
//           Fonte: Plano de Serviço preenchido. Processo completo, 07 a 10/04/2026.
//
//   OS 784  AMC Engenharia · estruturas metálicas
//           Fonte: RIP CAR-01-2026 folha 2. Só existe evidência fotográfica — o medidor
//           mostra 89 µm e a foto do ensaio de aderência está marcada à mão "28/04 AMC/CEMIG".
//           Nenhuma medição foi transcrita para formulário. É o caso incompleto.
//
// São obras diferentes, de clientes diferentes, em datas diferentes. Não se juntam.
import type { EtapaPreenchida } from './regras';

export interface Tinta {
  especificada: string;
  fabricante: string;
  cor: string;
  metodoAplicacao: string;
  loteA: string | null; validadeA: string | null;
  loteB: string | null; validadeB: string | null;
}

export interface ItemOs { descricao: string; quantidade: number; unidade: string }

export interface OrdemServico {
  id: string;
  folio: string;
  cliente: string;
  obra: string | null;
  equipamento: string;
  pintura: 'externa' | 'interna' | 'ambas';
  esquemaPintura: string;
  ripNumero: string | null;
  ripFolha: string | null;
  emitidoPor: string;
  verificadoPor: string;
  /** O que o documento de origem não permite afirmar. */
  observacoes: string[];
  itens: ItemOs[];
  tintas: Partial<Record<string, Tinta>>;
  etapas: EtapaPreenchida[];
}

const EXEC = 'Gustavo Moreira';
const INSP = 'Emerson William de Faria';

/* ══ OS 748 — Consórcio Ápia-Real · Obra Samarco · tubulações ════════════════════════════════
   Plano de Serviço completo. Esquema de duas demãos: intermediário II e acabamento vieram
   riscados no papel, porque o esquema do cliente não os pede.                                  */

const OS_748: OrdemServico = {
  id: 'os-748',
  folio: '748',
  cliente: 'Consórcio Ápia - Real',
  obra: 'Obra Samarco',
  equipamento: 'Tubulações',
  pintura: 'externa',
  esquemaPintura: '5.3.1 do 431572-G-CAR-IT0026 rev.00',
  ripNumero: 'CAR-01-2026',
  ripFolha: '1-2',
  emitidoPor: EXEC,
  verificadoPor: INSP,
  observacoes: [
    'O Plano de Serviço traz OS 748; o RIP CAR-01-2026 folha 1 traz OS 784 — cliente, obra, itens, datas, tintas e espessuras batem em tudo o mais.',
    'Rugosidade: o Plano registra 70 µm (faixa 50-100); o RIP reporta 60 µm para o mesmo jateamento de 07/04.',
  ],
  itens: [
    { descricao: 'Tubo 2"', quantidade: 6, unidade: 'm' },
    { descricao: 'Tubo 12"', quantidade: 24, unidade: 'm' },
    { descricao: 'Tubo 3/4"', quantidade: 6, unidade: 'm' },
    { descricao: 'Tubo 6"', quantidade: 6, unidade: 'm' },
    { descricao: 'Tubo 10"', quantidade: 54, unidade: 'm' },
  ],
  tintas: {
    fundo: {
      especificada: 'Jotamastic 80', fabricante: 'Jotun', cor: 'Cinza N6,5',
      metodoAplicacao: 'Pistola convencional',
      loteA: '2808676', validadeA: 'mai/26', loteB: '2805924', validadeB: 'mai/26',
    },
    intermediario_i: {
      especificada: 'Hardtop XP', fabricante: 'Jotun', cor: 'Verde emblema',
      metodoAplicacao: 'Pistola convencional',
      loteA: '3357681', validadeA: 'dez/27', loteB: '3343296', validadeB: 'nov/27',
    },
  },
  etapas: [
    {
      etapa: 'jateamento', ativa: true, escopo: null,
      medicoes: [
        { grandeza: 'padrao_jateamento', especificado: 'SA 2½', encontrado: 'SA 2½', dataInspecao: '2026-04-07', responsavelProcesso: EXEC, responsavelInspecao: INSP },
        { grandeza: 'grau_intemperismo', especificado: 'A', encontrado: 'A', dataInspecao: '2026-04-07', responsavelProcesso: EXEC, responsavelInspecao: INSP },
        { grandeza: 'abrasivo', especificado: 'Óxido de alumínio fundido marrom', encontrado: 'Óxido de alumínio fundido marrom', dataInspecao: '2026-04-07', responsavelProcesso: EXEC, responsavelInspecao: INSP },
        { grandeza: 'padrao_rugosidade', especificado: '50-100', encontrado: '70', dataInspecao: '2026-04-07', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: 'RL-01' },
      ],
    },
    {
      etapa: 'fundo', ativa: true, escopo: null,
      medicoes: [
        { grandeza: 'camada_umida', especificado: '160', encontrado: '180', dataInspecao: '2026-04-07', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: '232212' },
        { grandeza: 'camada_seca', especificado: '140', encontrado: '156', dataInspecao: '2026-04-08', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: '232212' },
        { grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X0Y0', dataInspecao: '2026-04-08', responsavelProcesso: EXEC, responsavelInspecao: INSP },
      ],
    },
    {
      etapa: 'intermediario_i', ativa: true, escopo: null,
      medicoes: [
        { grandeza: 'camada_umida', especificado: '72', encontrado: '84', dataInspecao: '2026-04-09', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: '232212' },
        { grandeza: 'camada_seca', especificado: '60', encontrado: '66', dataInspecao: '2026-04-10', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: '232212' },
        { grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X0Y0', dataInspecao: '2026-04-10', responsavelProcesso: EXEC, responsavelInspecao: INSP },
      ],
    },
    { etapa: 'intermediario_ii', ativa: false, escopo: null, medicoes: [] },
    { etapa: 'acabamento', ativa: false, escopo: null, medicoes: [] },
  ],
};

/* ══ OS 784 — AMC Engenharia · estruturas metálicas ══════════════════════════════════════════
   O caso incompleto, e o mais instrutivo: o trabalho foi feito e fotografado, mas nenhuma
   medição foi transcrita. O sistema não inventa o que não foi registrado — deixa pendente e
   recusa a liberação.                                                                          */

const OS_784: OrdemServico = {
  id: 'os-784',
  folio: '784',
  cliente: 'AMC Engenharia',
  obra: null, // Obra/Projeto em branco na folha 2
  equipamento: 'Estruturas metálicas',
  pintura: 'externa',
  esquemaPintura: '5.3.1 do 431572-G-CAR-IT0026 rev.00',
  ripNumero: 'CAR-01-2026',
  ripFolha: '2-2',
  emitidoPor: EXEC,
  verificadoPor: INSP,
  observacoes: [
    'A folha 2 do RIP traz só evidência fotográfica. Nenhuma medição foi transcrita para formulário.',
    'A foto do ensaio de aderência está marcada à mão "28/04 AMC/CEMIG" — data e cliente diferentes da folha 1, que corre de 07 a 13/04 para o Consórcio Ápia-Real.',
    'O campo Obra/Projeto está em branco.',
    'O medidor na foto marca 89 µm; a especificação desta obra não consta em documento nenhum que eu tenha.',
  ],
  itens: [],
  tintas: {},
  etapas: [
    {
      etapa: 'jateamento', ativa: true, escopo: null,
      medicoes: [
        { grandeza: 'padrao_jateamento', especificado: 'SA 2½', encontrado: null, dataInspecao: null, responsavelProcesso: null, responsavelInspecao: null },
        { grandeza: 'grau_intemperismo', especificado: null, encontrado: null, dataInspecao: null, responsavelProcesso: null, responsavelInspecao: null },
        { grandeza: 'abrasivo', especificado: null, encontrado: null, dataInspecao: null, responsavelProcesso: null, responsavelInspecao: null },
        { grandeza: 'padrao_rugosidade', especificado: null, encontrado: null, dataInspecao: null, responsavelProcesso: null, responsavelInspecao: null },
      ],
    },
    {
      etapa: 'acabamento', ativa: true, escopo: null,
      medicoes: [
        { grandeza: 'camada_umida', especificado: null, encontrado: null, dataInspecao: null, responsavelProcesso: null, responsavelInspecao: null },
        // O único número que existe: a leitura da foto. Sem especificação, fica pendente.
        { grandeza: 'camada_seca', especificado: null, encontrado: '89', dataInspecao: '2026-04-28', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: '232212' },
        { grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X0Y0', dataInspecao: '2026-04-28', responsavelProcesso: EXEC, responsavelInspecao: INSP },
      ],
    },
    { etapa: 'fundo', ativa: false, escopo: null, medicoes: [] },
    { etapa: 'intermediario_i', ativa: false, escopo: null, medicoes: [] },
    { etapa: 'intermediario_ii', ativa: false, escopo: null, medicoes: [] },
  ],
};

export const ORDENS: OrdemServico[] = [OS_748, OS_784];
