// O FORMULÁRIO EM BRANCO NUMA JANELA SÓ DELE — para mostrar, imprimir ou virar PDF.
//
// A sanfona do manual serve para conferir o desenho por dentro do sistema. Não serve para pôr na
// frente do auditor nem para descer ao chão de fábrica em papel: para isso o formulário precisa de
// uma folha, com cabeçalho, carimbo e espaço para escrever.
//
// Janela nova, e não uma tela do app, por três razões práticas: dá para abrir vários ao mesmo
// tempo e comparar, o Ctrl+P sai limpo sem o menu junto, e fechar a janela não tira ninguém de
// onde estava no sistema.
//
// O QUE VAI NO RODAPÉ, E POR QUÊ. Toda folha sai dizendo que é cópia impressa e que o documento
// controlado é o da Lista Mestra. Cópia impressa sem essa frase é a não conformidade de 7.5.3 mais
// fácil de levantar numa auditoria: o papel circula, o documento é revisado, e ninguém sabe que a
// folha na mão está velha.
import { empresaAtiva } from '@/plataforma/empresa';
import type { CampoDef, FormularioDef } from '@/plataforma/formularios';
import { carimboDoPapel } from '@/modules/sgq-documentos/listaMestra';

/** Escapa o que vai para o HTML. O conteúdo é nosso, mas o hábito é o que impede o dia em que
 *  deixar de ser — um título de formulário vindo do perfil de um cliente é texto de terceiro. */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const dataDeHoje = () => new Date().toLocaleDateString('pt-BR');

/** A linha de um campo, no papel. Cada tipo ganha o espaço que ele precisa para ser preenchido à
 *  mão — caixa de escolha marca com X, texto longo recebe altura, data recebe o traço curto. */
function campoEmPapel(campo: CampoDef, campos: CampoDef[]): string {
  const marca = campo.obrigatorio ? '<span class="obrig">*</span>' : '';
  const pai = campo.dependeDe
    ? campos.find((x) => x.chave === campo.dependeDe!.campo)?.rotulo ?? campo.dependeDe.campo
    : null;
  const valores = campo.dependeDe
    ? (Array.isArray(campo.dependeDe.valor) ? campo.dependeDe.valor : [campo.dependeDe.valor])
    : [];
  const condicao = pai
    ? `<div class="cond">Preencher só quando <b>${esc(pai)}</b> for ${esc(valores.join(' ou '))}</div>`
    : '';
  const ajuda = campo.ajuda ? `<div class="ajuda">${esc(campo.ajuda)}</div>` : '';

  const opcoes = (lista: string[]) =>
    `<div class="opcoes">${lista.map((o) => `<span class="op">&#9744; ${esc(o)}</span>`).join('')}</div>`;

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

function folha(def: FormularioDef): string {
  const empresa = empresaAtiva();
  const carimbo = carimboDoPapel(def.papel);
  const lista = empresa.documentacao.meta.codigo;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${esc(carimbo ?? def.titulo)} — ${esc(def.titulo)}</title>
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
  <div class="acoes">
    <button onclick="window.print()">Imprimir ou salvar em PDF</button>
    <button onclick="window.close()">Fechar</button>
  </div>

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

  <p class="explicacao">${esc(def.explicacao)}</p>

  <div class="campos">
    ${def.campos.map((c) => {
      const largo = c.tipo === 'texto_longo' || (c.opcoes?.length ?? 0) > 4;
      return `<div class="${largo ? 'largo' : ''}">${campoEmPapel(c, def.campos)}</div>`;
    }).join('')}
  </div>

  ${def.anexos ? `
  <div class="anexos">
    <b>${esc(def.anexos.titulo)}</b>
    <p>${def.anexos.minimoDeFotos
      ? `Obrigatório: ${def.anexos.minimoDeFotos === 1 ? 'uma foto' : `${def.anexos.minimoDeFotos} fotos`}. No papel, anexar e numerar.`
      : 'Anexar quando houver. Numerar os anexos e citá-los no registro.'}</p>
  </div>` : ''}

  <div class="assina">
    <div>Preenchido por &mdash; nome e data</div>
    <div>Verificado por &mdash; nome e data</div>
  </div>

  <footer>
    <span class="controlado">Cópia impressa.</span>
    O documento controlado é o da Lista Mestra ${esc(lista)} &mdash; confira a revisão vigente antes de usar.
    Modelo em branco, sem registro. Impresso em ${esc(dataDeHoje())}.
  </footer>
</body>
</html>`;
}

/** Abre o formulário em branco numa janela própria. Devolve false quando o navegador bloqueou o
 *  pop-up, para a tela poder dizer isso em vez de parecer que o botão não funciona. */
export function abrirFormularioEmJanela(def: FormularioDef): boolean {
  // Nome fixo por formulário: clicar duas vezes no mesmo reaproveita a janela dele, e dois
  // formulários diferentes abrem em janelas diferentes — que é o que permite compará-los.
  const janela = window.open('', `formulario-${def.papel}`, 'width=900,height=1000');
  if (!janela) return false;
  janela.document.open();
  janela.document.write(folha(def));
  janela.document.close();
  janela.focus();
  return true;
}

/** A folha pronta, para o teste poder olhá-la sem abrir janela nenhuma. */
export const folhaDoFormulario = folha;
