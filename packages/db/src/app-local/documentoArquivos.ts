// Functions do ARQUIVO dos documentos do SGQ — puras (db, ctx, input), como toda capability.
//
// Quatro verbos: listar a ficha de todos os arquivos de um perfil, anexar um, ler os bytes de um,
// e remover. A listagem NÃO traz os bytes — a tela da cláusula mostra meia dúzia de documentos, e
// carregar o conteúdo de todos para desenhar uma lista de nomes é o tipo de coisa que funciona
// com três arquivos e derruba a página com trezentos.
//
// A regra de QUEM pode anexar mora na tela (`plataforma/acesso.ts`, `podeAnexarEmDocumento`),
// como em documentoTextos e pela mesma razão: o servidor hoje só conhece o papel RBAC do chassi e
// toda a equipe entra como admin enquanto `role_assignments` não existir. Está anotado de
// propósito — quando os papéis chegarem ao servidor, o gate desce para cá.
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { can, ForbiddenError, type Context } from '../identity/context.js';
import { FunctionError } from '../_errors.js';
import type { DbOrTx } from '../identity/dbOrTx.js';

/** Teto por arquivo. Um procedimento de SGQ digitalizado fica na casa de 1 a 3 MB; 8 MB deixa
 *  folga para o manual inteiro escaneado sem transformar o banco em repositório de mídia. */
const LIMITE_BYTES = 8 * 1024 * 1024;

const uuid = z.string().uuid();

export const listarArquivosInput = z.object({
  perfil: z.string().min(1).max(80),
});

/** A ficha de todos os arquivos de um perfil, do mais novo para o mais velho dentro de cada
 *  documento. Sem os bytes — ver o cabeçalho. */
export async function listarArquivos(db: DbOrTx, ctx: Context, input: z.infer<typeof listarArquivosInput>) {
  const i = listarArquivosInput.parse(input);
  if (!can(ctx, 'registro.read')) throw new ForbiddenError('registro.read');

  const rows = (await db.execute(sql`
    select id, codigo, nome, mime, tamanho_bytes, revisao, observacao,
           adicionado_por_nome, created_at
    from documento_arquivos
    where org_id = ${ctx.orgId}::uuid and perfil = ${i.perfil}
    order by codigo, created_at desc`)) as unknown as Array<Record<string, unknown>>;

  return { rows };
}

export const anexarArquivoInput = z.object({
  perfil: z.string().min(1).max(80),
  codigo: z.string().min(1).max(40),
  nome: z.string().min(1).max(300),
  mime: z.string().max(200).nullable().optional(),
  revisao: z.string().max(20).optional(),
  observacao: z.string().max(500).optional(),
  conteudoBase64: z.string().min(1),
  adicionadoPorNome: z.string().max(200).nullable().optional(),
});

/** Junta um arquivo ao documento. Não é upsert: anexar de novo ACRESCENTA.
 *
 *  É o contrário do texto, e de propósito. Texto tem uma versão, que muda. Arquivo de documento
 *  do SGQ tem o editável e o assinado, e a revisão nova não faz a anterior deixar de ter
 *  existido — controlar quais versões existem é o ofício da lista mestra. Sobrescrever apagaria
 *  justamente o histórico que o auditor pede. */
export async function anexarArquivo(db: DbOrTx, ctx: Context, input: z.infer<typeof anexarArquivoInput>) {
  const i = anexarArquivoInput.parse(input);
  if (!can(ctx, 'registro.write')) throw new ForbiddenError('registro.write');

  const bytes = Buffer.from(i.conteudoBase64, 'base64');
  if (bytes.length === 0) throw new FunctionError('ARQUIVO_VAZIO', i.nome);
  if (bytes.length > LIMITE_BYTES) throw new FunctionError('ARQUIVO_GRANDE_DEMAIS', i.nome);

  const rows = (await db.execute(sql`
    insert into documento_arquivos
      (org_id, perfil, codigo, nome, mime, tamanho_bytes, revisao, observacao,
       conteudo, adicionado_por_nome, created_by, updated_by)
    values (${ctx.orgId}::uuid, ${i.perfil}, ${i.codigo}, ${i.nome}, ${i.mime ?? null},
            ${bytes.length}, ${i.revisao ?? ''}, ${i.observacao ?? ''},
            ${bytes}, ${i.adicionadoPorNome ?? null}, ${ctx.membershipId}, ${ctx.membershipId})
    returning id, codigo, nome, mime, tamanho_bytes, revisao, observacao,
              adicionado_por_nome, created_at`)) as unknown as Array<Record<string, unknown>>;

  return rows[0];
}

export const lerArquivoInput = z.object({ arquivoId: uuid });

/** Os bytes de um arquivo, em base64, para a tela abrir ou baixar. */
export async function lerArquivo(db: DbOrTx, ctx: Context, input: z.infer<typeof lerArquivoInput>) {
  const i = lerArquivoInput.parse(input);
  if (!can(ctx, 'registro.read')) throw new ForbiddenError('registro.read');

  const rows = (await db.execute(sql`
    select nome, mime, conteudo, storage_key
    from documento_arquivos
    where org_id = ${ctx.orgId}::uuid and id = ${i.arquivoId}
    limit 1`)) as unknown as Array<{
      nome: string; mime: string | null;
      conteudo: Uint8Array | null; storage_key: string | null;
    }>;

  const a = rows[0];
  if (!a) throw new FunctionError('ARQUIVO_NOT_FOUND', i.arquivoId);
  // Quando o armazenamento de objetos entrar, é aqui que se devolve a URL assinada em vez dos
  // bytes, e a tela não muda: ela já pede o arquivo por id.
  if (!a.conteudo) return { nome: a.nome, mime: a.mime, conteudoBase64: null, storageKey: a.storage_key };
  return {
    nome: a.nome, mime: a.mime,
    conteudoBase64: Buffer.from(a.conteudo).toString('base64'),
    storageKey: null,
  };
}

export const removerArquivoInput = z.object({ arquivoId: uuid });

/** Tira um arquivo do documento. Existe porque anexar o arquivo errado é o erro mais comum de
 *  quem alimenta acervo, e sem isto a única saída seria anexar o certo por cima e deixar os dois
 *  na tela — que é pior do que apagar: duas versões sem dizer qual vale. */
export async function removerArquivo(db: DbOrTx, ctx: Context, input: z.infer<typeof removerArquivoInput>) {
  const i = removerArquivoInput.parse(input);
  if (!can(ctx, 'registro.write')) throw new ForbiddenError('registro.write');

  const rows = (await db.execute(sql`
    delete from documento_arquivos
    where org_id = ${ctx.orgId}::uuid and id = ${i.arquivoId}
    returning id`)) as unknown as Array<{ id: string }>;

  if (!rows[0]) throw new FunctionError('ARQUIVO_NOT_FOUND', i.arquivoId);
  return { id: rows[0].id };
}
