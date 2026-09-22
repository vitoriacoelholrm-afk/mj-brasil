// Painel de vencimentos — o semáforo do MJ-CAL-01 §9.1 ("notifica com 30 dias de antecedência")
// estendido a tudo que expira: calibração de instrumento, certificação de inspetor, licença.
// Lê compliance-certifications.vencimientosBoard, que já devolve os baldes prontos.
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { usarDados } from '@/lib/usarDados';
import { papelAtual } from '@/lib/session';
import { podeCadastrar } from '@/plataforma/acesso';
import { c, dataBR, diasAte, fonte, pastilha, s } from '@/ui/estilo';
import { Aviso, Cabecalho } from '@/ui/Cabecalho';
import { FormCalibracao, type AlvoDaCalibracao } from './FormCalibracao';

interface Credencial {
  id: string;
  holder_kind: string;
  holder_id: string | null;
  holder_label: string;
  kind: string;
  title: string | null;
  number: string | null;
  expires_at: string | null;
  status: string;
  bucket: string;
}
interface Painel {
  buckets: Record<string, Credencial[]>;
  counts: Record<string, number>;
}

const BALDES = [
  { chave: 'expired', rotulo: 'Vencidos', tom: 'critico' as const },
  { chave: 'd7', rotulo: 'Vencem em 7 dias', tom: 'critico' as const },
  { chave: 'd15', rotulo: 'Vencem em 15 dias', tom: 'alerta' as const },
  { chave: 'd30', rotulo: 'Vencem em 30 dias', tom: 'alerta' as const },
  { chave: 'later', rotulo: 'Em dia', tom: 'ok' as const },
];

const TIPO: Record<string, string> = {
  calibracao: 'Calibração',
  certificacao_inspetor: 'Certificação',
};

export function Vencimentos() {
  const [calibrando, setCalibrando] = useState<AlvoDaCalibracao | null>(null);
  // Renovar aqui é o mesmo ato do inventário, e por isso a mesma permissão: quem mede é quem
  // responde pelo instrumento. Quem só acompanha continua vendo o painel inteiro.
  const podeRenovar = podeCadastrar(papelAtual(), 'instrumentos');
  const { dados, carregando, erro, recarregar } = usarDados<Painel>(
    () => (trpc as any)['compliance-certifications'].vencimientosBoard.query({}),
  );

  if (carregando) return <Aviso texto="Carregando…" />;
  if (erro) return <Aviso texto={erro} erro />;
  if (!dados) return <Aviso texto="Sem dados." />;

  const total = Object.values(dados.counts ?? {}).reduce((a, b) => a + b, 0);
  const atencao = (dados.counts?.expired ?? 0) + (dados.counts?.d7 ?? 0) + (dados.counts?.d15 ?? 0) + (dados.counts?.d30 ?? 0);

  return (
    <div>
      <Cabecalho
        titulo="Vencimentos"
        sub="Calibração de instrumentos, certificações e licenças — tudo que expira, num lugar só."
      />

      {calibrando && podeRenovar && (
        <FormCalibracao
          alvo={calibrando}
          aoFechar={() => setCalibrando(null)}
          aoSalvar={() => { setCalibrando(null); recarregar(); }}
        />
      )}

      <div style={S.contadores}>
        {BALDES.map((b) => (
          <div key={b.chave} style={S.contador}>
            <div style={{ ...S.numero, color: (dados.counts?.[b.chave] ?? 0) > 0 && b.tom !== 'ok' ? c[b.tom] : c.tinta }}>
              {dados.counts?.[b.chave] ?? 0}
            </div>
            <div style={S.rotuloContador}>{b.rotulo}</div>
          </div>
        ))}
      </div>

      {atencao === 0 && total > 0 && (
        <div style={S.tudoEmDia}>
          Nenhum vencimento nos próximos 30 dias. {total} {total === 1 ? 'item controlado' : 'itens controlados'}.
        </div>
      )}

      {BALDES.map((b) => {
        const linhas = dados.buckets?.[b.chave] ?? [];
        if (!linhas.length) return null;
        return (
          <section key={b.chave} style={{ marginTop: 26 }}>
            <h2 style={S.h2}>
              {b.rotulo} <span style={S.contagemInline}>{linhas.length}</span>
            </h2>
            <div style={{ ...s.cartao, overflowX: 'auto' }}>
              <table style={s.tabela}>
                <thead>
                  <tr>
                    <th style={s.th}>Item</th>
                    <th style={s.th}>Tipo</th>
                    <th style={s.th}>Certificado</th>
                    <th style={s.th}>Vence</th>
                    <th style={s.th}>Situação</th>
                    {podeRenovar && <th style={s.th} />}
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => {
                    const dias = diasAte(l.expires_at);
                    return (
                      <tr key={l.id}>
                        <td style={{ ...s.td, color: c.tinta, fontWeight: 500 }}>{l.holder_label}</td>
                        <td style={s.td}>{TIPO[l.kind] ?? l.kind}</td>
                        <td style={{ ...s.td, ...s.mono }}>{l.number ?? '—'}</td>
                        <td style={s.td}>
                          {dataBR(l.expires_at)}
                          {dias !== null && (
                            <span style={S.dias}>
                              {dias < 0 ? `há ${Math.abs(dias)} dias` : `em ${dias} dias`}
                            </span>
                          )}
                        </td>
                        <td style={s.td}><span style={pastilha(b.tom)}>{b.rotulo}</span></td>
                        {/* Só a calibração de instrumento se renova por aqui. Certificação de
                            pessoa e licença da empresa têm outro dono e outro caminho. */}
                        {podeRenovar && (
                          <td style={{ ...s.td, textAlign: 'right' }}>
                            {l.holder_kind === 'asset' && l.kind === 'calibracao' && l.holder_id && (
                              <button
                                style={s.botao}
                                onClick={() => setCalibrando({ id: l.holder_id as string, label: l.holder_label })}
                              >
                                Renovar
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {total === 0 && <Aviso texto="Nenhuma credencial cadastrada ainda." />}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  cabecalho: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 22 },
  h1: { fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', margin: 0 },
  sub: { fontSize: 14.5, color: c.suave, margin: '6px 0 0', maxWidth: '62ch' },
  h2: { fontSize: 15, fontWeight: 600, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 },
  contagemInline: {
    fontFamily: fonte.mono, fontSize: 12, color: c.suave, fontWeight: 400,
    background: c.superficie2, border: `1px solid ${c.linha}`, borderRadius: 2, padding: '1px 6px',
  },
  contadores: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 0,
    border: `1px solid ${c.linhaForte}`, background: c.superficie, borderRadius: 3, overflow: 'hidden',
  },
  contador: { padding: '16px 18px', borderRight: `1px solid ${c.linha}` },
  numero: { fontSize: 30, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
  rotuloContador: { fontSize: 12, color: c.suave, marginTop: 6 },
  tudoEmDia: {
    marginTop: 16, padding: '11px 14px', borderRadius: 3,
    background: c.okFraco, border: `1px solid ${c.ok}`, color: c.ok, fontSize: 14, fontWeight: 500,
  },
  dias: { display: 'block', fontSize: 11.5, color: c.suave, marginTop: 2 },
  aviso: {
    marginTop: 18, padding: '14px 16px', border: `1px solid ${c.linha}`,
    borderRadius: 3, background: c.superficie, fontSize: 14,
  },
};
