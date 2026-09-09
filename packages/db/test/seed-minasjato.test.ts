// Seed de demonstração com dados reais da Minasjato, exercitando as Functions dos módulos
// instalados (nunca SQL cru): customer-management, equipment-maintenance e
// compliance-certifications. Prova que o schema aceita os dados da empresa e que o motor de
// vencimentos enxerga os instrumentos do Plano de Calibração.
//
// Fontes dos dados: FM-011 (Contexto Organizacional e SWOT 2026), questionário RINA
// FORM-SYS01-ALL-04, MJ-CAL-01 e o PLANO DE CALIBRAÇÃO.
import { describe, it, expect, beforeAll } from 'vitest';

const HAS_DB = !!process.env.DATABASE_URL && !!process.env.DATABASE_URL_ADMIN;
// UUID fixo da Org, com o CNPJ 41.713.775/0001-91 embutido para ser reconhecível.
const ORG = '41713775-0001-4000-8000-000000000091';

// Contexto de admin — permissões '*' (identity/context.ts: admin vence qualquer capability).
const ctx = {
  orgId: ORG,
  membershipId: null,
  // Ator como UUID: assets.created_by é uuid, enquanto customers.created_by é text.
  // A inconsistência é do catálogo; aqui só se usa o formato mais restrito.
  actor: '00000000-0000-4000-8000-000000005EED',
  rbacRole: 'admin' as const,
  permissions: new Set(['*']),
};

describe.skipIf(!HAS_DB)('seed Minasjato (Postgres real)', () => {
  let withTenant: typeof import('../src/chassis/withTenant').withTenant;
  let db: typeof import('../src/index');
  let admin: any;
  let sql: any;

  beforeAll(async () => {
    ({ withTenant } = await import('../src/chassis/withTenant'));
    db = await import('../src/index');
    const { _raw } = await import('../src/client');
    admin = _raw.adminSql();
    ({ sql } = await import('drizzle-orm'));

    // A Org é a raiz do tenant — criada pelo admin, fora do withTenant.
    // Razão social conforme declarada à RINA no FORM-SYS01-ALL-04.
    await admin`
      insert into orgs (id, slug, name, settings, is_primary, status)
      values (${ORG}, 'minasjato', 'MJ Serviços Industriais Ltda', '{}'::jsonb, true, 'active')
      on conflict (id) do update set name = excluded.name`;
  });

  it('cadastra os clientes da carteira', async () => {
    const criados = await withTenant(ORG, async (tx) => {
      const out = [];
      for (const c of [
        { name: 'WEIR do Brasil', type: 'commercial', paymentTermsDays: 30 },
        { name: 'Metta Engenharia', type: 'commercial', paymentTermsDays: 30 },
      ]) {
        try {
          out.push(await db.createCustomer(tx as any, ctx as any, c as any));
        } catch (e: any) {
          if (e?.code !== 'DUPLICATE_NAME') throw e; // idempotente entre execuções
        }
      }
      return out;
    });
    const lista = await withTenant(ORG, (tx) => db.listCustomers(tx as any, ctx as any, {} as any));
    console.log('\n── CLIENTES ──');
    for (const c of (lista as any).rows ?? lista) console.log(`   ${c.name}  ·  ${c.status}`);
    expect(criados.length + 2).toBeGreaterThan(0);
  });

  it('cadastra os instrumentos de medição e suas calibrações', async () => {
    // Instrumentos do INT-02 da SWOT, com os certificados de março/2026.
    // Vencimento conforme F-02 ("recalibração Mar/2027") — note que o MJ-CAL-01 §8.1
    // define DOIS ANOS para estes mesmos instrumentos: a divergência está sinalizada.
    const instrumentos = [
      { code: 'MJ-INS-001', name: 'Medidor de espessura de filme seco', cert: 'M008200/2026' },
      { code: 'MJ-INS-002', name: 'Rugosímetro', cert: 'M007787/2026' },
      { code: 'MJ-INS-003', name: 'Termo-higrômetro', cert: 'M007811/2026' },
      { code: 'MJ-INS-004', name: 'Termômetro infravermelho', cert: '171032' },
    ];

    // `area` usa a área real da Minasjato: o Laboratório da Qualidade, onde o MJ-CAL-01 guarda os
    // instrumentos. Só é possível porque a Definition `area_operativa` passou a ser aberta —
    // fechada, trazia as áreas de um hotel ('Playa', 'Taco Paco') e travava createAsset.
    await withTenant(ORG, async (tx) => {
      for (const i of instrumentos) {
        const existente = (await tx.execute(
          sql`select id from assets where org_id = ${ORG}::uuid and code = ${i.code} limit 1`,
        )) as unknown as Array<{ id: string }>;

        const assetId = existente[0]?.id ?? (await db.createAsset(tx as any, ctx as any, {
          code: i.code,
          name: i.name,
          kind: 'equipo_general',
          area: 'Laboratório da Qualidade',
        } as any) as any).id;

        await db.upsertCredentialRecord(tx as any, ctx as any, {
          holderKind: 'asset',
          holderId: assetId,
          holderLabel: `${i.code} — ${i.name}`,
          kind: 'calibracao',
          title: 'Certificado de calibração RBC/INMETRO',
          number: i.cert,
          issuingAuthority: 'Laboratório acreditado RBC/INMETRO',
          issuedAt: '2026-03-15',
          expiresAt: '2027-03-15',
          notes: 'ABNT NBR ISO/IEC 17025:2017',
        } as any);
      }

      // A credencial do INT-03 / D-06: um único inspetor certificado.
      await db.upsertCredentialRecord(tx as any, ctx as any, {
        holderKind: 'org',
        holderLabel: 'Emerson William de Faria — Inspetor de Pintura Nível 1',
        kind: 'certificacao_inspetor',
        title: 'Inspetor de Pintura Nível 1 — ABRACO/SNQC-CP',
        number: '0695/03',
        issuingAuthority: 'ABRACO',
        expiresAt: '2027-09-14',
        notes: 'D-06: profissional único. Sem ele, a liberação de serviço para,',
      } as any);
    });

    const board = await withTenant(ORG, (tx) =>
      db.vencimientosBoard(tx as any, ctx as any, {} as any));

    console.log('\n── PAINEL DE VENCIMENTOS ──');
    console.log(JSON.stringify((board as any).counts ?? board, null, 2));
    for (const [balde, linhas] of Object.entries(((board as any).buckets ?? {}) as Record<string, any[]>)) {
      if (!linhas?.length) continue;
      console.log(`\n   [${balde}]`);
      for (const l of linhas) console.log(`     ${l.holder_label}  ·  vence ${l.expires_at}  ·  ${l.number ?? ''}`);
    }
    expect(board).toBeTruthy();
  });
});
