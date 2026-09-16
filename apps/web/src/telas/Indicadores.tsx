// INDICADORES DO SGQ — o painel da 9.1.1, e o que a análise crítica pela direção consome.
//
// Não é a planilha de novo em forma de tela. A planilha mostra o número; aqui o número vem
// acompanhado de três coisas que ela não tem:
//
//   · o veredito CALCULADO da meta, sempre do mesmo jeito, sem ninguém marcar caixinha;
//   · a conta refeita a partir dos componentes, comparada com o que a planilha registrou;
//   · o que não fecha — parte maior que o todo, série que parou no meio do ano, dois indicadores
//     andando idênticos.
//
// O último bloco é o que interessa numa auditoria. Indicador é evidência: se ninguém consegue
// refazer a conta, ele não prova nada, por melhor que seja o número.
import { Fragment, useMemo, useState } from 'react';
import {
  ROTULO_SITUACAO, comoTexto, nomeDoPeriodo, problemas, resultado, seriesIguais, situacao,
  type Apuracao, type Indicador, type Problema, type Situacao,
} from '@/plataforma/indicadores';
import { empresaAtiva } from '@/plataforma/empresa';
import { carimboDoPapel } from '@/documentos/listaMestra';
import { c, fonte, pastilha, s } from '@/ui/estilo';
import { useEhCelular } from '@/ui/tela';
import { Cabecalho } from './Vencimentos';

const TOM: Record<Situacao, 'ok' | 'alerta' | 'critico' | 'neutro'> = {
  boa: 'ok', limite: 'alerta', ruim: 'critico', sem_dado: 'neutro',
};

const TITULO_PROBLEMA: Record<Problema['tipo'], string> = {
  parte_maior_que_o_todo: 'A parte é maior que o todo',
  acima_do_teto: 'Resultado acima do máximo possível',
  conta_nao_bate: 'A conta não bate com os componentes',
  sem_componentes: 'Só o resultado, sem de onde ele saiu',
  serie_interrompida: 'Parou de ser apurado',
};

export function Indicadores() {
  const empresa = empresaAtiva();
  const indicadores = empresa.indicadores ?? [];
  const apuracoes = empresa.apuracoes ?? [];
  const celular = useEhCelular();
  const selo = carimboDoPapel('monitoramento_sgq');
  const [aberto, setAberto] = useState<string | null>(null);

  const periodos = useMemo(
    () => [...new Set(apuracoes.map((a) => a.periodo))].sort(),
    [apuracoes],
  );
  const achados = useMemo(() => problemas(indicadores, apuracoes), [indicadores, apuracoes]);
  const gemeos = useMemo(() => seriesIguais(indicadores, apuracoes), [indicadores, apuracoes]);

  const nomeDe = (chave: string) => indicadores.find((i) => i.chave === chave)?.nome ?? chave;
  const ultimo = periodos[periodos.length - 1];

  if (!indicadores.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Cabecalho titulo="Indicadores do SGQ" sub="ISO 9001:2015 §9.1.1" />
        <div style={{ ...s.cartao, padding: 18, fontSize: 13.5, color: c.suave, lineHeight: 1.6 }}>
          Esta empresa ainda não tem indicadores cadastrados. Sem eles, a análise crítica pela
          direção não tem o que analisar — é o que a 9.1.1 pede que se retenha.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Cabecalho
        titulo="Indicadores do SGQ"
        sub={`${selo ? `${selo} · ` : ''}ISO 9001:2015 §9.1.1 — ${indicadores.length} indicadores, apurados de ${nomeDoPeriodo(periodos[0])} a ${nomeDoPeriodo(ultimo)}. O veredito da meta é calculado, não escolhido.`}
      />

      {/* ── O painel ──────────────────────────────────────────────────────────────────────── */}
      <div style={{ ...s.cartao, overflowX: 'auto' }}>
        <table style={s.tabela}>
          <thead>
            <tr>
              <th style={s.th}>Indicador</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Meta</th>
              <th style={{ ...s.th, textAlign: 'right' }}>{celular ? 'Últ.' : nomeDoPeriodo(ultimo)}</th>
              <th style={s.th}>Situação</th>
              {!celular && <th style={s.th}>Série</th>}
            </tr>
          </thead>
          <tbody>
            {indicadores.map((ind) => {
              const minhas = apuracoes
                .filter((a) => a.indicador === ind.chave)
                .sort((x, y) => x.periodo.localeCompare(y.periodo));
              const fim = minhas[minhas.length - 1];
              const sit = fim ? situacao(ind, fim) : 'sem_dado';
              const meus = achados.filter((p) => p.indicador === ind.chave);
              const escolhido = aberto === ind.chave;

              return (
                <Fragment key={ind.chave}>
                  <tr
                    onClick={() => setAberto(escolhido ? null : ind.chave)}
                    style={{ cursor: 'pointer', background: escolhido ? c.superficie2 : undefined }}
                  >
                    <td style={s.td}>
                      <div style={{ fontWeight: escolhido ? 700 : 500 }}>{ind.nome}</div>
                      {meus.length > 0 && (
                        <div style={S.alerta}>
                          {meus.length === 1 ? '1 ponto a conferir' : `${meus.length} pontos a conferir`}
                        </div>
                      )}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right', fontFamily: fonte.mono, color: c.suave }}>
                      {ind.sentido === 'maior_melhor' ? '≥ ' : '≤ '}{comoTexto(ind, ind.meta)}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right', fontFamily: fonte.mono, fontWeight: 600 }}>
                      {fim ? comoTexto(ind, resultado(fim)) : '—'}
                    </td>
                    <td style={s.td}><span style={pastilha(TOM[sit])}>{ROTULO_SITUACAO[sit]}</span></td>
                    {!celular && (
                      <td style={{ ...s.td, fontFamily: fonte.mono, fontSize: 12, color: c.suave }}>
                        {minhas.map((a) => {
                          const st = situacao(ind, a);
                          return (
                            <span
                              key={a.periodo}
                              title={`${nomeDoPeriodo(a.periodo)}: ${comoTexto(ind, resultado(a))}`}
                              style={{ ...S.ponto, background: st === 'ruim' ? c.critico : st === 'limite' ? c.alerta : c.ok }}
                            />
                          );
                        })}
                      </td>
                    )}
                  </tr>

                  {escolhido && (
                    <tr>
                      <td colSpan={celular ? 4 : 5} style={S.detalhe}>
                        <Detalhe ind={ind} apuracoes={minhas} achados={meus} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── O que não fecha ───────────────────────────────────────────────────────────────── */}
      {(achados.length > 0 || gemeos.length > 0) && (
        <div style={s.cartao}>
          <div style={S.faixa}>
            <span>O que não fecha</span>
            <span>{achados.length + gemeos.length} pontos</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {gemeos.map(([a, b]) => (
              <div key={`${a}-${b}`} style={S.achado}>
                <div style={S.achadoTitulo}>Dois indicadores com a mesma série, mês a mês</div>
                <div style={S.achadoTexto}>
                  <strong>{nomeDe(a)}</strong> e <strong>{nomeDe(b)}</strong> repetem os mesmos
                  números em todos os meses apurados. A direção acha que olha dois sinais e olha um.
                </div>
              </div>
            ))}
            {achados.map((p, i) => (
              <div key={`${p.indicador}-${p.tipo}-${p.periodo ?? i}`} style={S.achado}>
                <div style={S.achadoTitulo}>
                  {TITULO_PROBLEMA[p.tipo]}
                  {p.periodo && <span style={S.achadoMes}> · {nomeDoPeriodo(p.periodo)}</span>}
                </div>
                <div style={S.achadoTexto}><strong>{nomeDe(p.indicador)}</strong> — {p.detalhe}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={S.rodape}>
        Transcrito da planilha de indicadores da empresa. Nenhum número foi corrigido na
        transcrição: onde a planilha diz 104%, aqui diz 104%, e o app aponta em vez de consertar.
      </p>
    </div>
  );
}

/* ── O detalhe de um indicador ─────────────────────────────────────────────────────────────── */

function Detalhe({ ind, apuracoes, achados }: {
  ind: Indicador; apuracoes: Apuracao[]; achados: Problema[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {ind.nota && <div style={{ ...S.nota, ...s.prosa }}>{ind.nota}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ ...s.tabela, fontSize: 13 }}>
          <thead>
            <tr>
              <th style={s.th}>Período</th>
              {ind.numeradorRotulo && <th style={{ ...s.th, textAlign: 'right' }}>{ind.numeradorRotulo}</th>}
              {ind.denominadorRotulo && <th style={{ ...s.th, textAlign: 'right' }}>{ind.denominadorRotulo}</th>}
              <th style={{ ...s.th, textAlign: 'right' }}>Resultado</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Na planilha</th>
            </tr>
          </thead>
          <tbody>
            {apuracoes.map((a) => {
              const valor = resultado(a);
              const difere = a.naPlanilha !== undefined && valor !== null
                && Math.abs(valor - a.naPlanilha) >= 0.00005;
              return (
                <tr key={a.periodo}>
                  <td style={{ ...s.td, fontFamily: fonte.mono }}>{nomeDoPeriodo(a.periodo)}</td>
                  {ind.numeradorRotulo && (
                    <td style={{ ...s.td, textAlign: 'right', fontFamily: fonte.mono }}>{a.numerador ?? '—'}</td>
                  )}
                  {ind.denominadorRotulo && (
                    <td style={{ ...s.td, textAlign: 'right', fontFamily: fonte.mono }}>{a.denominador ?? '—'}</td>
                  )}
                  <td style={{ ...s.td, textAlign: 'right', fontFamily: fonte.mono, fontWeight: 600 }}>
                    {comoTexto(ind, valor)}
                  </td>
                  <td style={{
                    ...s.td, textAlign: 'right', fontFamily: fonte.mono,
                    color: difere ? c.critico : c.suave,
                  }}>
                    {a.naPlanilha === undefined ? '—' : comoTexto(ind, a.naPlanilha)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {achados.map((p, i) => (
        <div key={i} style={S.detalheAchado}>
          <strong>{TITULO_PROBLEMA[p.tipo]}</strong>
          {p.periodo && ` (${nomeDoPeriodo(p.periodo)})`} — {p.detalhe}
        </div>
      ))}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  faixa: {
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12,
    padding: '10px 18px', background: c.superficie2, borderBottom: `1px solid ${c.linhaForte}`,
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: c.tinta2,
  },
  alerta: { fontSize: 11.5, color: c.alerta, marginTop: 3 },
  ponto: {
    display: 'inline-block', width: 9, height: 9, borderRadius: '50%', marginRight: 4,
    verticalAlign: 'middle',
  },
  detalhe: { padding: '4px 18px 18px', background: c.superficie2, borderBottom: `1px solid ${c.linha}` },
  nota: { fontSize: 13, color: c.tinta2, lineHeight: 1.6 },
  achado: {
    padding: '13px 18px', borderBottom: `1px solid ${c.linha}`,
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  achadoTitulo: { fontSize: 12.5, fontWeight: 700, color: c.tinta },
  achadoMes: { fontWeight: 400, color: c.suave },
  achadoTexto: { fontSize: 13.5, color: c.tinta2, lineHeight: 1.55 },
  detalheAchado: {
    padding: '10px 14px', borderRadius: 3, background: c.criticoFraco,
    border: `1px solid ${c.critico}33`, fontSize: 13, color: c.tinta2, lineHeight: 1.55,
  },
  rodape: { fontFamily: fonte.mono, fontSize: 11.5, color: c.suave, lineHeight: 1.6 },
};
