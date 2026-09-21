-- 0021_documento_textos.sql — o TEXTO dos documentos do SGQ.
--
-- A lista mestra sempre soube que um documento existe, em que revisão e quem responde por ele.
-- O que ela nunca guardou foi o documento: o texto. Ele vivia em arquivo, fora do sistema, e o
-- app só apontava para a pasta.
--
-- Isto entra para a consultoria poder escrever o MODELO — o molde que vai para o próximo cliente
-- — dentro da própria tela, em vez de pedir a alguém que edite um arquivo de código.
--
-- A coluna `perfil` é o que separa os textos do modelo dos de um cliente. Hoje ela é necessária
-- porque a entrada ainda resolve uma organização só: os dois perfis convivem sob o mesmo org_id.
-- Quando a entrada souber trocar de empresa de verdade, esta coluna vira o tenant e o dado já
-- está separado — não há migração de conteúdo, só de chave.
--
-- Aditiva (ADR-06). Apêndice de RLS obrigatório em toda tabela com org_id (check:rls).

create table if not exists documento_textos (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  -- Qual perfil de empresa: 'modelo' (o molde) ou o id do cliente atendido.
  perfil            text not null,
  -- O código da lista mestra: MQ-001, PG-004, FM-023.
  codigo            text not null,
  -- O documento em si. Texto corrido, como se escreve — a formatação vem depois, se vier.
  texto             text not null default '',
  -- Quem escreveu por último, pelo nome. Documento do SGQ sem autor não passa em auditoria, e o
  -- nome tem de sobreviver à pessoa sair da empresa.
  atualizado_por_nome text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid,
  updated_by        uuid,
  constraint documento_textos_perfil_codigo_uq unique (org_id, perfil, codigo)
);

create index if not exists documento_textos_org_perfil_idx
  on documento_textos (org_id, perfil);

alter table documento_textos enable row level security;
alter table documento_textos force row level security;
drop policy if exists documento_textos_tenant_isolation on documento_textos;
create policy documento_textos_tenant_isolation on documento_textos
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on documento_textos to mj_brasil_app;
