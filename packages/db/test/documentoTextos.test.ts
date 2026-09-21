// O texto dos documentos, contra Postgres de verdade.
//
// O que estes testes guardam: que escrever duas vezes o mesmo documento ATUALIZA em vez de
// duplicar, que o modelo e o cliente não se misturam, e que o texto continua dizendo quem o
// escreveu. Duas versões do mesmo código na mesma lista é exatamente o conflito que este sistema
// inteiro existe para evitar — seria irônico criá-lo aqui.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const HAS_DB = !!process.env.DATABASE_URL && !!process.env.DATABASE_URL_ADMIN;
const ORG = '41713775-0001-4000-8000-000000000091';
const CODIGO = 'ZZ-999';   // fora de qualquer lista real

const ctx = {
  orgId: ORG,
  membershipId: '00000000-0000-4000-9000-000000000001',
  actor: 'member:00000000-0000-4000-9000-000000000001',
  rbacRole: 'admin' as const,
  permissions: new Set(['*']),
};

describe.skipIf(!HAS_DB)('texto de documento (Postgres real)', () => {
  let withTenant: typeof import('../src/chassis/withTenant').withTenant;
  let db: typeof import('../src/index');
  let admin: any;

  beforeAll(async () => {
    ({ withTenant } = await import('../src/chassis/withTenant'));
    db = await import('../src/index');
    const { _raw } = await import('../src/client');
    admin = _raw.adminSql();
    await admin`delete from documento_textos where codigo = ${CODIGO}`;
  });

  afterAll(async () => {
    if (admin) await admin`delete from documento_textos where codigo = ${CODIGO}`;
  });

  const salvar = (perfil: string, texto: string, quem: string | null = 'Ana Ribeiro') =>
    withTenant(ORG, (tx) => db.salvarTexto(tx as any, ctx as any, {
      perfil, codigo: CODIGO, texto, atualizadoPorNome: quem,
    } as any));

  const ler = async (perfil: string) => {
    const { rows } = await withTenant(ORG, (tx) =>
      db.listarTextos(tx as any, ctx as any, { perfil } as any)) as any;
    return rows.find((r: any) => r.codigo === CODIGO) ?? null;
  };

  it('escreve e lê de volta, com o autor junto', async () => {
    await salvar('modelo', 'O escopo do sistema abrange o tratamento de superfície.');
    const lido = await ler('modelo');
    expect(lido.texto).toBe('O escopo do sistema abrange o tratamento de superfície.');
    expect(lido.atualizado_por_nome).toBe('Ana Ribeiro');
  });

  it('escrever de novo ATUALIZA — não cria um segundo documento com o mesmo código', async () => {
    await salvar('modelo', 'Versão dois, corrigida.');
    const { rows } = await withTenant(ORG, (tx) =>
      db.listarTextos(tx as any, ctx as any, { perfil: 'modelo' } as any)) as any;
    expect(rows.filter((r: any) => r.codigo === CODIGO)).toHaveLength(1);
    expect((await ler('modelo')).texto).toBe('Versão dois, corrigida.');
  });

  it('o modelo e o cliente não se misturam, mesmo com o mesmo código', async () => {
    // Enquanto a entrada resolve uma organização só, os dois perfis convivem sob o mesmo org_id.
    // Se o perfil não separasse, escrever o modelo sobrescreveria o documento do cliente.
    await salvar('minasjato', 'O texto da empresa atendida, que é outro.');
    expect((await ler('modelo')).texto).toBe('Versão dois, corrigida.');
    expect((await ler('minasjato')).texto).toBe('O texto da empresa atendida, que é outro.');
  });

  it('texto em branco é um valor, e não some', async () => {
    // Apagar o conteúdo é uma decisão. Tratar vazio como "nunca escrito" faria o documento voltar
    // a parecer intocado, e o rascunho antigo reaparecer na próxima leitura.
    await salvar('modelo', '');
    expect((await ler('modelo')).texto).toBe('');
  });

  it('sem permissão de escrita, não grava', async () => {
    const semNada = { ...ctx, rbacRole: 'employee' as const, permissions: new Set<string>() };
    await expect(withTenant(ORG, (tx) => db.salvarTexto(tx as any, semNada as any, {
      perfil: 'modelo', codigo: CODIGO, texto: 'x',
    } as any))).rejects.toThrow(/registro.write/);
  });
});
