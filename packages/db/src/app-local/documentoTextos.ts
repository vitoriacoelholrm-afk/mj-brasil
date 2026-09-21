// Functions do texto dos documentos — puras (db, ctx, input), como toda capability do chassi.
//
// Dois verbos e nada mais: ler os textos de um perfil, e gravar um. A gravação é um upsert porque
// documento não tem "criar" e "editar" separados do ponto de vista de quem escreve — tem uma
// versão, que muda.
//
// A regra de QUEM pode escrever o modelo mora na tela (`plataforma/acesso.ts`,
// `podeEditarOModelo`), e não aqui, pela mesma razão de sempre: o servidor hoje só conhece o
// papel RBAC do chassi e toda a equipe entra como admin enquanto `role_assignments` não existir.
// Está anotado de propósito — quando os papéis chegarem ao servidor, o gate desce para cá.
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { can, ForbiddenError, type Context } from '../identity/context.js';
import type { DbOrTx } from '../identity/dbOrTx.js';

/** Teto por documento. Um procedimento de SGQ raramente passa de cinco páginas; acima disto é
 *  quase sempre colagem de um manual inteiro num campo só. */
const LIMITE = 200_000;

export const listarTextosInput = z.object({
  perfil: z.string().min(1).max(80),
});

/** Os textos de um perfil, por código. Devolve só o que já foi escrito — documento sem texto
 *  simplesmente não aparece, e a tela mostra o vazio dela. */
export async function listarTextos(db: DbOrTx, ctx: Context, input: z.infer<typeof listarTextosInput>) {
  const i = listarTextosInput.parse(input);
  if (!can(ctx, 'registro.read')) throw new ForbiddenError('registro.read');

  const rows = (await db.execute(sql`
    select codigo, texto, atualizado_por_nome, updated_at
    from documento_textos
    where org_id = ${ctx.orgId}::uuid and perfil = ${i.perfil}
    order by codigo`)) as unknown as Array<Record<string, unknown>>;

  return { rows };
}

export const salvarTextoInput = z.object({
  perfil: z.string().min(1).max(80),
  codigo: z.string().min(1).max(40),
  texto: z.string().max(LIMITE),
  atualizadoPorNome: z.string().max(200).nullable().optional(),
});

/** Grava o texto de um documento. Upsert pela tripla (empresa, perfil, código): escrever duas
 *  vezes o mesmo documento atualiza, não duplica — duas versões do mesmo código na mesma lista é
 *  exatamente o conflito que o sistema existe para evitar. */
export async function salvarTexto(db: DbOrTx, ctx: Context, input: z.infer<typeof salvarTextoInput>) {
  const i = salvarTextoInput.parse(input);
  if (!can(ctx, 'registro.write')) throw new ForbiddenError('registro.write');

  const rows = (await db.execute(sql`
    insert into documento_textos (org_id, perfil, codigo, texto, atualizado_por_nome, created_by, updated_by)
    values (${ctx.orgId}::uuid, ${i.perfil}, ${i.codigo}, ${i.texto},
            ${i.atualizadoPorNome ?? null}, ${ctx.membershipId}, ${ctx.membershipId})
    on conflict (org_id, perfil, codigo) do update
      set texto = excluded.texto,
          atualizado_por_nome = excluded.atualizado_por_nome,
          updated_by = excluded.updated_by,
          updated_at = now()
    returning codigo, texto, atualizado_por_nome, updated_at`)) as unknown as Array<Record<string, unknown>>;

  return rows[0];
}
