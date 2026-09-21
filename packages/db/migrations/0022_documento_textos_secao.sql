-- 0022_documento_textos_secao.sql — o texto passa a ter endereço DENTRO do documento.
--
-- A 0021 guardava um texto por documento: MQ-001 inteiro num campo só. Serve para um procedimento
-- de duas páginas; não serve para o manual da qualidade, que é o documento mais longo do sistema
-- e o único que se lê por PEDAÇO. Ninguém abre o manual para ler do começo: abre para ver o que
-- a empresa diz sobre a 8.5.5, porque foi isso que o auditor perguntou.
--
-- `secao` é esse endereço. Para o manual, é a cláusula da norma — '7.4', '8.5.5'. Para todos os
-- outros documentos continua vazia, que é o documento inteiro num texto só: o default '' mantém
-- as linhas que já existem válidas sem nenhuma conversão.
--
-- A unicidade muda de (org, perfil, código) para (org, perfil, código, seção) pela mesma razão:
-- o mesmo MQ-004 responde por 37 textos, um por cláusula, e continua sendo um documento só.
--
-- Aditiva (ADR-06). Não cria tabela, então não há apêndice de RLS a escrever: a política e o
-- grant da 0021 valem para as colunas novas — RLS é por linha, não por coluna.

alter table documento_textos
  add column if not exists secao text not null default '';

comment on column documento_textos.secao is
  'O endereço do texto dentro do documento. No manual da qualidade é a cláusula da ISO (7.4, 8.5.5); vazio quer dizer o documento inteiro.';

alter table documento_textos
  drop constraint if exists documento_textos_perfil_codigo_uq;

alter table documento_textos
  add constraint documento_textos_perfil_codigo_secao_uq
  unique (org_id, perfil, codigo, secao);
