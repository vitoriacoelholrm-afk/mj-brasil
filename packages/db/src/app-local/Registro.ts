// Entity: Registro  ·  app-local (não é de módulo do catálogo)
//
// Um registro preenchido de QUALQUER formulário declarado em `plataforma/formularios.ts`. A
// forma dos campos é a definição do formulário, que vive em código e tem teste; aqui fica o que
// a plataforma precisa saber sem abrir o conteúdo: de que formulário é, quando, por quem.
//
// Por que app-local e não módulo do catálogo: formulário da ISO 9001 é do assunto desta
// aplicação. Se um dia virar módulo (e vira, no dia em que o segundo cliente da consultoria
// pedir os mesmos formulários), ele sobe inteiro — tabela, zod e capability — sem mudar de forma.
import { integer, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { auditColumns, orgId, pkUuid } from '../_shared.js';
import { bytea } from './_bytea.js';

export const registros = pgTable('registros', {
  id: pkUuid(),
  orgId: orgId(),
  /** Qual formulário — casa com `PapelDeFormulario` no app. Texto e não enum: formulário novo
   *  não deveria pedir migração de banco. */
  papel: text('papel').notNull(),
  /** Os campos preenchidos. Campo retirado do formulário continua aqui no registro antigo — é o
   *  que a norma pede: informação documentada retida como foi retida. */
  valores: jsonb('valores').notNull().default({}),
  /** O nome como aparecia na tela, além do id em `createdBy`. Evidência tem de continuar dizendo
   *  quem assinou mesmo depois que a pessoa sai da empresa. */
  registradoPorNome: text('registrado_por_nome'),
  ...auditColumns,
});

export const registroCreateSchema = z.object({
  papel: z.string().min(1),
  valores: z.record(z.string()).default({}),
  registradoPorNome: z.string().nullable().optional(),
});
export type RegistroCreate = z.infer<typeof registroCreateSchema>;

/* ── O anexo ───────────────────────────────────────────────────────────────────────────────── */

export const registroAnexos = pgTable('registro_anexos', {
  id: pkUuid(),
  orgId: orgId(),
  registroId: uuid('registro_id').notNull(),
  tipo: text('tipo').notNull().default('foto'),          // foto | arquivo
  nome: text('nome').notNull(),
  mime: text('mime'),
  tamanhoBytes: integer('tamanho_bytes'),
  /** Sai impressa junto da imagem no documento que vai ao cliente. */
  legenda: text('legenda').notNull().default(''),
  /** Fica no registro interno; não sai no documento. */
  comentario: text('comentario').notNull().default(''),
  etapa: text('etapa'),
  /** Os bytes aqui mesmo — enquanto não existe armazenamento de objetos. Ver a migração 0020:
   *  é um dos dois, nunca nenhum, e o destino final é `storageKey`. */
  conteudo: bytea('conteudo'),
  storageKey: text('storage_key'),
  adicionadoPorNome: text('adicionado_por_nome'),
  ...auditColumns,
});

export const registroAnexoCreateSchema = z.object({
  tipo: z.enum(['foto', 'arquivo']).default('foto'),
  nome: z.string().min(1),
  mime: z.string().nullable().optional(),
  tamanhoBytes: z.number().int().nonnegative().nullable().optional(),
  legenda: z.string().default(''),
  comentario: z.string().default(''),
  etapa: z.string().nullable().optional(),
  adicionadoPorNome: z.string().nullable().optional(),
});
export type RegistroAnexoCreate = z.infer<typeof registroAnexoCreateSchema>;
