-- 0020_registros_sgq.sql — os registros do sistema da qualidade.
--
-- Duas tabelas para TODOS os formulários, e não duas por formulário. A razão é a mesma que fez a
-- tela ser uma só: em `plataforma/formularios.ts` um formulário é uma DEFINIÇÃO, não uma tela.
-- Digitalizar o próximo (são onze na lista mestra, e seis existem) é acrescentar uma definição.
-- Se cada um exigisse tabela e migração próprias, isso deixaria de ser verdade no dia seguinte:
-- voltaria a precisar de código, revisão e deploy para cada formulário novo, que é exatamente o
-- que o desenho evita.
--
-- Por isso `valores` é jsonb: o formato dele é a definição, que já vive em código e tem teste.
-- O que NÃO fica no jsonb é o que a plataforma precisa saber independentemente do formulário —
-- de que formulário é o registro, quando foi feito, por quem — porque disso ela depende para
-- listar, filtrar e provar autoria sem abrir o conteúdo.
--
-- Aditiva (ADR-06). Apêndice de RLS obrigatório em toda tabela com org_id (check:rls).

-- ── registros — um registro preenchido, de qualquer formulário ─────────────────────────────────
create table if not exists registros (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  -- Qual formulário. Casa com `PapelDeFormulario` no app: controle_cargas, nao_conformidade,
  -- propriedade_cliente, mudanca_producao, registro_treinamento, monitoramento_sgq.
  -- Texto e não enum de propósito: formulário novo não deveria pedir migração.
  papel               text not null,
  -- Os campos preenchidos, na forma que a definição declara. O que estiver aqui e não estiver na
  -- definição não some: um campo retirado do formulário continua no registro antigo, que é o que
  -- a norma pede — informação documentada retida como foi retida.
  valores             jsonb not null default '{}'::jsonb,
  -- Quem preencheu, pelo NOME que aparecia na tela, além do id em created_by.
  -- Os dois, e não só o id: o registro é evidência, e tem de continuar dizendo quem assinou mesmo
  -- que a pessoa saia da empresa e o cadastro dela seja desativado depois.
  registrado_por_nome text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid,
  updated_by          uuid
);

-- A lista de uma tela: um formulário, do mais novo para o mais velho.
create index if not exists registros_org_papel_idx on registros (org_id, papel, created_at desc);

-- O pareamento do portão (entrada × saída pela ordem de serviço) e, no geral, "os registros
-- daquela OS". Índice de expressão porque a OS mora dentro do jsonb.
create index if not exists registros_org_papel_os_idx
  on registros (org_id, papel, (valores ->> 'os'))
  where valores ->> 'os' is not null;

alter table registros enable row level security;
alter table registros force row level security;
drop policy if exists registros_tenant_isolation on registros;
create policy registros_tenant_isolation on registros
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on registros to mj_brasil_app;

-- ── registro_anexos — a foto e o arquivo que provam o que o texto não prova ────────────────────
-- FK de verdade (e não referência solta) porque as duas tabelas são do mesmo assunto: anexo sem
-- registro não é nada. `on delete cascade` pela mesma razão.
create table if not exists registro_anexos (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null default nullif(current_setting('app.org_id', true), '')::uuid,
  registro_id         uuid not null references registros (id) on delete cascade,
  tipo                text not null default 'foto',      -- foto | arquivo
  nome                text not null,
  mime                text,
  tamanho_bytes       integer,
  -- Legenda sai impressa junto da imagem no documento que vai ao cliente; comentário fica no
  -- registro interno. São dois campos porque juntá-los obrigaria a escolher entre escrever para
  -- o cliente ou para a casa.
  legenda             text not null default '',
  comentario          text not null default '',
  etapa               text,                              -- a que etapa do processo pertence, quando há etapas
  -- ONDE O ARQUIVO ESTÁ. Um dos dois, nunca nenhum:
  --   · storage_key — a chave no armazenamento de objetos. É o destino final: foto de celular tem
  --     de 2 a 5 MB, e isso engorda backup e restauração do banco sem precisar.
  --   · conteudo — os bytes aqui mesmo. Serve enquanto não existe armazenamento de objetos, para
  --     o registro do portão não fechar sem a prova que ele exige. Quando o armazenamento entrar,
  --     migra-se coluna para chave e esta some.
  conteudo            bytea,
  storage_key         text,
  adicionado_por_nome text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid,
  updated_by          uuid,
  constraint registro_anexos_tem_arquivo_ck check (conteudo is not null or storage_key is not null)
);

create index if not exists registro_anexos_org_registro_idx
  on registro_anexos (org_id, registro_id, created_at);

alter table registro_anexos enable row level security;
alter table registro_anexos force row level security;
drop policy if exists registro_anexos_tenant_isolation on registro_anexos;
create policy registro_anexos_tenant_isolation on registro_anexos
  using      (org_id = nullif(current_setting('app.org_id', true), '')::uuid)
  with check (org_id = nullif(current_setting('app.org_id', true), '')::uuid);
grant select, insert, update, delete on registro_anexos to mj_brasil_app;
