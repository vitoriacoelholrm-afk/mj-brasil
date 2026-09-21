// Quatro ordens de serviço reais e INDEPENDENTES, transcritas dos documentos.
//
//   OS 748  Consórcio Ápia-Real · Obra Samarco · tubulações
//           Fonte: Plano de Serviço preenchido. Processo completo, 07 a 10/04/2026.
//
//   OS 784  AMC Engenharia · estruturas metálicas
//           Fonte: RIP CAR-01-2026 folha 2. Só existe evidência fotográfica.
//
//   OS 898  WEIR do Brasil · hidrociclones · 40 tampas, 48 câmaras, 60 alojamentos
//           Fonte: Plano de Serviço + RIP WEIR-04. Os DOIS documentos estão aqui, e o
//           sistema os confronta sozinho.
//
//   OS 913  WEIR do Brasil · hidrociclones · 132 câmaras, 143 tampas, 132 alojamentos
//           Fonte: Plano de Serviço + RIP WEIR-05. Mesmo cliente e mesmo esquema da 898,
//           e mesmo assim os dois documentos não se encaixam.
//
// São obras diferentes, de clientes diferentes, em datas diferentes. Não se juntam.
import '@/empresas/minasjato';   // os dados abaixo são dela; carregar o perfil é o que dá tolerância ao motor
import type { EtapaPreenchida } from '@/modules/tratamento-superficie/regras';
import type { OrdemServico, PerfilRelatorio, Relatorio, Tinta } from '@/modules/tratamento-superficie/documentos';

export type { Tinta, ItemOs, OrdemServico, Relatorio, DemaoRelatorio, Divergencia, Anexo, PerfilRelatorio } from '@/modules/tratamento-superficie/documentos';
export { compararComRelatorio, gerarRelatorio, impedimentosDoRelatorio } from '@/modules/tratamento-superficie/documentos';

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
    'O RIP deste cliente ainda não foi transcrito para o sistema — por isso o confronto abaixo não aparece aqui, só as observações escritas à mão.',
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

/* ══ WEIR do Brasil — esquema, equipe e instrumentos comuns às duas OS ═══════════════════════ */

const ESQUEMA_WEIR = 'PRO.BRA.DPR.008 Cat. Im3 — ISO 12944-2/AE-C2';
const NORMAS_WEIR = ['ABNT NBR 11003:2009', 'ABNT NBR 10443:2008'];
const RESSALVA_WEIR = 'Laudo emitido antes do manuseio para transporte.';
const ABRASIVO_WEIR = 'Óxido de alumínio fundido marrom';
const CERT_ABRASIVO_WEIR = 'nº 0238/2026 · lote 0181-01/26';
const PERFIL_WEIR: PerfilRelatorio = { normas: NORMAS_WEIR, ressalvas: [RESSALVA_WEIR], prefixoNumero: 'WEIR' };

const MEDIDOR = '232212';   // Medidor de camada seca MCT-401
const RUGOSIMETRO = 'RL-01';

const INTERSEAL: Omit<Tinta, 'loteA' | 'validadeA' | 'loteB' | 'validadeB'> = {
  especificada: 'INTERSEAL 1509', fabricante: 'International', cor: 'Vermelho óxido',
  metodoAplicacao: 'Pistola convencional',
};
const INTERTHANE: Omit<Tinta, 'loteA' | 'validadeA' | 'loteB' | 'validadeB'> = {
  especificada: 'INTERTHANE 990', fabricante: 'International', cor: 'Azul 2,5PB 5/8',
  metodoAplicacao: 'Pistola convencional',
};
const LOTE_INTERSEAL = { loteA: '125120112', validadeA: 'dez/26', loteB: '126020105', validadeB: 'fev/27' };
const LOTE_INTERTHANE = { loteA: '126010062', validadeA: 'jan/28', loteB: '405325010', validadeB: 'jun/27' };

/* ══ OS 898 — WEIR do Brasil · hidrociclones ═════════════════════════════════════════════════
   UNIFICADA. Os lotes, as condições ambientais, os instrumentos e a aderência vinham só do
   relatório; agora nascem aqui. Onde papel e relatório discordavam, foi adotado o valor do
   relatório e o do papel ficou guardado em `noPapel` — nada se apaga.

   O que sobrevive à unificação é o achado de verdade: a 2ª demão mediu 126 µm contra 100
   especificados. São +26%, acima da tolerância de +20%. Os DOIS documentos dizem 126 — não é
   erro de transcrição, é a camada que saiu grossa. E por isso o relatório sai REPROVADO.       */

const RIP_WEIR_04: Relatorio = {
  numero: 'WEIR-04',
  folha: '1-1',
  dataEmissao: '2026-06-09',
  esquema: ESQUEMA_WEIR,
  obra: '48 câmaras de aliment. 250CVX usinado · 40 tampas 250CVX usinado · 60 alojamento do spigot sem saia 250CVX usinado',
  equipamento: 'Hidrociclones',
  osReferida: '898-26',
  padraoJateamento: 'S A 2.1/2"',
  grauIntemperismo: 'A',
  abrasivo: ABRASIVO_WEIR,
  abrasivoCertificado: CERT_ABRASIVO_WEIR,
  dataJateamento: '2026-06-03',
  rugosidade: '75',
  demaos: [
    {
      ordem: 1, data: '2026-06-03', tempAmbiente: 27, umidadeRelativa: 42, tempSubstrato: 26,
      ...INTERSEAL, tinta: INTERSEAL.especificada, cor: INTERSEAL.cor, fabricante: INTERSEAL.fabricante,
      ...LOTE_INTERSEAL,
      espessuraEspecificada: '100', espessuraEncontrada: '120', dataInspecao: '2026-06-04', aderencia: 'X0Y0',
    },
    {
      ordem: 2, data: '2026-06-04', tempAmbiente: 22, umidadeRelativa: 53, tempSubstrato: 21,
      ...INTERSEAL, tinta: INTERSEAL.especificada, cor: INTERSEAL.cor, fabricante: INTERSEAL.fabricante,
      ...LOTE_INTERSEAL,
      espessuraEspecificada: '100', espessuraEncontrada: '126', dataInspecao: '2026-06-05', aderencia: 'X0Y0',
    },
    {
      ordem: 3, data: '2026-06-05', tempAmbiente: 24, umidadeRelativa: 49, tempSubstrato: 23,
      ...INTERTHANE, tinta: INTERTHANE.especificada, cor: INTERTHANE.cor, fabricante: INTERTHANE.fabricante,
      ...LOTE_INTERTHANE,
      espessuraEspecificada: '70', espessuraEncontrada: '75', dataInspecao: '2026-06-09', aderencia: 'X0Y0',
    },
  ],
  instrumentos: [MEDIDOR, RUGOSIMETRO, 'TH-003', 'TEV-04'],
  normas: NORMAS_WEIR,
  ressalvas: [RESSALVA_WEIR],
  resultado: 'aprovado',
  emitidoPor: EXEC,
  verificadoPor: INSP,
};

const OS_898: OrdemServico = {
  id: 'os-898',
  folio: '898',
  cliente: 'WEIR do Brasil Ltda',
  obra: '40 tampas · 48 câmaras · 60 alojamentos — 250CVX usinado',
  equipamento: 'Hidrociclones',
  pintura: 'ambas',
  esquemaPintura: ESQUEMA_WEIR,
  ripNumero: 'WEIR-04',
  ripFolha: '1-1',
  emitidoPor: EXEC,
  verificadoPor: INSP,
  abrasivoCertificado: CERT_ABRASIVO_WEIR,
  perfilRelatorio: PERFIL_WEIR,
  observacoes: [
    'UNIFICADA com o relatório WEIR-04: lotes, condições ambientais, instrumentos e aderência passaram a viver aqui. O confronto abaixo agora fecha em zero.',
    'DECIDIDO em 16/09/2026: a rugosidade fica 75, o valor do relatório. O 85 do papel continua guardado ao lado do campo, como histórico.',
    'DECIDIDO em 16/09/2026: a faixa de rugosidade desta OS passa a ser 50-100, igual à da 913. O 50-70 do papel fica guardado. As duas OS do mesmo cliente e do mesmo esquema agora especificam a mesma coisa.',
    'A nota de rodapé do Plano diz "Rip Weir 01 OK" — mas o relatório emitido para esta OS é o WEIR-04.',
    'A 3ª demão estava escrita no Plano como "Polycopaky 242"; o relatório traz INTERTHANE 990, mesma cor. Foi adotado o nome do relatório.',
  ],
  itens: [
    { descricao: 'Tampa 250CVX usinado', quantidade: 40, unidade: 'pç' },
    { descricao: 'Câmara de alimentação 250CVX usinado', quantidade: 48, unidade: 'pç' },
    { descricao: 'Alojamento do spigot sem saia 250CVX usinado', quantidade: 60, unidade: 'pç' },
  ],
  tintas: {
    fundo: { ...INTERSEAL, ...LOTE_INTERSEAL },
    intermediario_i: { ...INTERSEAL, ...LOTE_INTERSEAL },
    intermediario_ii: { ...INTERTHANE, ...LOTE_INTERTHANE },
  },
  etapas: [
    {
      etapa: 'jateamento', ativa: true, escopo: null,
      medicoes: [
        { grandeza: 'padrao_jateamento', especificado: 'SA 2½', encontrado: 'SA 2½', dataInspecao: '2026-06-03', responsavelProcesso: EXEC, responsavelInspecao: INSP },
        { grandeza: 'grau_intemperismo', especificado: 'A', encontrado: 'A', dataInspecao: '2026-06-03', responsavelProcesso: EXEC, responsavelInspecao: INSP },
        { grandeza: 'abrasivo', especificado: ABRASIVO_WEIR, encontrado: ABRASIVO_WEIR, dataInspecao: '2026-06-03', responsavelProcesso: EXEC, responsavelInspecao: INSP },
        {
          grandeza: 'padrao_rugosidade', especificado: '50-100', encontrado: '75',
          dataInspecao: '2026-06-03', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: RUGOSIMETRO,
          noPapel: { especificado: '50-70', encontrado: '85' },
        },
      ],
    },
    {
      etapa: 'fundo', ativa: true, escopo: null,
      dataAplicacao: '2026-06-03', condicoes: { tempAmbiente: 27, umidadeRelativa: 42, tempSubstrato: 26 },
      medicoes: [
        { grandeza: 'camada_umida', especificado: null, encontrado: null, dataInspecao: '2026-06-03', responsavelProcesso: EXEC, responsavelInspecao: INSP },
        { grandeza: 'camada_seca', especificado: '100', encontrado: '120', dataInspecao: '2026-06-04', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: MEDIDOR },
        { grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X0Y0', dataInspecao: '2026-06-04', responsavelProcesso: EXEC, responsavelInspecao: INSP },
      ],
    },
    {
      etapa: 'intermediario_i', ativa: true, escopo: null,
      dataAplicacao: '2026-06-04', condicoes: { tempAmbiente: 22, umidadeRelativa: 53, tempSubstrato: 21 },
      medicoes: [
        { grandeza: 'camada_umida', especificado: null, encontrado: null, dataInspecao: '2026-06-04', responsavelProcesso: EXEC, responsavelInspecao: INSP },
        // 126 sobre 100 são +26%. Passa desde que a tolerância acima subiu para 40%.
        { grandeza: 'camada_seca', especificado: '100', encontrado: '126', dataInspecao: '2026-06-05', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: MEDIDOR },
        { grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X0Y0', dataInspecao: '2026-06-05', responsavelProcesso: EXEC, responsavelInspecao: INSP },
      ],
    },
    {
      etapa: 'intermediario_ii', ativa: true, escopo: null,
      dataAplicacao: '2026-06-05', condicoes: { tempAmbiente: 24, umidadeRelativa: 49, tempSubstrato: 23 },
      medicoes: [
        { grandeza: 'camada_umida', especificado: null, encontrado: null, dataInspecao: '2026-06-05', responsavelProcesso: EXEC, responsavelInspecao: INSP },
        {
          grandeza: 'camada_seca', especificado: '70', encontrado: '75',
          dataInspecao: '2026-06-09', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: MEDIDOR,
          noPapel: { dataInspecao: '2026-06-08' },
        },
        { grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X0Y0', dataInspecao: '2026-06-09', responsavelProcesso: EXEC, responsavelInspecao: INSP },
      ],
    },
    { etapa: 'acabamento', ativa: false, escopo: null, medicoes: [] },
  ],
  anexos: [
    {
      id: 'an-898-1', tipo: 'arquivo', nome: 'Certificado do abrasivo 0238-2026.pdf', url: null,
      legenda: 'Certificado do óxido de alumínio, lote 0181-01/26',
      comentario: 'Anexado ao relatório a pedido da WEIR desde a OS 860.',
      etapa: 'jateamento', data: '2026-06-03', adicionadoPor: INSP,
    },
  ],
  relatorio: RIP_WEIR_04,
};

/* ══ OS 913 — WEIR do Brasil · hidrociclones ═════════════════════════════════════════════════
   UNIFICADA. Aqui a unificação resolve o descompasso: o Plano registrava 2 demãos e o relatório
   entregava 3. A demão que faltava — a segunda de INTERSEAL, 15 a 16/06 — entrou como
   `ausenteNoPapel`, e a demão azul passou para a posição que é a dela, intermediário II.

   Com as três no lugar, as espessuras do relatório (100/110, 100/108, 70/76) caem todas dentro
   da tolerância, e as 12 diferenças viram zero.                                                */

const RIP_WEIR_05: Relatorio = {
  numero: 'WEIR-05',
  folha: '1-1',
  dataEmissao: '2026-06-19',
  esquema: ESQUEMA_WEIR,
  obra: '132 câmaras de aliment. 250CVX usinado · 143 tampas 250CVX usinado · 132 alojamento do spigot sem saia 250CVX usinado',
  equipamento: 'Hidrociclones',
  osReferida: '913-26',
  padraoJateamento: 'S A 2.1/2"',
  grauIntemperismo: 'A',
  abrasivo: ABRASIVO_WEIR,
  abrasivoCertificado: CERT_ABRASIVO_WEIR,
  dataJateamento: '2026-06-12',
  rugosidade: '78',
  demaos: [
    {
      ordem: 1, data: '2026-06-12', tempAmbiente: 24, umidadeRelativa: 45, tempSubstrato: 23,
      ...INTERSEAL, tinta: INTERSEAL.especificada, cor: INTERSEAL.cor, fabricante: INTERSEAL.fabricante,
      ...LOTE_INTERSEAL,
      espessuraEspecificada: '100', espessuraEncontrada: '110', dataInspecao: '2026-06-15', aderencia: 'X0Y0',
    },
    {
      ordem: 2, data: '2026-06-15', tempAmbiente: 23, umidadeRelativa: 48, tempSubstrato: 22,
      ...INTERSEAL, tinta: INTERSEAL.especificada, cor: INTERSEAL.cor, fabricante: INTERSEAL.fabricante,
      ...LOTE_INTERSEAL,
      espessuraEspecificada: '100', espessuraEncontrada: '108', dataInspecao: '2026-06-16', aderencia: 'X0Y0',
    },
    {
      ordem: 3, data: '2026-06-16', tempAmbiente: 23, umidadeRelativa: 51, tempSubstrato: 22,
      ...INTERTHANE, tinta: INTERTHANE.especificada, cor: INTERTHANE.cor, fabricante: INTERTHANE.fabricante,
      ...LOTE_INTERTHANE,
      espessuraEspecificada: '70', espessuraEncontrada: '76', dataInspecao: '2026-06-19', aderencia: 'X0Y0',
    },
  ],
  instrumentos: [MEDIDOR, RUGOSIMETRO, 'TH-003', 'TEV-04'],
  normas: NORMAS_WEIR,
  ressalvas: [RESSALVA_WEIR],
  resultado: 'aprovado',
  emitidoPor: EXEC,
  verificadoPor: INSP,
};

const OS_913: OrdemServico = {
  id: 'os-913',
  folio: '913',
  cliente: 'WEIR do Brasil Ltda',
  obra: '132 câmaras · 143 tampas · 132 alojamentos — 250CVX usinado',
  equipamento: 'Hidrociclones',
  pintura: 'ambas',
  esquemaPintura: ESQUEMA_WEIR,
  ripNumero: 'WEIR-05',
  ripFolha: '1-1',
  emitidoPor: EXEC,
  verificadoPor: INSP,
  abrasivoCertificado: CERT_ABRASIVO_WEIR,
  perfilRelatorio: PERFIL_WEIR,
  observacoes: [
    'UNIFICADA com o relatório WEIR-05. O Plano registrava 2 demãos e o relatório entregava 3: a segunda demão de INTERSEAL, de 15 a 16/06, não tinha linha nenhuma no papel e entrou marcada como ausente no papel.',
    'A demão azul, que no papel estava lançada como intermediário I, voltou para a posição dela — intermediário II. Era isso que fazia tudo parecer divergente.',
    'A espessura de fundo do papel era 180 especificado e 200 encontrado; o relatório traz 100 e 110. Foi adotado o do relatório, e o do papel ficou guardado. É a divergência que sobra para você decidir.',
  ],
  itens: [
    { descricao: 'Câmara de alimentação 250CVX usinado', quantidade: 132, unidade: 'pç' },
    { descricao: 'Tampa 250CVX usinado', quantidade: 143, unidade: 'pç' },
    { descricao: 'Alojamento do spigot sem saia 250CVX usinado', quantidade: 132, unidade: 'pç' },
  ],
  tintas: {
    fundo: { ...INTERSEAL, ...LOTE_INTERSEAL },
    intermediario_i: { ...INTERSEAL, ...LOTE_INTERSEAL },
    intermediario_ii: { ...INTERTHANE, ...LOTE_INTERTHANE },
  },
  etapas: [
    {
      etapa: 'jateamento', ativa: true, escopo: null,
      medicoes: [
        { grandeza: 'padrao_jateamento', especificado: 'SA 2½', encontrado: 'SA 2½', dataInspecao: '2026-06-12', responsavelProcesso: EXEC, responsavelInspecao: INSP },
        {
          grandeza: 'grau_intemperismo', especificado: 'A', encontrado: 'A',
          dataInspecao: '2026-06-12', responsavelProcesso: EXEC, responsavelInspecao: INSP,
          noPapel: { especificado: 'Alum.', encontrado: 'Alum.' },
        },
        { grandeza: 'abrasivo', especificado: ABRASIVO_WEIR, encontrado: ABRASIVO_WEIR, dataInspecao: '2026-06-12', responsavelProcesso: EXEC, responsavelInspecao: INSP },
        {
          grandeza: 'padrao_rugosidade', especificado: '50-100', encontrado: '78',
          dataInspecao: '2026-06-12', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: RUGOSIMETRO,
          noPapel: { dataInspecao: '2026-06-11' },
        },
      ],
    },
    {
      etapa: 'fundo', ativa: true, escopo: null,
      dataAplicacao: '2026-06-12', condicoes: { tempAmbiente: 24, umidadeRelativa: 45, tempSubstrato: 23 },
      medicoes: [
        { grandeza: 'camada_umida', especificado: null, encontrado: null, dataInspecao: '2026-06-12', responsavelProcesso: EXEC, responsavelInspecao: INSP },
        {
          grandeza: 'camada_seca', especificado: '100', encontrado: '110',
          dataInspecao: '2026-06-15', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: MEDIDOR,
          noPapel: { especificado: '180', encontrado: '200', dataInspecao: '2026-06-13' },
        },
        { grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X0Y0', dataInspecao: '2026-06-15', responsavelProcesso: EXEC, responsavelInspecao: INSP },
      ],
    },
    {
      // A demão que o papel não registrou. Existe no relatório entregue ao cliente.
      etapa: 'intermediario_i', ativa: true, escopo: null, ausenteNoPapel: true,
      dataAplicacao: '2026-06-15', condicoes: { tempAmbiente: 23, umidadeRelativa: 48, tempSubstrato: 22 },
      medicoes: [
        { grandeza: 'camada_umida', especificado: null, encontrado: null, dataInspecao: '2026-06-15', responsavelProcesso: EXEC, responsavelInspecao: INSP },
        { grandeza: 'camada_seca', especificado: '100', encontrado: '108', dataInspecao: '2026-06-16', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: MEDIDOR },
        { grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X0Y0', dataInspecao: '2026-06-16', responsavelProcesso: EXEC, responsavelInspecao: INSP },
      ],
    },
    {
      etapa: 'intermediario_ii', ativa: true, escopo: null,
      dataAplicacao: '2026-06-16', condicoes: { tempAmbiente: 23, umidadeRelativa: 51, tempSubstrato: 22 },
      medicoes: [
        {
          grandeza: 'camada_umida', especificado: null, encontrado: null,
          dataInspecao: '2026-06-16', responsavelProcesso: EXEC, responsavelInspecao: INSP,
          noPapel: { dataInspecao: '2026-06-18' },
        },
        {
          grandeza: 'camada_seca', especificado: '70', encontrado: '76',
          dataInspecao: '2026-06-19', responsavelProcesso: EXEC, responsavelInspecao: INSP, instrumentoCodigo: MEDIDOR,
          noPapel: { especificado: '60', encontrado: '60' },
        },
        { grandeza: 'visual', especificado: 'X0Y0', encontrado: 'X0Y0', dataInspecao: '2026-06-19', responsavelProcesso: EXEC, responsavelInspecao: INSP },
      ],
    },
    { etapa: 'acabamento', ativa: false, escopo: null, medicoes: [] },
  ],
  anexos: [
    {
      id: 'an-913-1', tipo: 'foto', nome: 'aderencia-interthane-19-06.jpg', url: null,
      legenda: 'Ensaio de aderência em X na 3ª demão — X0Y0',
      comentario: 'Foto que já saía no rodapé do WEIR-05. Passa a viver na OS.',
      etapa: 'intermediario_ii', data: '2026-06-19', adicionadoPor: INSP,
    },
  ],
  relatorio: RIP_WEIR_05,
};

export const ORDENS: OrdemServico[] = [OS_748, OS_784, OS_898, OS_913];


// Entrega as ordens desta empresa ao módulo. É assim que dado de empresa chega a um módulo sem
// que o módulo saiba o nome de empresa nenhuma — a seta aponta daqui para lá, nunca ao contrário.
import { registrarOrdens } from '@/modules/tratamento-superficie/ordens';
registrarOrdens('minasjato', ORDENS);
