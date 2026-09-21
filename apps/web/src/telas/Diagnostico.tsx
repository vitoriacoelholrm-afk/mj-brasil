// Diagnóstico de aderência à ISO 9001:2015.
//
// A avaliação é editável e TUDO recalcula na hora: aderência, gaps e severidade. Os gaps não são
// escritos à mão — saem de gerarGaps(), a mesma função dos testes.
//
// AINDA SEM BANCO: o que você mudar aqui vive só nesta aba. Persistir depende de migrar as
// tabelas do diagnóstico para o app.
import { useMemo, useState } from 'react';
import { aderencia, gerarGaps, type ItemParaGap } from '@/diagnostico/regras';
import { AVALIACAO_ROTULO, type Avaliacao, type Severidade } from '@/diagnostico/vocabulario';
import { ITENS_MINASJATO } from '@/diagnostico/minasjato';
import { c, fonte, pastilha, s } from '@/ui/estilo';
import { Cabecalho } from '@/ui/Cabecalho';

const OPCOES: (Avaliacao | 'pendente')[] = ['pendente', 'nao_atende', 'atende_parcial', 'atende', 'nao_aplicavel'];

const TOM_SEV: Record<Severidade, 'critico' | 'alerta' | 'neutro'> = {
  critica: 'critico', alta: 'alerta', media: 'neutro', baixa: 'neutro',
};

const COR_AVALIACAO: Record<string, string> = {
  nao_atende: c.critico,
  atende_parcial: c.alerta,
  atende: c.ok,
  nao_aplicavel: c.suave,
  pendente: c.suave,
};

export function Diagnostico() {
  const [itens, setItens] = useState<ItemParaGap[]>(ITENS_MINASJATO);
  const [soGaps, setSoGaps] = useState(false);

  const a = useMemo(() => aderencia(itens), [itens]);
  const gaps = useMemo(() => gerarGaps(itens), [itens]);
  const porClausula = useMemo(() => new Map(gaps.map((g) => [g.clausulaRef, g])), [gaps]);

  function avaliar(ref: string, valor: string) {
    setItens((atual) => atual.map((i) => i.clausulaRef === ref
      ? { ...i, avaliacao: valor === 'pendente' ? null : (valor as Avaliacao) }
      : i));
  }

  const visiveis = soGaps ? itens.filter((i) => porClausula.has(i.clausulaRef)) : itens;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Cabecalho
        titulo="Diagnóstico ISO 9001:2015"
        sub="Rascunho documental de 16/09/2026, aguardando revisão. Mude uma avaliação e tudo recalcula."
      />

      <div style={S.aviso}>
        Montado lendo documentos — sem visita e sem entrevista. As cláusulas marcadas como
        <strong> a verificar</strong> não receberam nota: uma cláusula pode estar atendida na prática
        com documentação fraca, e o contrário também.
      </div>

      <div style={S.contadores}>
        <div style={S.contador}>
          <div style={S.numero}>{itens.length}</div>
          <div style={S.rot}>cláusulas no escopo</div>
        </div>
        <div style={S.contador}>
          <div style={S.numero}>{a.avaliados}</div>
          <div style={S.rot}>avaliadas</div>
        </div>
        <div style={S.contador}>
          <div style={{ ...S.numero, color: c.suave }}>{a.pendentes}</div>
          <div style={S.rot}>a verificar em campo</div>
        </div>
        <div style={S.contador}>
          <div style={{ ...S.numero, color: c.suave }}>{a.naoAplicaveis}</div>
          <div style={S.rot}>não aplicáveis</div>
        </div>
        <div style={S.contador}>
          <div style={{ ...S.numero, color: a.percentual === null ? c.suave : a.percentual >= 80 ? c.ok : a.percentual >= 60 ? c.alerta : c.critico }}>
            {a.percentual === null ? '—' : `${a.percentual}%`.replace('.', ',')}
          </div>
          <div style={S.rot}>aderência documental</div>
        </div>
        <div style={{ ...S.contador, borderRight: 'none' }}>
          <div style={{ ...S.numero, color: gaps.length ? c.acento : c.ok }}>{gaps.length}</div>
          <div style={S.rot}>gaps gerados</div>
        </div>
      </div>

      {gaps.length > 0 && (
        <div style={S.resumoGaps}>
          {(['critica', 'alta', 'media', 'baixa'] as Severidade[]).map((sev) => {
            const n = gaps.filter((g) => g.severidade === sev).length;
            if (!n) return null;
            return (
              <span key={sev} style={pastilha(TOM_SEV[sev])}>
                {n} {sev}{n > 1 ? 's' : ''}
              </span>
            );
          })}
          <span style={{ flexGrow: 1 }} />
          <button style={S.alternar} onClick={() => setSoGaps((v) => !v)}>
            {soGaps ? 'mostrar as 37 cláusulas' : 'mostrar só os gaps'}
          </button>
        </div>
      )}

      <div style={{ ...s.cartao, overflowX: 'auto' }}>
        <table style={s.tabela}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: 72 }}>Cláusula</th>
              <th style={s.th}>Requisito</th>
              <th style={{ ...s.th, width: 190 }}>Avaliação</th>
              <th style={{ ...s.th, width: 110 }}>Gap</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((i) => {
              const g = porClausula.get(i.clausulaRef);
              const valor = i.avaliacao ?? 'pendente';
              return (
                <tr key={i.clausulaRef}>
                  <td style={{ ...s.td, ...s.mono, fontWeight: 600 }}>{i.clausulaRef}</td>
                  <td style={{ ...s.td, color: c.tinta }}>
                    {i.clausulaTitulo}
                    {i.peso === 'alto' && <span style={S.peso}>peso alto</span>}
                    {i.justificativaNa && <div style={S.justificativa}>{i.justificativaNa}</div>}
                  </td>
                  <td style={s.td}>
                    <select
                      value={valor}
                      onChange={(e) => avaliar(i.clausulaRef, e.target.value)}
                      style={{ ...S.select, color: COR_AVALIACAO[valor], borderColor: valor === 'pendente' ? c.linhaForte : COR_AVALIACAO[valor] }}
                    >
                      {OPCOES.map((o) => (
                        <option key={o} value={o}>
                          {o === 'pendente' ? 'A verificar' : AVALIACAO_ROTULO[o as Avaliacao]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={s.td}>
                    {g ? <span style={pastilha(TOM_SEV[g.severidade])}>{g.severidade}</span>
                       : <span style={{ color: c.suave, fontSize: 13 }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={S.rodape}>
        Sem banco ainda — o que você mudar aqui vive só nesta aba e some ao recarregar.
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  aviso: {
    padding: '12px 16px', borderRadius: 3, background: c.acentoFraco,
    border: `1px solid ${c.acentoMarca}`, color: c.acento, fontSize: 13.5, lineHeight: 1.55,
  },
  contadores: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
    border: `1px solid ${c.linhaForte}`, background: c.superficie, borderRadius: 3, overflow: 'hidden',
  },
  contador: { padding: '15px 18px', borderRight: `1px solid ${c.linha}` },
  numero: {
    fontSize: 27, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1,
    fontVariantNumeric: 'tabular-nums', color: c.tinta,
  },
  rot: { fontSize: 11.5, color: c.suave, marginTop: 6, lineHeight: 1.35 },
  resumoGaps: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  alternar: {
    border: 'none', background: 'none', padding: 0, cursor: 'pointer',
    fontFamily: fonte.texto, fontSize: 12.5, color: c.acento,
    textDecoration: 'underline', textUnderlineOffset: 2,
  },
  select: {
    fontFamily: fonte.texto, fontSize: 13, fontWeight: 600,
    padding: '6px 9px', borderRadius: 3, border: '1px solid',
    background: c.superficie, width: '100%', cursor: 'pointer',
  },
  peso: {
    marginLeft: 8, fontFamily: fonte.mono, fontSize: 10.5,
    color: c.acento, border: `1px solid ${c.acentoMarca}`,
    background: c.acentoFraco, padding: '1px 5px', borderRadius: 2,
  },
  justificativa: {
    marginTop: 5, fontSize: 12, color: c.suave, lineHeight: 1.5,
    paddingLeft: 9, borderLeft: `2px solid ${c.linha}`,
  },
  rodape: { fontFamily: fonte.mono, fontSize: 11.5, color: c.suave },
};
