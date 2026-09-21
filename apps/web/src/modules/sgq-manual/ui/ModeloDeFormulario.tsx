// O FORMULÁRIO EM BRANCO — o modelo, para mostrar ao auditor.
//
// É a segunda coisa que ele pede, depois do texto: "me mostra o formulário que vocês usam". Até
// agora a resposta era abrir a tela de registro, que mostra os registros PREENCHIDOS — dados reais
// de cliente, de peça, de pessoa, na frente de quem só queria ver o modelo.
//
// Aqui é só o desenho: os campos, quais são obrigatórios, as opções de cada escolha, o que o
// sistema preenche sozinho e o que o registro exige de foto. Nada de conteúdo. O preenchido fica
// no sistema do cliente, sob o login dele — e é lá que se entra se o auditor quiser ver um caso.
//
// Não dá para preencher daqui, de propósito: a tela de registro é que preenche, com a permissão
// do setor. Um formulário que se preenchesse em dois lugares teria duas portas para a mesma
// evidência, e uma delas sem a regra de quem pode escrever.
import { useState } from 'react';
import { SETOR_ROTULO } from '@/plataforma/acesso';
import type { CampoDef, FormularioDef } from '@/plataforma/formularios';
import { carimboDoPapel, codigoDoPapel } from '@/modules/sgq-documentos/listaMestra';
import { abrirFormularioEmJanela } from '@/ui/folhaImpressa';
import { c, fonte, pastilha, s } from '@/ui/estilo';

const TIPO_ROTULO: Record<CampoDef['tipo'], string> = {
  texto: 'texto',
  texto_longo: 'texto longo',
  data: 'data',
  hora: 'hora',
  escolha: 'escolha',
  pessoa: 'pessoa',
  sim_nao: 'sim / não',
};

const PREENCHIDO_ROTULO: Record<NonNullable<CampoDef['preenchidoCom']>, string> = {
  hoje: 'o sistema preenche com a data de hoje',
  agora: 'o sistema preenche com a hora',
  quem_registra: 'o sistema preenche com quem está registrando',
};

export function ModelosDeFormulario({ defs }: { defs: FormularioDef[] }) {
  if (defs.length === 0) return null;
  return (
    <div style={{ ...s.cartao, overflow: 'hidden' }}>
      <div style={S.faixa}>
        <span style={{ flex: 1 }}>Modelo do formulário</span>
        <span style={pastilha('neutro')}>{defs.length === 1 ? 'em branco' : `${defs.length} em branco`}</span>
      </div>
      <div style={{ ...S.aviso, ...s.prosa }}>
        É o modelo, para apresentação — em branco, sem registro de ninguém. Os preenchidos ficam no
        sistema da empresa, na tela de cada um, e é lá que se abre um caso concreto se for pedido.
      </div>
      {defs.map((def) => <Modelo key={def.papel} def={def} />)}
    </div>
  );
}

function Modelo({ def }: { def: FormularioDef }) {
  // Um formulário só por vez aberto: a cláusula que tem três viraria uma parede de campos.
  const [aberto, setAberto] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  // O código é da empresa, não do formulário: cada cliente numera o seu. Sem código cadastrado a
  // tela diz isso em vez de carimbar um número inventado.
  const codigo = codigoDoPapel(def.papel);
  const carimbo = codigo ? carimboDoPapel(def.papel) : null;

  return (
    <div style={S.bloco}>
      <div style={S.cabecaLinha}>
        <button style={S.cabeca} onClick={() => setAberto((x) => !x)}>
          <span style={S.codigo}>{carimbo ?? 'sem código'}</span>
          <span style={S.cabecaCorpo}>
            <span style={S.titulo}>{def.titulo}</span>
            <span style={S.sub}>
              cláusula {def.clausula} · {SETOR_ROTULO[def.setor]} · {def.campos.length} campos
            </span>
          </span>
          <span style={S.seta} aria-hidden>{aberto ? '⌄' : '›'}</span>
        </button>
        {/* A sanfona serve para conferir o desenho aqui dentro. A janela serve para pôr na frente
            do auditor e para descer ao chão de fábrica em papel — são duas coisas diferentes, e é
            por isso que o botão não substitui o clique na linha. */}
        <button
          style={S.janela}
          title="Abre o formulário em branco numa janela própria, pronto para imprimir ou salvar em PDF"
          onClick={() => setBloqueado(!abrirFormularioEmJanela(def))}
        >
          Abrir em janela
        </button>
      </div>

      {bloqueado && (
        <div style={{ ...S.bloqueado, ...s.prosa }}>
          O navegador bloqueou a janela. Libere os pop-ups para este endereço e clique de novo —
          a janela é uma página do próprio sistema, não um site de fora.
        </div>
      )}

      {aberto && (
        <div style={S.corpo}>
          <div style={{ ...S.explicacao, ...s.prosa }}>{def.explicacao}</div>

          <table style={s.tabela}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: 34 }}>#</th>
                <th style={s.th}>Campo</th>
                <th style={{ ...s.th, width: 110 }}>Preenchimento</th>
                <th style={{ ...s.th, width: 90 }}>Exigência</th>
              </tr>
            </thead>
            <tbody>
              {def.campos.map((campo, i) => (
                <Linha key={campo.chave} campo={campo} n={i + 1} campos={def.campos} />
              ))}
            </tbody>
          </table>

          {def.anexos && (
            <div style={S.anexos}>
              <div style={S.anexosTitulo}>{def.anexos.titulo}</div>
              <div style={{ ...S.anexosNota, ...s.prosa }}>
                {def.anexos.minimoDeFotos
                  ? `O registro não fecha sem ${def.anexos.minimoDeFotos === 1 ? 'a foto' : `${def.anexos.minimoDeFotos} fotos`} — há fato que texto nenhum prova.`
                  : 'Fotos e arquivos entram como evidência, e não travam o registro.'}
              </div>
            </div>
          )}

          {!codigo && (
            <div style={{ ...S.semCodigo, ...s.prosa }}>
              Esta empresa ainda não deu código a este formulário na lista mestra. O modelo existe
              no sistema; o que falta é a entrada dele — sem código, não há como pedi-lo, revisá-lo
              nem retê-lo.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Linha({ campo, n, campos }: { campo: CampoDef; n: number; campos: CampoDef[] }) {
  // O campo do qual este depende aparece pelo RÓTULO, e não pela chave: quem lê o modelo é o
  // auditor, e "independencia" não é uma pergunta que exista em lugar nenhum da tela.
  const pai = campo.dependeDe
    ? campos.find((x) => x.chave === campo.dependeDe!.campo)?.rotulo ?? campo.dependeDe.campo
    : null;
  return (
    <tr>
      <td style={{ ...s.td, ...s.mono, color: c.suave, fontSize: 12 }}>{n}</td>
      <td style={s.td}>
        <span style={{ color: c.tinta }}>{campo.rotulo}</span>
        {campo.ajuda && <div style={{ ...S.ajuda, ...s.prosa }}>{campo.ajuda}</div>}
        {campo.opcoes && (
          <div style={S.opcoes}>
            {campo.opcoes.map((o) => <span key={o} style={S.opcao}>{o}</span>)}
          </div>
        )}
        {/* O campo condicional só existe quando a resposta anterior o traz. Sem dizer isto, quem
            lê o modelo procura na tela um campo que não vai aparecer. */}
        {campo.dependeDe && (
          <div style={S.depende}>
            só aparece quando <strong>{pai}</strong> for{' '}
            {(Array.isArray(campo.dependeDe.valor) ? campo.dependeDe.valor : [campo.dependeDe.valor]).join(' ou ')}
          </div>
        )}
      </td>
      <td style={{ ...s.td, fontSize: 12, color: c.suave }}>
        {campo.preenchidoCom
          ? PREENCHIDO_ROTULO[campo.preenchidoCom]
          : TIPO_ROTULO[campo.tipo]}
      </td>
      <td style={s.td}>
        {campo.obrigatorio
          ? <span style={pastilha('alerta')}>obrigatório</span>
          : <span style={{ fontSize: 12, color: c.suave }}>opcional</span>}
      </td>
    </tr>
  );
}

const S: Record<string, React.CSSProperties> = {
  faixa: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    padding: '10px 18px', background: c.superficie2, borderBottom: `1px solid ${c.linhaForte}`,
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: c.tinta2,
  },
  aviso: { fontSize: 13, color: c.suave, lineHeight: 1.6, padding: '12px 18px 4px' },
  bloco: { borderTop: `1px solid ${c.linha}` },
  cabecaLinha: { display: 'flex', alignItems: 'flex-start', gap: 8, paddingRight: 14, flexWrap: 'wrap' },
  janela: {
    flexShrink: 0, marginTop: 11, padding: '5px 11px', cursor: 'pointer',
    fontFamily: fonte.texto, fontSize: 12, color: c.acento,
    background: c.superficie, border: `1px solid ${c.linhaForte}`, borderRadius: 3,
  },
  bloqueado: {
    fontSize: 12.5, color: c.alerta, lineHeight: 1.6, margin: '0 18px 12px',
    padding: '9px 12px', borderRadius: 3,
    background: c.alertaFraco, border: `1px solid ${c.alerta}`,
  },
  cabeca: {
    display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 220, textAlign: 'left',
    padding: '11px 18px', border: 'none', background: 'none', cursor: 'pointer',
    fontFamily: fonte.texto,
  },
  codigo: { fontFamily: fonte.mono, fontSize: 12, fontWeight: 700, color: c.tinta2, minWidth: 92, flexShrink: 0, paddingTop: 2 },
  cabecaCorpo: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 },
  titulo: { fontSize: 14, color: c.tinta },
  sub: { fontSize: 12, color: c.suave },
  seta: { color: c.suave, fontSize: 18, lineHeight: 1.2 },
  corpo: { padding: '0 18px 16px' },
  explicacao: { fontSize: 13, color: c.tinta2, lineHeight: 1.6, padding: '0 0 12px' },
  ajuda: { fontSize: 12, color: c.suave, lineHeight: 1.5, marginTop: 3 },
  opcoes: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 },
  opcao: {
    fontSize: 11.5, color: c.tinta2, background: c.superficie2,
    border: `1px solid ${c.linhaForte}`, borderRadius: 3, padding: '1px 7px',
  },
  depende: { fontSize: 11.5, color: c.acento, marginTop: 4 },
  anexos: {
    marginTop: 14, padding: '10px 14px', borderRadius: 3,
    background: c.superficie2, border: `1px solid ${c.linhaForte}`,
  },
  anexosTitulo: { fontSize: 13, fontWeight: 600, color: c.tinta },
  anexosNota: { fontSize: 12, color: c.suave, lineHeight: 1.5, marginTop: 3 },
  semCodigo: {
    marginTop: 12, fontSize: 12.5, color: c.alerta, lineHeight: 1.6,
    padding: '10px 14px', borderRadius: 3,
    background: c.alertaFraco, border: `1px solid ${c.alerta}`,
  },
};
