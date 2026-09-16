// A API de mentira do modo demonstração.
//
// As telas de Situação, Vencimentos, Instrumentos e Clientes falam com o servidor por tRPC. Numa
// página estática não há servidor, e sem isto elas abririam em erro — o revisor veria uma tela
// quebrada antes de chegar no que interessa.
//
// Então o modo demo troca o cliente tRPC por este, que devolve os mesmos formatos a partir de
// dados fixos. É só LEITURA: qualquer mutação avisa que a demo não grava.
//
// Os valores aqui são os de verdade da empresa atendida. Quem anonimiza é o plugin de build
// (`VITE_DEMO=1`), que reescreve os textos no pacote gerado — ver `demo/anonimizar.ts`.

const HOJE = '2026-09-16';

const ATIVOS = [
  { id: 'i1', code: '232212', name: 'Medidor de camada seca MCT-401', area: 'Lab. Qualidade', lifecycle_status: 'active', health_status: 'ok' },
  { id: 'i2', code: 'RL-01', name: 'Rugosímetro Medtec', area: 'Lab. Qualidade', lifecycle_status: 'active', health_status: 'ok' },
  { id: 'i3', code: 'TH-003', name: 'Termo-higrômetro MT-241A', area: 'Produção', lifecycle_status: 'active', health_status: 'ok' },
  { id: 'i4', code: 'TEV-04', name: 'Termômetro laser Hikari', area: 'Produção', lifecycle_status: 'active', health_status: 'ok' },
];

const CALIBRACOES = [
  { id: 'c1', holder_id: 'i1', holder_kind: 'asset', holder_label: '232212 — Medidor de camada seca', kind: 'calibracao', title: 'Calibração', number: '171032', expires_at: '2027-03-24', status: 'valid', bucket: 'later' },
  { id: 'c2', holder_id: 'i2', holder_kind: 'asset', holder_label: 'RL-01 — Rugosímetro', kind: 'calibracao', title: 'Calibração', number: 'M008200/2026', expires_at: '2027-03-23', status: 'valid', bucket: 'later' },
  { id: 'c3', holder_id: 'i3', holder_kind: 'asset', holder_label: 'TH-003 — Termo-higrômetro', kind: 'calibracao', title: 'Calibração', number: 'M007787/2026', expires_at: '2027-03-18', status: 'valid', bucket: 'later' },
  { id: 'c4', holder_id: 'i4', holder_kind: 'asset', holder_label: 'TEV-04 — Termômetro laser', kind: 'calibracao', title: 'Calibração', number: 'M007811/2026', expires_at: '2027-03-28', status: 'valid', bucket: 'later' },
  { id: 'c5', holder_id: null, holder_kind: 'person', holder_label: 'Emerson William de Faria', kind: 'certificacao_inspetor', title: 'Inspetor de Pintura N1 — SNQC-CP', number: null, expires_at: '2027-05-30', status: 'valid', bucket: 'later' },
];

const CLIENTES = [
  { id: 'k1', name: 'WEIR do Brasil Ltda', type: 'commercial', tax_id: null, email: null, phone: null, payment_terms_days: 30, status: 'active' },
  { id: 'k2', name: 'Consórcio Ápia - Real', type: 'commercial', tax_id: null, email: null, phone: null, payment_terms_days: 30, status: 'active' },
  { id: 'k3', name: 'AMC Engenharia', type: 'commercial', tax_id: null, email: null, phone: null, payment_terms_days: 30, status: 'active' },
];

const PAINEL = {
  buckets: { expired: [], d7: [], d15: [], d30: [], later: CALIBRACOES },
  counts: { expired: 0, d7: 0, d15: 0, d30: 0, later: CALIBRACOES.length },
};

const RESPOSTAS: Record<string, unknown> = {
  'equipment-maintenance.listAssets': { rows: ATIVOS },
  'compliance-certifications.listCredentials': { rows: CALIBRACOES.filter((c) => c.kind === 'calibracao') },
  'compliance-certifications.vencimientosBoard': PAINEL,
  'customer-management.listCustomers': { rows: CLIENTES },
};

/** Um objeto que se parece com o cliente tRPC o bastante para as telas não notarem. */
export const apiDemo = new Proxy({} as Record<string, unknown>, {
  get: (_alvo, modulo: string) => new Proxy({} as Record<string, unknown>, {
    get: (_a, procedimento: string) => ({
      query: async () => RESPOSTAS[`${modulo}.${procedimento}`] ?? { rows: [] },
      mutate: async () => {
        throw new Error('Esta é uma demonstração: as telas ligadas ao banco são só de leitura aqui.');
      },
    }),
  }),
});

export { HOJE };
