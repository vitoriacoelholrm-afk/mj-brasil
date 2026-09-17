// Functions dos registros do SGQ — puras (db, ctx, input), como toda capability do chassi.
//
// Três verbos, e a divisão entre eles não é arbitrária: é o tamanho da foto.
//
//   · listarRegistros — a lista de uma tela. Traz os registros e a FICHA dos anexos (nome,
//     legenda, tamanho), nunca os bytes. Um portão com duzentas passagens e uma foto em cada
//     traria meio giga numa resposta só, para mostrar uma lista de texto.
//   · lerAnexo — os bytes de um anexo, quando alguém abre o registro e olha a foto.
//   · criarRegistro — grava o registro e seus anexos na mesma transação. Registro que exige foto
//     não pode existir um instante sequer sem ela.
//
// A regra de SETOR (quem preenche o quê) ainda mora na tela, não aqui: o servidor hoje só conhece
// o papel RBAC do chassi, e toda a equipe entra como admin enquanto role_assignments não existe.
// Enquanto for assim, isto é controle de tela e não de servidor — anotado de propósito.
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { can, ForbiddenError, type Context } from '../identity/context.js';
import { FunctionError } from '../_errors.js';
import type { DbOrTx } from '../identity/dbOrTx.js';

const uuid = z.string().uuid();

/** Teto por arquivo. Foto de celular fica entre 2 e 5 MB; acima disto é quase sempre engano
 *  (um vídeo, um PDF de projeto inteiro), e o caminhão está esperando no portão. */
const LIMITE_BYTES = 12 * 1024 * 1024;

export const anexoEntradaSchema = z.object({
  tipo: z.enum(['foto', 'arquivo']).default('foto'),
  nome: z.string().min(1).max(300),
  mime: z.string().max(200).nullable().optional(),
  legenda: z.string().max(500).default(''),
  comentario: z.string().max(4000).default(''),
  etapa: z.string().max(200).nullable().optional(),
  /** O arquivo em base64 — é como ele atravessa a chamada. Vira bytea do outro lado. */
  conteudoBase64: z.string().min(1),
});

export const criarRegistroInput = z.object({
  papel: z.string().min(1).max(80),
  valores: z.record(z.string()).default({}),
  registradoPorNome: z.string().max(200).nullable().optional(),
  anexos: z.array(anexoEntradaSchema).max(30).default([]),
});

/** Grava o registro e seus anexos numa transação só.
 *
 *  Separar as duas escritas deixaria existir, entre uma e outra, um registro do portão sem a foto
 *  que ele exige — e uma falha no meio o deixaria assim para sempre. */
export async function criarRegistro(db: DbOrTx, ctx: Context, input: z.infer<typeof criarRegistroInput>) {
  const i = criarRegistroInput.parse(input);
  if (!can(ctx, 'registro.write')) throw new ForbiddenError('registro.write');

  const linhas = (await db.execute(sql`
    insert into registros (org_id, papel, valores, registrado_por_nome, created_by, updated_by)
    values (${ctx.orgId}::uuid, ${i.papel}, ${JSON.stringify(i.valores)}::jsonb,
            ${i.registradoPorNome ?? null}, ${ctx.membershipId}, ${ctx.membershipId})
    returning id, created_at`)) as unknown as Array<{ id: string; created_at: unknown }>;
  const registro = linhas[0];

  for (const a of i.anexos) {
    const bytes = Buffer.from(a.conteudoBase64, 'base64');
    if (bytes.length === 0) throw new FunctionError('ANEXO_VAZIO', a.nome);
    if (bytes.length > LIMITE_BYTES) throw new FunctionError('ANEXO_GRANDE_DEMAIS', a.nome);
    await db.execute(sql`
      insert into registro_anexos
        (org_id, registro_id, tipo, nome, mime, tamanho_bytes, legenda, comentario, etapa,
         conteudo, adicionado_por_nome, created_by, updated_by)
      values (${ctx.orgId}::uuid, ${registro.id}, ${a.tipo}, ${a.nome}, ${a.mime ?? null},
              ${bytes.length}, ${a.legenda}, ${a.comentario}, ${a.etapa ?? null},
              ${bytes}, ${i.registradoPorNome ?? null}, ${ctx.membershipId}, ${ctx.membershipId})`);
  }

  return { id: registro.id, criadoEm: registro.created_at };
}

export const listarRegistrosInput = z.object({
  papel: z.string().min(1).max(80),
  /** Teto de linhas. A tela mostra as mais recentes; o resto vem quando houver busca. */
  limite: z.number().int().positive().max(500).default(200),
});

/** Os registros de um formulário, do mais novo para o mais velho, com a ficha dos anexos.
 *  Sem os bytes — ver o cabeçalho deste arquivo. */
export async function listarRegistros(db: DbOrTx, ctx: Context, input: z.infer<typeof listarRegistrosInput>) {
  const i = listarRegistrosInput.parse(input);
  if (!can(ctx, 'registro.read')) throw new ForbiddenError('registro.read');

  const rows = (await db.execute(sql`
    select r.id, r.papel, r.valores, r.registrado_por_nome, r.created_at,
           coalesce(
             (select json_agg(json_build_object(
                'id', a.id, 'tipo', a.tipo, 'nome', a.nome, 'mime', a.mime,
                'tamanhoBytes', a.tamanho_bytes, 'legenda', a.legenda, 'comentario', a.comentario,
                'etapa', a.etapa, 'adicionadoPorNome', a.adicionado_por_nome, 'criadoEm', a.created_at
              ) order by a.created_at)
              from registro_anexos a
              where a.org_id = r.org_id and a.registro_id = r.id),
             '[]'::json) as anexos
    from registros r
    where r.org_id = ${ctx.orgId}::uuid and r.papel = ${i.papel}
    order by r.created_at desc, r.id desc
    limit ${i.limite}`)) as unknown as Array<Record<string, unknown>>;

  return { rows };
}

export const lerAnexoInput = z.object({ anexoId: uuid });

/** Os bytes de um anexo, em base64, para a tela mostrar a imagem. */
export async function lerAnexo(db: DbOrTx, ctx: Context, input: z.infer<typeof lerAnexoInput>) {
  const i = lerAnexoInput.parse(input);
  if (!can(ctx, 'registro.read')) throw new ForbiddenError('registro.read');

  const rows = (await db.execute(sql`
    select nome, tipo, mime, conteudo, storage_key
    from registro_anexos
    where org_id = ${ctx.orgId}::uuid and id = ${i.anexoId}
    limit 1`)) as unknown as Array<{
      nome: string; tipo: string; mime: string | null;
      conteudo: Uint8Array | null; storage_key: string | null;
    }>;

  const a = rows[0];
  if (!a) throw new FunctionError('ANEXO_NOT_FOUND', i.anexoId);
  // Quando o armazenamento de objetos entrar, é aqui que se devolve a URL assinada em vez dos
  // bytes, e a tela não muda: ela já pede o anexo por id.
  if (!a.conteudo) return { nome: a.nome, tipo: a.tipo, mime: a.mime, conteudoBase64: null, storageKey: a.storage_key };
  return {
    nome: a.nome, tipo: a.tipo, mime: a.mime,
    conteudoBase64: Buffer.from(a.conteudo).toString('base64'),
    storageKey: null,
  };
}
