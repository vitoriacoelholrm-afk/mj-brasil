// Clientes — a carteira que o SGQ chama de "partes interessadas" no lado comercial.
// Usa customer-management, cujo router só passou a expor createCustomer/listCustomers depois da
// correção de catálogo (montava 1 de 5 Functions).
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { empresaAtiva } from '@/plataforma/empresa';
import { usarDados } from '@/lib/usarDados';
import { papelAtual } from '@/lib/session';
import { motivoDoCadastro, podeCadastrar } from '@/plataforma/acesso';
import { c, pastilha, s } from '@/ui/estilo';
import { Aviso, Cabecalho } from '@/ui/Cabecalho';

interface Cliente {
  id: string; name: string; type: string; tax_id: string | null;
  email: string | null; phone: string | null; payment_terms_days: number; status: string;
}

const TIPO: Record<string, string> = {
  commercial: 'Empresa', residential: 'Residencial', fleet: 'Frota',
};

export function Clientes() {
  const [novo, setNovo] = useState(false);
  const papel = papelAtual();
  // Ver a carteira é de todo mundo; abrir cliente novo é de quem atende. Até 21/09/2026 esta tela
  // não perguntava nada — o botão aparecia para a direção e para a consultoria também.
  const podeEscrever = podeCadastrar(papel, 'clientes');
  const bloqueio = motivoDoCadastro(papel, 'clientes');
  const { dados, carregando, erro, recarregar } = usarDados<{ rows: Cliente[] } | Cliente[]>(
    () => (trpc as any)['customer-management'].listCustomers.query({}),
  );

  if (carregando) return <Aviso texto="Carregando…" />;
  if (erro) return <Aviso texto={erro} erro />;

  const linhas: Cliente[] = (dados as any)?.rows ?? (dados as any) ?? [];

  return (
    <div>
      <Cabecalho
        titulo="Clientes"
        sub={`Quem a ${empresaAtiva().identidade.nome} atende e fatura.`}
        acao={podeEscrever
          ? <button style={s.botaoPrimario} onClick={() => setNovo(true)}>Novo cliente</button>
          : undefined}
      />

      {/* Botão que some sem explicação parece defeito. A frase diz de quem é o cadastro. */}
      {bloqueio && <div style={{ marginBottom: 18 }}><Aviso texto={bloqueio} /></div>}

      {novo && podeEscrever && <FormNovo aoFechar={() => setNovo(false)} aoSalvar={() => { setNovo(false); recarregar(); }} />}

      <div style={{ ...s.cartao, overflowX: 'auto' }}>
        <table style={s.tabela}>
          <thead>
            <tr>
              <th style={s.th}>Cliente</th>
              <th style={s.th}>Tipo</th>
              <th style={s.th}>CNPJ</th>
              <th style={s.th}>Contato</th>
              <th style={s.th}>Prazo</th>
              <th style={s.th}>Situação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr><td style={{ ...s.td, color: c.suave }} colSpan={6}>Nenhum cliente cadastrado.</td></tr>
            )}
            {linhas.map((l) => (
              <tr key={l.id}>
                <td style={{ ...s.td, color: c.tinta, fontWeight: 500 }}>{l.name}</td>
                <td style={s.td}>{TIPO[l.type] ?? l.type}</td>
                <td style={{ ...s.td, ...s.mono }}>{l.tax_id ?? '—'}</td>
                <td style={s.td}>{l.email ?? l.phone ?? '—'}</td>
                <td style={s.td}>{l.payment_terms_days} dias</td>
                <td style={s.td}>
                  <span style={pastilha(l.status === 'active' ? 'ok' : 'neutro')}>
                    {l.status === 'active' ? 'Ativo' : l.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormNovo({ aoFechar, aoSalvar }: { aoFechar: () => void; aoSalvar: () => void }) {
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [prazo, setPrazo] = useState(30);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await (trpc as any)['customer-management'].createCustomer.mutate({
        name: name.trim(),
        type: 'commercial',
        taxId: taxId.trim() || undefined,
        email: email.trim() || undefined,
        paymentTermsDays: Number(prazo) || 30,
      });
      aoSalvar();
    } catch (err) {
      const m = (err as Error)?.message ?? '';
      setErro(m.includes('DUPLICATE') || m === name.trim() ? 'Já existe um cliente com esse nome.' : m || 'não foi possível salvar');
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} style={{ ...s.cartao, padding: 20, marginBottom: 18 }}>
      <div style={S.grade}>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={s.rotulo}>Razão social</label>
          <input style={s.campo} value={name} onChange={(e) => setName(e.target.value)} placeholder="Razão social do cliente" required />
        </div>
        <div>
          <label style={s.rotulo}>CNPJ</label>
          <input style={s.campo} value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="00.000.000/0001-00" />
        </div>
        <div>
          <label style={s.rotulo}>E-mail</label>
          <input style={s.campo} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label style={s.rotulo}>Prazo (dias)</label>
          <input style={s.campo} type="number" min={0} value={prazo} onChange={(e) => setPrazo(Number(e.target.value))} />
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
  erro: {
    marginTop: 14, padding: '10px 12px', borderRadius: 3,
    background: c.criticoFraco, border: `1px solid ${c.critico}`, color: c.critico, fontSize: 13.5,
  },
};
