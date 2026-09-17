// Os registros do sistema da qualidade, contra Postgres de verdade.
//
// O que estes testes guardam não é o CRUD — é o que a norma cobra do banco: que o registro não
// suma, que ele continue dizendo quem o assinou, que a prova venha junto, e que o registro de uma
// empresa não apareça na tela da outra. Cada um deles já deu errado em algum sistema.
//
// Pula limpo sem banco configurado, como as demais suítes do chassi.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const HAS_DB = !!process.env.DATABASE_URL && !!process.env.DATABASE_URL_ADMIN;

// Duas empresas: a atendida e uma vizinha, que serve só para provar que não se enxergam.
const UMA = '41713775-0001-4000-8000-000000000091';
const OUTRA = '00000000-0000-4000-8000-0000000000fe';
const MARCA = 'test.registros.vitest';

// Um JPEG mínimo de verdade — o menor arquivo que ainda é uma imagem.
const FOTO = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwc' +
  'KDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAA' +
  'AAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==',
  'base64',
);

describe.skipIf(!HAS_DB)('registros do SGQ (Postgres real)', () => {
  let withTenant: typeof import('../src/chassis/withTenant').withTenant;
  let admin: any;
  let appRaw: any;
  let sql: any;

  const carga = (valores: Record<string, string>) => ({ ...valores, marca: MARCA });

  /** Grava um registro e devolve o id. Cru de propósito: o que está sob teste é a tabela. */
  async function gravar(org: string, papel: string, valores: Record<string, string>, quem: string) {
    return withTenant(org, async (tx) => {
      const r = (await tx.execute(sql`
        insert into registros (papel, valores, registrado_por_nome)
        values (${papel}, ${JSON.stringify(carga(valores))}::jsonb, ${quem})
        returning id`)) as unknown as Array<{ id: string }>;
      return r[0].id;
    });
  }

  beforeAll(async () => {
    ({ withTenant } = await import('../src/chassis/withTenant'));
    const { _raw } = await import('../src/client');
    appRaw = _raw.appSql;
    admin = _raw.adminSql();
    ({ sql } = await import('drizzle-orm'));
    await admin`delete from registros where valores->>'marca' = ${MARCA}`;
  });

  afterAll(async () => {
    if (admin) await admin`delete from registros where valores->>'marca' = ${MARCA}`;
  });

  /* ══ 1. O registro sobrevive ═══════════════════════════════════════════════════════════════ */

  it('grava e lê de volta um registro do portão, com os campos que a definição declarou', async () => {
    const id = await gravar(UMA, 'controle_cargas', {
      sentido: 'Entrada', data: '2026-09-17', hora: '07:40', tipo: 'Peça de cliente',
      parte: 'Cliente A Indústria Ltda', os: 'OS-1041', placa: 'ABC1D23',
    }, 'Beatriz Nogueira');

    const [lido] = (await withTenant(UMA, (tx) => tx.execute(
      sql`select papel, valores, registrado_por_nome, created_at from registros where id = ${id}`,
    ))) as unknown as Array<any>;

    expect(lido.papel).toBe('controle_cargas');
    expect(lido.valores.os).toBe('OS-1041');
    expect(lido.valores.hora).toBe('07:40');
    expect(lido.registrado_por_nome).toBe('Beatriz Nogueira');
    expect(lido.created_at).toBeTruthy();
  });

  it('uma tabela serve qualquer formulário — é o que faz formulário novo não pedir migração', async () => {
    // Se cada formulário exigisse tabela própria, digitalizar o próximo voltaria a ser código,
    // revisão e deploy. A definição em `plataforma/formularios.ts` é que descreve os campos.
    for (const papel of ['nao_conformidade', 'registro_treinamento', 'propriedade_cliente']) {
      const id = await gravar(UMA, papel, { descricao: 'x' }, 'Ana Ribeiro');
      const [lido] = (await withTenant(UMA, (tx) => tx.execute(
        sql`select papel from registros where id = ${id}`,
      ))) as unknown as Array<any>;
      expect(lido.papel).toBe(papel);
    }
  });

  it('campo que saiu do formulário continua no registro antigo', async () => {
    // A norma pede informação documentada RETIDA. Se a definição mudar amanhã, o registro de
    // ontem tem de continuar provando o que provou — inclusive pelo campo que não existe mais.
    const id = await gravar(UMA, 'controle_cargas', {
      sentido: 'Entrada', campoQueVaiSumir: 'valor de ontem',
    }, 'Beatriz Nogueira');
    const [lido] = (await withTenant(UMA, (tx) => tx.execute(
      sql`select valores from registros where id = ${id}`,
    ))) as unknown as Array<any>;
    expect(lido.valores.campoQueVaiSumir).toBe('valor de ontem');
  });

  /* ══ 2. A prova vem junto ══════════════════════════════════════════════════════════════════ */

  it('a foto do portão é gravada e volta byte a byte', async () => {
    const registroId = await gravar(UMA, 'controle_cargas', { sentido: 'Entrada' }, 'Beatriz Nogueira');

    await withTenant(UMA, (tx) => tx.execute(sql`
      insert into registro_anexos (registro_id, tipo, nome, mime, tamanho_bytes, legenda, comentario, conteudo, adicionado_por_nome)
      values (${registroId}, 'foto', 'portao.jpg', 'image/jpeg', ${FOTO.length},
              'Carga como chegou ao portão', 'Conferir o canto direito do palete',
              ${FOTO}, 'Beatriz Nogueira')`));

    const [anexo] = (await withTenant(UMA, (tx) => tx.execute(
      sql`select nome, legenda, comentario, conteudo, tamanho_bytes from registro_anexos where registro_id = ${registroId}`,
    ))) as unknown as Array<any>;

    expect(anexo.nome).toBe('portao.jpg');
    expect(Buffer.from(anexo.conteudo).equals(FOTO)).toBe(true);
    expect(anexo.tamanho_bytes).toBe(FOTO.length);
    // Legenda e comentário são dois campos porque vão a públicos diferentes: a legenda sai
    // impressa no documento do cliente, o comentário fica em casa.
    expect(anexo.legenda).toBe('Carga como chegou ao portão');
    expect(anexo.comentario).toBe('Conferir o canto direito do palete');
  });

  it('anexo sem arquivo nenhum é recusado', async () => {
    // Anexo é a prova. Linha de metadado sem bytes e sem chave de armazenamento seria um
    // registro dizendo que tem foto quando não tem — pior do que não ter.
    const registroId = await gravar(UMA, 'controle_cargas', { sentido: 'Saída' }, 'Beatriz Nogueira');
    await expect(withTenant(UMA, (tx) => tx.execute(sql`
      insert into registro_anexos (registro_id, nome) values (${registroId}, 'vazio.jpg')`)))
      .rejects.toBeTruthy();
  });

  it('apagar o registro leva os anexos junto', async () => {
    const registroId = await gravar(UMA, 'controle_cargas', { sentido: 'Entrada' }, 'Beatriz Nogueira');
    await withTenant(UMA, (tx) => tx.execute(sql`
      insert into registro_anexos (registro_id, nome, conteudo) values (${registroId}, 'a.jpg', ${FOTO})`));
    await withTenant(UMA, (tx) => tx.execute(sql`delete from registros where id = ${registroId}`));
    const sobrou = (await withTenant(UMA, (tx) => tx.execute(
      sql`select id from registro_anexos where registro_id = ${registroId}`,
    ))) as unknown as Array<any>;
    expect(sobrou.length).toBe(0);
  });

  /* ══ 3. Uma empresa não vê a outra ═════════════════════════════════════════════════════════ */

  it('o registro de uma empresa não aparece para a outra, e não dá para forjar', async () => {
    await gravar(UMA, 'controle_cargas', { sentido: 'Entrada', parte: 'Cliente da primeira' }, 'Beatriz Nogueira');
    await gravar(OUTRA, 'controle_cargas', { sentido: 'Entrada', parte: 'Cliente da segunda' }, 'Outro porteiro');

    const daOutra = (await withTenant(OUTRA, (tx) => tx.execute(
      sql`select valores from registros where valores->>'marca' = ${MARCA}`,
    ))) as unknown as Array<any>;
    expect(daOutra.length).toBe(1);
    expect(daOutra[0].valores.parte).toBe('Cliente da segunda');

    // Carimbar outra empresa na linha é recusado pela política, não pela boa vontade do código.
    await expect(withTenant(OUTRA, (tx) => tx.execute(sql`
      insert into registros (org_id, papel, valores) values (${UMA}, 'controle_cargas', '{}'::jsonb)`)))
      .rejects.toBeTruthy();
  });

  it('conexão sem empresa definida não lê e não escreve nada', async () => {
    // É o que protege um caminho que esqueceu de passar pelo chokepoint: falha fechando.
    const rows = await appRaw`select id from registros where valores->>'marca' = ${MARCA}`;
    expect(rows.length).toBe(0);
    await expect(appRaw`insert into registros (papel, valores) values ('controle_cargas', '{}'::jsonb)`)
      .rejects.toBeTruthy();
  });

  /* ══ 4. As duas perguntas que a tela faz ═══════════════════════════════════════════════════ */

  it('lista um formulário do mais novo para o mais velho', async () => {
    const papel = 'mudanca_producao';
    for (const n of ['primeira', 'segunda', 'terceira']) await gravar(UMA, papel, { motivo: n }, 'Ana Ribeiro');
    const linhas = (await withTenant(UMA, (tx) => tx.execute(sql`
      select valores->>'motivo' as motivo from registros
      where papel = ${papel} and valores->>'marca' = ${MARCA}
      order by created_at desc, id desc`))) as unknown as Array<any>;
    expect(linhas[0].motivo).toBe('terceira');
    expect(linhas.length).toBe(3);
  });

  it('acha as passagens de uma ordem de serviço — é como o portão fecha o par', async () => {
    await gravar(UMA, 'controle_cargas', { sentido: 'Entrada', os: 'OS-9900', data: '2026-09-10' }, 'Beatriz Nogueira');
    await gravar(UMA, 'controle_cargas', { sentido: 'Saída', os: 'OS-9900', data: '2026-09-16' }, 'Beatriz Nogueira');
    await gravar(UMA, 'controle_cargas', { sentido: 'Entrada', os: 'OS-9901', data: '2026-09-11' }, 'Beatriz Nogueira');

    const daOs = (await withTenant(UMA, (tx) => tx.execute(sql`
      select valores->>'sentido' as sentido from registros
      where papel = 'controle_cargas' and valores->>'os' = 'OS-9900' and valores->>'marca' = ${MARCA}
      order by valores->>'data'`))) as unknown as Array<any>;
    expect(daOs.map((r) => r.sentido)).toEqual(['Entrada', 'Saída']);
  });
});
