// Inventário de instrumentos de medição — o MJ-REG-CAL-01 do MJ-CAL-01 §7, cruzado com a
// credencial de calibração de cada um. Um instrumento sem calibração válida é o que o portão G1
// do módulo do dossiê vai recusar; aqui ele já aparece marcado.
import { useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { usarDados } from '@/lib/usarDados';
import { papelAtual } from '@/lib/session';
import { motivoDoCadastro, podeCadastrar } from '@/plataforma/acesso';
import { c, dataBR, diasAte, fonte, pastilha, s } from '@/ui/estilo';
import { Aviso, Cabecalho } from '@/ui/Cabecalho';
import { FormCalibracao, type AlvoDaCalibracao } from './FormCalibracao';

interface Ativo {
  id: string; code: string; name: string; area: string | null;
  lifecycle_status: string; health_status: string | null;
}
interface Credencial {
  holder_id: string | null; kind: string; number: string | null; expires_at: string | null; status: string;
}

export function Instrumentos() {
  const [novo, setNovo] = useState(false);
  const [calibrando, setCalibrando] = useState<AlvoDaCalibracao | null>(null);
  const papel = papelAtual();
  // Consultar o inventário é de todo mundo; cadastrar instrumento e registrar calibração é de
  // quem mede. Até 21/09/2026 esta tela não perguntava nada.
  const podeEscrever = podeCadastrar(papel, 'instrumentos');
  const bloqueio = motivoDoCadastro(papel, 'instrumentos');

  const ativos = usarDados<{ rows: Ativo[] } | Ativo[]>(
    () => (trpc as any)['equipment-maintenance'].listAssets.query({}),
  );
  const creds = usarDados<{ rows: Credencial[] } | Credencial[]>(
    () => (trpc as any)['compliance-certifications'].listCredentials.query({ kind: 'calibracao' }),
  );

  const linhas = useMemo(() => {
    const a: Ativo[] = (ativos.dados as any)?.rows ?? (ativos.dados as any) ?? [];
    const k: Credencial[] = (creds.dados as any)?.rows ?? (creds.dados as any) ?? [];
    const porAtivo = new Map<string, Credencial>();
    for (const cr of k) if (cr.holder_id) porAtivo.set(cr.holder_id, cr);
    return a.map((x) => ({ ativo: x, cal: porAtivo.get(x.id) ?? null }));
  }, [ativos.dados, creds.dados]);

  if (ativos.carregando || creds.carregando) return <Aviso texto="Carregando…" />;
  if (ativos.erro) return <Aviso texto={ativos.erro} erro />;

  return (
    <div>
      <Cabecalho
        titulo="Instrumentos"
        sub="Inventário dos equipamentos de medição e a validade da calibração de cada um."
        acao={podeEscrever
          ? <button style={s.botaoPrimario} onClick={() => setNovo(true)}>Novo instrumento</button>
          : undefined}
      />

      {/* Botão que some sem explicação parece defeito. A frase diz de quem é o cadastro. */}
      {bloqueio && <div style={{ marginBottom: 18 }}><Aviso texto={bloqueio} /></div>}

      {novo && podeEscrever && <FormNovo aoFechar={() => setNovo(false)} aoSalvar={() => { setNovo(false); ativos.recarregar(); }} />}

      {calibrando && podeEscrever && (
        <FormCalibracao
          alvo={calibrando}
          aoFechar={() => setCalibrando(null)}
          aoSalvar={() => { setCalibrando(null); creds.recarregar(); }}
        />
      )}

      <div style={{ ...s.cartao, overflowX: 'auto' }}>
        <table style={s.tabela}>
          <thead>
            <tr>
              <th style={s.th}>Código</th>
              <th style={s.th}>Instrumento</th>
              <th style={s.th}>Local</th>
              <th style={s.th}>Certificado</th>
              <th style={s.th}>Calibração</th>
              {podeEscrever && <th style={s.th} />}
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr><td style={{ ...s.td, color: c.suave }} colSpan={podeEscrever ? 6 : 5}>Nenhum instrumento cadastrado.</td></tr>
            )}
            {linhas.map(({ ativo, cal }) => {
              const dias = diasAte(cal?.expires_at);
              const tom = !cal ? 'critico' : dias === null ? 'neutro' : dias < 0 ? 'critico' : dias <= 30 ? 'alerta' : 'ok';
              const texto = !cal ? 'Sem calibração' : dias === null ? '—' : dias < 0 ? 'Vencida' : dias <= 30 ? 'Vence em breve' : 'Em dia';
              return (
                <tr key={ativo.id}>
                  <td style={{ ...s.td, ...s.mono }}>{ativo.code}</td>
                  <td style={{ ...s.td, color: c.tinta, fontWeight: 500 }}>{ativo.name}</td>
                  <td style={s.td}>{ativo.area ?? '—'}</td>
                  <td style={{ ...s.td, ...s.mono }}>{cal?.number ?? '—'}</td>
                  <td style={s.td}>
                    <span style={pastilha(tom)}>{texto}</span>
                    {cal?.expires_at && <span style={S.venc}>até {dataBR(cal.expires_at)}</span>}
                  </td>
                  {podeEscrever && (
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <button
                        style={s.botao}
                        onClick={() => setCalibrando({ id: ativo.id, label: `${ativo.code} — ${ativo.name}` })}
                      >
                        {cal ? 'Renovar calibração' : 'Registrar calibração'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormNovo({ aoFechar, aoSalvar }: { aoFechar: () => void; aoSalvar: () => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [area, setArea] = useState('Laboratório da Qualidade');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await (trpc as any)['equipment-maintenance'].createAsset.mutate({
        code: code.trim(), name: name.trim(), kind: 'equipo_general', area: area.trim(),
      });
      aoSalvar();
    } catch (err) {
      setErro((err as Error)?.message ?? 'não foi possível salvar');
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} style={{ ...s.cartao, padding: 20, marginBottom: 18 }}>
      <div style={S.grade}>
        <div>
          <label style={s.rotulo}>Código</label>
          <input style={s.campo} value={code} onChange={(e) => setCode(e.target.value)} placeholder="MJ-INS-005" required />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={s.rotulo}>Instrumento</label>
          <input style={s.campo} value={name} onChange={(e) => setName(e.target.value)} placeholder="Medidor de espessura" required />
        </div>
        <div>
          <label style={s.rotulo}>Local</label>
          <input style={s.campo} value={area} onChange={(e) => setArea(e.target.value)} required />
        </div>
      </div>
      {erro && <div style={S.erro}>{erro}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="submit" style={s.botaoPrimario} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
        <button type="button" style={s.botao} onClick={aoFechar}>Cancelar</button>
      </div>
    </form>
  );
}

const S: Record<string, React.CSSProperties> = {
  grade: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 },
  venc: { display: 'block', fontSize: 11.5, color: c.suave, marginTop: 4, fontFamily: fonte.mono },
  erro: {
    marginTop: 14, padding: '10px 12px', borderRadius: 3,
    background: c.criticoFraco, border: `1px solid ${c.critico}`, color: c.critico, fontSize: 13.5,
  },
};
