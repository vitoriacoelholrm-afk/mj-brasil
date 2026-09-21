// A FOLHA IMPRESSA — o formulário em branco, ou um registro preenchido, numa janela só dele.
//
// Duas telas usam, e é por isso que ela mora aqui e não dentro de um módulo: o manual imprime o
// MODELO, para mostrar ao auditor qual formulário a empresa usa; a tela de registros imprime um
// CASO, para quando ele pede um exemplo concreto em papel.
//
// A tela do sistema serve para conferir e preencher. Não serve para pôr na frente de alguém nem
// para descer ao chão de fábrica: para isso o formulário precisa de uma folha, com cabeçalho,
// carimbo e espaço para escrever.
//
// Janela nova, e não uma tela do app, por três razões práticas: dá para abrir várias ao mesmo
// tempo e comparar, o Ctrl+P sai limpo sem o menu junto, e fechar a janela não tira ninguém de
// onde estava no sistema.
//
// O QUE VAI NO RODAPÉ, E POR QUÊ. Toda folha sai dizendo que é cópia impressa — o modelo diz que o
// documento controlado é o da Lista Mestra; o registro diz que o original é o do sistema e que
// alterar o papel não altera o registro.
//
// Cópia impressa sem essa frase é a não conformidade de 7.5.3 mais fácil de levantar: o papel
// circula, o documento é revisado, e ninguém sabe que a folha na mão está velha. E registro
// impresso sem ela é pior — vira um papel que parece o original e que qualquer um corrige à
// caneta, que é adulteração de evidência e não correção.
import { empresaAtiva } from '@/plataforma/empresa';
import { campoVisivel, type CampoDef, type FormularioDef, type Valores } from '@/plataforma/formularios';
import type { Anexo } from '@/plataforma/anexos';
import { carimboDoPapel } from '@/modules/sgq-documentos/listaMestra';

/** O registro preenchido, quando a folha é a de um caso concreto e não o modelo em branco.
 *  A tela passa os anexos como ela os tem — com imagem, se já carregou; sem, se ainda não. */
export interface RegistroParaFolha {
  id: string;
  valores: Valores;
  anexos: Anexo[];
  criadoEm: string;
  criadoPor: string | null;
}

/** Escapa o que vai para o HTML. O conteúdo é nosso, mas o hábito é o que impede o dia em que
 *  deixar de ser — um título de formulário vindo do perfil de um cliente é texto de terceiro. */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const dataDeHoje = () => new Date().toLocaleDateString('pt-BR');

/** 'AAAA-MM-DD' vira 'DD/MM/AAAA'. O que não for data volta como veio. */
const br = (v: string) =>
  (/^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10).split('-').reverse().join('/') : v);

/** A linha de um campo, no papel. Cada tipo ganha o espaço que ele precisa para ser preenchido à
 *  mão — caixa de escolha marca com X, texto longo recebe altura, data recebe o traço curto. */
function campoEmPapel(campo: CampoDef, campos: CampoDef[], valores?: Valores): string {
  const marca = campo.obrigatorio && !valores ? '<span class="obrig">*</span>' : '';
  const pai = campo.dependeDe
    ? campos.find((x) => x.chave === campo.dependeDe!.campo)?.rotulo ?? campo.dependeDe.campo
    : null;
  const aceitos = campo.dependeDe
    ? (Array.isArray(campo.dependeDe.valor) ? campo.dependeDe.valor : [campo.dependeDe.valor])
    : [];
  const condicao = pai
    ? `<div class="cond">Preencher só quando <b>${esc(pai)}</b> for ${esc(aceitos.join(' ou '))}</div>`
    : '';
  const ajuda = campo.ajuda ? `<div class="ajuda">${esc(campo.ajuda)}</div>` : '';

  // Na folha PREENCHIDA marca-se o que foi escolhido; na em branco todos ficam abertos.
  const opcoes = (lista: string[], escolhido?: string) =>
    `<div class="opcoes">${lista.map((o) =>
      `<span class="op">${escolhido === o ? '&#9746;' : '&#9744;'} ${esc(o)}</span>`).join('')}</div>`;

  if (valores) {
    const bruto = valores[campo.chave]?.trim() ?? '';
    // Campo sem resposta sai com um traço, e não com linha em branco. Linha em branco num
    // registro impresso é convite para alguém preencher depois — e registro alterado depois de
    // emitido é adulteração de evidência, não correção.
    const conteudo = !bruto ? '<span class="vazio">&mdash;</span>'
      : campo.tipo === 'escolha' && campo.opcoes ? opcoes(campo.opcoes, bruto)
      : campo.tipo === 'sim_nao' ? opcoes(['Sim', 'Não'], bruto)
      : `<div class="valor${campo.tipo === 'texto_longo' ? ' longo' : ''}">${esc(br(bruto))}</div>`;
    return `
      <div class="campo preenchido">
        <div class="rot">${esc(campo.rotulo)}</div>
        ${conteudo}
      </div>`;
  }

  const espaco =
    campo.tipo === 'escolha' && campo.opcoes ? opcoes(campo.opcoes)
    : campo.tipo === 'sim_nao' ? opcoes(['Sim', 'Não'])
    : campo.tipo === 'texto_longo' ? '<div class="caixa alta"></div>'
    : campo.tipo === 'data' || campo.tipo === 'hora' ? '<div class="caixa curta"></div>'
    : '<div class="caixa"></div>';

  return `
    <div class="campo${campo.dependeDe ? ' condicional' : ''}">
      <div class="rot">${esc(campo.rotulo)}${marca}</div>
      ${ajuda}${condicao}${espaco}
    </div>`;
}

/** Os anexos, no papel. A foto entra quando a tela já a carregou; o arquivo entra pelo nome, que
 *  é o que permite achá-lo no sistema. Anexo sem imagem não vira buraco: vira linha. */
function anexosEmPapel(anexos: Anexo[]): string {
  if (anexos.length === 0) return '';
  const fotos = anexos.filter((a) => a.tipo === 'foto' && a.url);
  const resto = anexos.filter((a) => !(a.tipo === 'foto' && a.url));
  return `
  <div class="anexosDoRegistro">
    <b>Evidências anexadas &mdash; ${anexos.length}</b>
    ${fotos.length ? `<div class="fotos">${fotos.map((a) => `
      <figure><img src="${esc(a.url!)}" alt="${esc(a.legenda || a.nome)}">
      <figcaption>${esc(a.legenda || a.nome)}</figcaption></figure>`).join('')}</div>` : ''}
    ${resto.length ? `<ul class="arquivos">${resto.map((a) =>
      `<li>${esc(a.nome)}${a.legenda ? ` &mdash; ${esc(a.legenda)}` : ''}</li>`).join('')}</ul>` : ''}
  </div>`;
}

/** `semBotoes` é para quando a folha é desenhada DENTRO do sistema, e não numa janela: ali quem
 *  manda imprimir e fechar é a tela que a envolve, e um "Fechar" que chama `window.close()` de
 *  dentro de um iframe não fecha nada. */
function folha(
  def: FormularioDef, registro?: RegistroParaFolha | null, opcoes?: { semBotoes?: boolean },
): string {
  const empresa = empresaAtiva();
  const carimbo = carimboDoPapel(def.papel);
  const lista = empresa.documentacao.meta.codigo;
  // Na folha preenchida só entram os campos que EXISTIAM naquele registro. Um campo condicional
  // cuja condição não se deu nunca foi perguntado — imprimi-lo vazio faria parecer que alguém
  // deixou de responder.
  const campos = registro
    ? def.campos.filter((c) => campoVisivel(c, registro.valores))
    : def.campos;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${esc(carimbo ?? def.titulo)} — ${esc(def.titulo)}${registro ? ` — ${esc(br(registro.criadoEm))}` : ''}</title>
<style>
  @page { size: A4; margin: 14mm 12mm 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 18px 20px 28px; background: #fff; color: #1a1a1a;
    font: 13px/1.5 -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    max-width: 820px; margin-inline: auto;
  }
  header { border-bottom: 2px solid ${esc(empresa.identidade.acento)}; padding-bottom: 10px; margin-bottom: 4px; }
  .topo { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .empresa { font-size: 15px; font-weight: 700; letter-spacing: .01em; }
  .sub { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: .08em; }
  .carimbo { font-family: ui-monospace, "Cascadia Mono", Consolas, monospace; font-size: 12.5px; font-weight: 700; text-align: right; }
  .clausula { font-size: 11px; color: #666; text-align: right; margin-top: 2px; }
  h1 { font-size: 17px; margin: 12px 0 4px; }
  .explicacao { font-size: 12px; color: #444; margin: 0 0 14px; max-width: 62ch; }
  .campos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; }
  .campo { break-inside: avoid; }
  .campo.condicional { border-left: 2px solid #d8d8d8; padding-left: 8px; }
  .rot { font-size: 11.5px; font-weight: 600; color: #333; }
  .obrig { color: #b00; margin-left: 3px; }
  .ajuda { font-size: 10.5px; color: #777; margin-top: 1px; }
  .cond { font-size: 10.5px; color: #8a6d00; margin-top: 1px; }
  .caixa { border: 1px solid #999; border-radius: 2px; height: 26px; margin-top: 4px; }
  .caixa.alta { height: 58px; }
  .caixa.curta { width: 130px; }
  .opcoes { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 5px; }
  .op { font-size: 11.5px; }
  .largo { grid-column: 1 / -1; }
  .anexos { margin-top: 16px; border: 1px dashed #999; border-radius: 3px; padding: 10px 12px; break-inside: avoid; }
  .anexos b { font-size: 12px; }
  .anexos p { font-size: 11px; color: #666; margin: 3px 0 0; }
  .valor { border-bottom: 1px solid #bbb; padding: 3px 0 2px; margin-top: 3px; min-height: 19px; font-size: 12.5px; white-space: pre-wrap; }
  .valor.longo { border: 1px solid #ddd; border-radius: 2px; padding: 6px 8px; background: #fbfbfb; }
  .vazio { color: #999; font-size: 12.5px; display: block; margin-top: 3px; }
  .campo.preenchido .rot { color: #666; font-weight: 600; }
  .registro { display: flex; gap: 22px; flex-wrap: wrap; font-size: 11.5px; color: #444; margin: 0 0 12px; }
  .registro b { color: #1a1a1a; }
  .anexosDoRegistro { margin-top: 16px; break-inside: avoid; }
  .anexosDoRegistro b { font-size: 12px; }
  .fotos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 8px; }
  .fotos figure { margin: 0; break-inside: avoid; }
  .fotos img { width: 100%; height: 150px; object-fit: cover; border: 1px solid #999; border-radius: 2px; display: block; }
  .fotos figcaption { font-size: 10.5px; color: #555; margin-top: 3px; }
  .arquivos { margin: 6px 0 0; padding-left: 18px; font-size: 11.5px; color: #444; }
  .assina { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; margin-top: 26px; break-inside: avoid; }
  .assina div { border-top: 1px solid #333; padding-top: 4px; font-size: 11px; color: #555; }
  footer { margin-top: 22px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 10px; color: #666; }
  .controlado { font-weight: 600; color: #333; }
  .acoes { margin: 0 0 16px; display: flex; gap: 8px; }
  .acoes button {
    font: inherit; font-size: 12px; padding: 6px 14px; cursor: pointer;
    border: 1px solid #999; border-radius: 3px; background: #f4f4f4;
  }
  @media print { .acoes { display: none; } body { padding: 0; } }
</style>
</head>
<body>
  ${opcoes?.semBotoes ? '' : `<div class="acoes">
    <button onclick="window.print()">Imprimir ou salvar em PDF</button>
    <button onclick="window.close()">Fechar</button>
  </div>`}

  <header>
    <div class="topo">
      <div>
        <div class="empresa">${esc(empresa.identidade.nome)}</div>
        <div class="sub">${esc(empresa.identidade.subtitulo)}</div>
      </div>
      <div>
        <div class="carimbo">${esc(carimbo ?? 'SEM CÓDIGO')}</div>
        <div class="clausula">${esc(empresa.documentacao.meta.norma)} &sect;${esc(def.clausula)}</div>
      </div>
    </div>
    <h1>${esc(def.titulo)}</h1>
  </header>

  ${registro ? `
  <div class="registro">
    <span>Registrado em <b>${esc(br(registro.criadoEm))}</b></span>
    <span>Por <b>${esc(registro.criadoPor ?? '—')}</b></span>
    <span>Identificação interna <b>${esc(registro.id)}</b></span>
  </div>`
  : `<p class="explicacao">${esc(def.explicacao)}</p>`}

  <div class="campos">
    ${campos.map((c) => {
      const largo = c.tipo === 'texto_longo' || (c.opcoes?.length ?? 0) > 4;
      return `<div class="${largo ? 'largo' : ''}">${campoEmPapel(c, def.campos, registro?.valores)}</div>`;
    }).join('')}
  </div>

  ${registro ? anexosEmPapel(registro.anexos) : (def.anexos ? `
  <div class="anexos">
    <b>${esc(def.anexos.titulo)}</b>
    <p>${def.anexos.minimoDeFotos
      ? `Obrigatório: ${def.anexos.minimoDeFotos === 1 ? 'uma foto' : `${def.anexos.minimoDeFotos} fotos`}. No papel, anexar e numerar.`
      : 'Anexar quando houver. Numerar os anexos e citá-los no registro.'}</p>
  </div>` : '')}

  <div class="assina">
    <div>Preenchido por &mdash; ${registro
      ? `${esc(registro.criadoPor ?? '—')}, ${esc(br(registro.criadoEm))}`
      : 'nome e data'}</div>
    <div>Verificado por &mdash; nome e data</div>
  </div>

  <footer>
    <span class="controlado">Cópia impressa.</span>
    ${registro
      ? `O registro original é o do sistema, e é ele que vale &mdash; esta folha é uma cópia dele, e alterá-la à mão não altera o registro. Formulário controlado na Lista Mestra ${esc(lista)}.`
      : `O documento controlado é o da Lista Mestra ${esc(lista)} &mdash; confira a revisão vigente antes de usar. Modelo em branco, sem registro.`}
    Impresso em ${esc(dataDeHoje())}.
  </footer>
</body>
</html>`;
}

/** Abre a folha numa janela própria — o formulário em branco, ou um registro preenchido. Devolve
 *  false quando o navegador bloqueou o pop-up, para a tela poder dizer isso em vez de parecer que
 *  o botão não funciona. */
export function abrirFormularioEmJanela(
  def: FormularioDef, registro?: RegistroParaFolha | null,
): boolean {
  // Nome fixo por folha: clicar duas vezes na mesma reaproveita a janela dela, e duas folhas
  // diferentes abrem em janelas diferentes — que é o que permite compará-las. O registro entra no
  // nome para dois casos do mesmo formulário não brigarem pela mesma janela.
  const nome = registro ? `registro-${def.papel}-${registro.id}` : `formulario-${def.papel}`;
  const janela = window.open('', nome, 'width=900,height=1000');
  if (!janela) return false;
  janela.document.open();
  janela.document.write(folha(def, registro));
  janela.document.close();
  janela.focus();
  return true;
}

/** A folha pronta, para o teste poder olhá-la sem abrir janela nenhuma. */
export const folhaDoFormulario = folha;
