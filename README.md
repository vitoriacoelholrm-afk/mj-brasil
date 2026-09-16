# MJ Brasil

Sistema da qualidade para empresas certificadas ISO 9001:2015. É uma **plataforma para vários
clientes**, não um app de um cliente só — a Minasjato é o primeiro perfil cadastrado.

O problema que ele resolve: hoje a especificação contratada e a medição do chão de fábrica são
digitadas duas vezes, em dois documentos diferentes, e ninguém compara. É daí que nasce a
divergência. Aqui o dado entra uma vez e o documento que vai ao cliente é **gerado**.

## Como rodar

```bash
pnpm install && pnpm dev
```

Abre em `http://localhost:5273`. Não precisa de banco: as telas de OS e Lista Mestra rodam em
memória. A entrada é sem senha — é ambiente de desenvolvimento, e a faixa amarela no topo diz isso.

```bash
pnpm --filter web test      # 94 testes
```

## As três camadas

A regra do corte, que vale para qualquer decisão de onde pôr um dado novo:

| Camada | Pergunta | Onde |
|---|---|---|
| Plataforma | vale para **qualquer setor**? | `apps/web/src/plataforma/` |
| Módulo setorial | vale para **quem jateia e pinta**? | `apps/web/src/os/` |
| Perfil da empresa | **cada cliente tem o seu**? | `apps/web/src/empresas/` |

Duas palavras que colidem, e é a confusão mais fácil de cometer:

- **empresa atendida** — quem contrata a consultoria. É o `PerfilDaEmpresa`.
- **cliente da empresa** — quem contrata a empresa atendida. Vive no campo `cliente` da OS.

O seletor no cabeçalho troca de empresa atendida. Trocando para *Empresa modelo*, as mesmas
quatro ordens de serviço recebem vereditos diferentes, porque a tolerância é outra — e nenhuma
linha de regra muda.

## Por onde começar a ler

| Arquivo | O que tem |
|---|---|
| `src/plataforma/empresa.ts` | o perfil da empresa atendida: tolerância, codificação, identidade |
| `src/plataforma/documentos.ts` | o motor de controle de documentos. Não cita empresa nenhuma |
| `src/os/regras.ts` | `avaliarMedicao` — a comparação entre especificado e encontrado |
| `src/os/documentos.ts` | `gerarRelatorio` e `compararComRelatorio` |
| `src/empresas/minasjato.ts` | os 47 documentos da lista mestra dela, e a tolerância combinada |
| `src/empresas/modelo.ts` | o ponto de partida do próximo cliente |

## O que os testes provam

`src/plataforma/empresa.test.ts` é o mais interessante para quem está revisando: ele troca a
empresa ativa e verifica que **126 µm sobre 100 passa numa e reprova na outra**, que um código
existe numa e estoura na outra, e que os arquivos de `src/plataforma/` não citam empresa nenhuma
— nem em comentário. Essa última trava já pegou três vazamentos.

`src/os/confronto.test.ts` mostra a unificação: a ordem de serviço e o relatório do cliente
guardavam os mesmos números digitados duas vezes; depois de unificados, o confronto entre eles
fecha em zero, e o que o papel dizia de diferente fica guardado em `noPapel`.

## Três decisões que explicam o desenho

1. **A tolerância é da empresa, não da plataforma.** A Minasjato aceita até 40% acima do
   especificado e no máximo 10% abaixo. A assimetria vem da física: camada fina não protege.
2. **O veredito do relatório é calculado, não escolhido.** Uma OS que não libera não emite
   relatório aprovado. Não existe caixinha para marcar.
3. **A tela nunca escreve um código de documento.** Pede o **papel** — `ordem_servico`,
   `relatorio_inspecao` — e o perfil diz qual código o cumpre. Se a empresa não tem aquele
   formulário, a tela avisa em vez de emitir documento com código que o auditor não acha.

## O que ainda não está pronto

- As telas de OS e Lista Mestra rodam em memória; falta migrar para o banco.
- A autenticação do portal do cliente não existe ainda — a entrada atual é só de desenvolvimento.
- Os módulos de não conformidade e ação corretiva ainda não foram construídos.
- `apps/web/src/modules/*` são células gerenciadas, instaladas pelo CLI `astralitics`. Não editar
  à mão.

## Aviso

O repositório é privado e contém **dados reais de clientes**: nomes de empresas, de pessoas,
lotes de tinta, resultados de inspeção e achados de qualidade. Não tornar público sem decisão
explícita de quem responde por eles.
