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

  /* ══ A numeração ═══════════════════════════════════════════════════════════════════════════ */

  describe('o registro recebe NÚMERO, e quem numera é o banco', () => {
    // O auditor não pergunta pelo uuid: pergunta "me mostra o RNC 05". A 7.5.2 pede identificação,
    // e é o número que faz o registro ser citável num plano de ação, numa ata ou num e-mail.
    const PAPEL = 'test_numeracao';
    // Marca própria: estes registros nascem em DUAS empresas, e a suíte de isolamento conta os
    // dela pela marca. Dividir a marca faria um teste sujar a contagem do outro.
    const MARCA_NUM = 'test.numeracao.vitest';
    let db: typeof import('../src/index');
    const base = {
      membershipId: '00000000-0000-4000-9000-000000000001',
      actor: 'member:00000000-0000-4000-9000-000000000001',
      rbacRole: 'admin' as const, permissions: new Set(['*']),
    };

    const criar = (org: string, papel = PAPEL) =>
      withTenant(org, (tx) => db.criarRegistro(
        tx as any, { ...base, orgId: org } as any,
        { papel, valores: { x: '1', marca: MARCA_NUM } } as any,
      )) as any;

    beforeAll(async () => {
      db = await import('../src/index');
      await admin`delete from registros where valores->>'marca' = ${MARCA_NUM}`;
    });
    afterAll(async () => {
      if (admin) await admin`delete from registros where valores->>'marca' = ${MARCA_NUM}`;
    });

    it('numera 1, 2, 3 dentro do mesmo formulário', async () => {
      const a = await criar(UMA);
      const b = await criar(UMA);
      const c = await criar(UMA);
      expect(b.numero).toBe(a.numero + 1);
      expect(c.numero).toBe(b.numero + 1);
      expect(a.ano).toBe(new Date().getFullYear());
    });

    it('cada formulário tem a sua sequência — o RNC 001 e o plano de ação 001 convivem', async () => {
      expect((await criar(UMA, 'test_numeracao_2')).numero).toBe(1);
    });

    it('e a sequência de uma empresa não conta a da outra', async () => {
      // Se a numeração ignorasse o org_id, o primeiro registro da empresa vizinha começaria no
      // número seguinte ao desta — e o número diria quantos registros o VIZINHO tem.
      expect((await criar(OUTRA, 'test_numeracao_3')).numero).toBe(1);
    });

    it('dois registros nunca dividem o mesmo número — o índice único é a trava', async () => {
      await expect(withTenant(UMA, (tx) => tx.execute(sql`
        insert into registros (papel, ano, numero, valores)
        select papel, ano, numero, ${JSON.stringify({ x: 'clone', marca: MARCA_NUM })}::jsonb
          from registros
         where papel = ${PAPEL} and org_id = ${UMA}::uuid
         limit 1`))).rejects.toThrow();
    });
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

  /* ══ 5. Pelas Functions, que é por onde a tela entra ═══════════════════════════════════════ */

  describe('as Functions', () => {
    const ctx = {
      orgId: UMA,
      membershipId: '00000000-0000-4000-9000-000000000006',   // a portaria
      actor: 'member:00000000-0000-4000-9000-000000000006',
      rbacRole: 'admin' as const,
      permissions: new Set(['*']),
    };
    const semPermissao = { ...ctx, rbacRole: 'employee' as const, permissions: new Set<string>() };

    it('grava registro e foto numa transação só, e a lista devolve os dois', async () => {
      const db = await import('../src/index');
      const criado = await withTenant(UMA, (tx) => db.criarRegistro(tx as any, ctx as any, {
        papel: 'controle_cargas',
        valores: carga({ sentido: 'Entrada', os: 'OS-7777', parte: 'Cliente A', placa: 'ABC1D23' }),
        registradoPorNome: 'Beatriz Nogueira',
        anexos: [{
          tipo: 'foto', nome: 'portao.jpg', mime: 'image/jpeg',
          legenda: 'Carga no portão', comentario: 'canto direito',
          conteudoBase64: FOTO.toString('base64'),
        }],
      } as any));
      expect(criado.id).toBeTruthy();

      const { rows } = await withTenant(UMA, (tx) =>
        db.listarRegistros(tx as any, ctx as any, { papel: 'controle_cargas', limite: 200 } as any)) as any;
      const meu = rows.find((r: any) => r.id === criado.id);
      expect(meu.valores.os).toBe('OS-7777');
      expect(meu.registrado_por_nome).toBe('Beatriz Nogueira');
      expect(meu.anexos).toHaveLength(1);
      expect(meu.anexos[0].legenda).toBe('Carga no portão');
      expect(meu.anexos[0].tamanhoBytes).toBe(FOTO.length);
    });

    it('a lista NÃO carrega os bytes das fotos — eles vêm só quando se abre o registro', async () => {
      // Um portão com duzentas passagens e uma foto em cada traria meio giga numa resposta só,
      // para desenhar uma lista de texto. No celular do portão isso não abre.
      const db = await import('../src/index');
      const { rows } = await withTenant(UMA, (tx) =>
        db.listarRegistros(tx as any, ctx as any, { papel: 'controle_cargas', limite: 200 } as any)) as any;
      const comFoto = rows.find((r: any) => r.anexos.length > 0);
      expect(comFoto).toBeTruthy();
      expect(comFoto.anexos[0].conteudo).toBeUndefined();
      expect(comFoto.anexos[0].conteudoBase64).toBeUndefined();

      const bytes = await withTenant(UMA, (tx) =>
        db.lerAnexo(tx as any, ctx as any, { anexoId: comFoto.anexos[0].id } as any)) as any;
      expect(Buffer.from(bytes.conteudoBase64, 'base64').equals(FOTO)).toBe(true);
    });

    it('sem permissão de escrita, não grava; sem a de leitura, não lê', async () => {
      const db = await import('../src/index');
      await expect(withTenant(UMA, (tx) => db.criarRegistro(tx as any, semPermissao as any, {
        papel: 'controle_cargas', valores: carga({ sentido: 'Entrada' }), anexos: [],
      } as any))).rejects.toThrow(/registro.write/);
      await expect(withTenant(UMA, (tx) => db.listarRegistros(tx as any, semPermissao as any, {
        papel: 'controle_cargas', limite: 10,
      } as any))).rejects.toThrow(/registro.read/);
    });

    it('anexo grande demais é recusado, e o registro inteiro volta atrás', async () => {
      // A transação é o ponto: falhar no anexo não pode deixar um registro de portão gravado sem
      // a foto que ele exige.
      const db = await import('../src/index');
      const enorme = Buffer.alloc(13 * 1024 * 1024, 7).toString('base64');
      await expect(withTenant(UMA, (tx) => db.criarRegistro(tx as any, ctx as any, {
        papel: 'controle_cargas',
        valores: carga({ sentido: 'Entrada', os: 'OS-NAO-DEVE-EXISTIR' }),
        anexos: [{ tipo: 'foto', nome: 'gigante.jpg', conteudoBase64: enorme }],
      } as any))).rejects.toMatchObject({ code: 'ANEXO_GRANDE_DEMAIS' });

      const sobrou = (await withTenant(UMA, (tx) => tx.execute(
        sql`select id from registros where valores->>'os' = 'OS-NAO-DEVE-EXISTIR'`,
      ))) as unknown as Array<any>;
      expect(sobrou.length).toBe(0);
    });
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
