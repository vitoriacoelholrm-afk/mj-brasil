-- 0023_registros_numeracao.sql — o registro ganha NÚMERO.
--
-- Até aqui um registro se identificava pelo uuid. Serve para o banco e não serve para ninguém
-- mais: o auditor não pergunta pelo 9f3a-… , pergunta "me mostra o RNC 05". A 7.5.2 pede
-- identificação — título, data, autor OU número de referência — e é o número que faz o registro
-- ser citável fora da tela: num plano de ação, numa ata de análise crítica, num e-mail ao cliente.
--
-- A NUMERAÇÃO É POR FORMULÁRIO E POR ANO. É como toda empresa certificada numera, e por dois
-- motivos práticos: a sequência não cresce para sempre, e o ano no número já diz de quando é o
-- registro sem abrir. O RNC 001/2026 e o Plano de Ação 001/2026 convivem sem conflito porque a
-- sequência é de cada formulário.
--
-- QUEM ATRIBUI É O BANCO, e não o app. Duas pessoas registrando ao mesmo tempo no mesmo
-- formulário pegariam o mesmo número se quem contasse fosse a tela — e dois registros com o mesmo
-- número é o conflito de identificação que este sistema inteiro existe para evitar. O índice
-- único abaixo é a trava: se dois insert tentarem o mesmo número, um falha em vez de duplicar.
--
-- O ANO SAI DE created_at NO FUSO DE SÃO PAULO, e não em UTC. Registro feito às 21h30 de 31 de
-- dezembro tem hora UTC do dia 1º de janeiro — numerá-lo como do ano seguinte criaria um registro
-- de 2027 num dia em que a empresa estava em 2026. É a mesma armadilha que a data local do
-- formulário já evita no app.
--
-- Aditiva (ADR-06). Não cria tabela: a política e o grant da 0020 valem para as colunas novas,
-- porque RLS é por linha e não por coluna.

alter table registros
  add column if not exists numero integer,
  add column if not exists ano    integer;

comment on column registros.numero is
  'Sequencial dentro do formulário e do ano. Atribuído pelo banco na inserção; nunca reaproveitado.';
comment on column registros.ano is
  'O ano do registro, pelo fuso de São Paulo. Junto com numero e papel, é a identificação citável.';

-- Os que já existem recebem número na ordem em que foram criados, por formulário e por ano.
-- Sem isto, registro antigo ficaria sem identificação e a lista misturaria numerado com não
-- numerado — que é pior do que não ter número nenhum.
with numerados as (
  select id,
         extract(year from created_at at time zone 'America/Sao_Paulo')::int as ano_local,
         row_number() over (
           partition by org_id, papel,
                        extract(year from created_at at time zone 'America/Sao_Paulo')
           order by created_at, id
         ) as seq
  from registros
  where numero is null
)
update registros r
   set numero = n.seq, ano = n.ano_local
  from numerados n
 where r.id = n.id;

-- A trava. Duas linhas com o mesmo formulário, ano e número não podem existir na mesma empresa.
create unique index if not exists registros_numeracao_uq
  on registros (org_id, papel, ano, numero);

-- E a busca que a tela faz: os registros de um formulário, do mais recente para o mais antigo,
-- agora pela numeração e não pela data — duas ocorrências do mesmo dia têm ordem definida.
create index if not exists registros_org_papel_numero_idx
  on registros (org_id, papel, ano desc, numero desc);
