-- 0024_documento_arquivos.sql — o ARQUIVO do documento da lista mestra.
--
-- A lista mestra sabe que o PG-004 existe, em que revisão e quem responde por ele. A 0021 trouxe
-- o TEXTO, para a consultoria escrever o modelo pela tela. Falta o terceiro estado, que é o mais
-- comum nos clientes: o documento existe como ARQUIVO — o .docx que alguém editou, o .pdf
-- assinado e digitalizado — e o sistema só apontava para a pasta onde ele deveria estar.
--
-- É a diferença entre a tela da cláusula dizer que o PG-004 responde pela 9.2 e ABRIR o PG-004.
-- O auditor pede o documento, não o nome dele.
--
-- Chave por (empresa, perfil, código): o arquivo pertence ao documento da lista mestra, e não a
-- um registro preenchido — por isso não há FK para `registros`, e o código é texto, como em
-- documento_textos. A mesma coluna `perfil` separa o acervo do modelo do de um cliente enquanto
-- os dois convivem sob o mesmo org_id.
--
-- VÁRIOS por documento de propósito: um procedimento tem o arquivo editável e o assinado, e uma
-- revisão nova não apaga a anterior — a lista mestra é justamente o controle de quais versões
-- existem. Quem decide o que está vigente é o campo `revisao`, não o número de linhas aqui.
--
-- Aditiva (ADR-06). Apêndice de RLS obrigatório em toda tabela com org_id (check:rls).

create table if not exists documento_arquivos (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  -- Qual perfil de empresa: 'modelo' (o molde) ou o id do cliente atendido.
  perfil              text not null,
  -- O código da lista mestra a que este arquivo pertence: MQ-001, PG-004, FM-023.
  codigo              text not null,
  nome                text not null,
  mime                text,
  tamanho_bytes       integer,
  -- A revisão do documento que ESTE arquivo contém. Vazio quando quem anexou não disse — e aí a
  -- tela mostra a revisão da lista mestra, avisando que é suposição.
  revisao             text not null default '',
  -- Por que este arquivo está aqui: "assinado", "editável", "digitalizado da pasta física".
  observacao          text not null default '',
  -- ONDE O ARQUIVO ESTÁ. Um dos dois, nunca nenhum — mesma escolha da 0020:
  --   · storage_key — a chave no armazenamento de objetos, que é o destino final;
  --   · conteudo — os bytes aqui mesmo, enquanto esse armazenamento não existe.
  conteudo            bytea,
  storage_key         text,
  adicionado_por_nome text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid,
  updated_by          uuid,
  constraint documento_arquivos_tem_arquivo_ck check (conteudo is not null or storage_key is not null)
);

create index if not exists documento_arquivos_org_perfil_codigo_idx
  on documento_arquivos (org_id, perfil, codigo, created_at);

alter table documento_arquivos enable row level security;
alter table documento_arquivos force row level security;
drop policy if exists documento_arquivos_tenant_isolation on documento_arquivos;
create policy documento_arquivos_tenant_isolation on documento_arquivos
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on documento_arquivos to mj_brasil_app;
