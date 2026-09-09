// O shell do app: barra lateral, quem está usando, e a tela ativa.
// Substitui a landing do chassis, que só listava os módulos instalados.
import { useState } from 'react';
import appInfo from './app-info.json';
import { pessoaAtual, sair } from '@/lib/session';
import { Entrar } from '@/telas/Entrar';
import { Vencimentos } from '@/telas/Vencimentos';
import { Instrumentos } from '@/telas/Instrumentos';
import { Clientes } from '@/telas/Clientes';
import { c, fonte } from '@/ui/estilo';

type Rota = 'vencimentos' | 'instrumentos' | 'clientes';

const MENU: { chave: Rota; rotulo: string; nota: string }[] = [
  { chave: 'vencimentos', rotulo: 'Vencimentos', nota: 'calibração e certificações' },
  { chave: 'instrumentos', rotulo: 'Instrumentos', nota: 'equipamentos de medição' },
  { chave: 'clientes', rotulo: 'Clientes', nota: 'carteira comercial' },
];

export function App() {
  const [pessoa, setPessoa] = useState(pessoaAtual);
  const [rota, setRota] = useState<Rota>('vencimentos');

  if (!pessoa) return <Entrar aoEntrar={() => setPessoa(pessoaAtual())} />;

  return (
    <div style={S.pagina}>
      <aside style={S.lateral}>
        <div style={S.marca}>
          <div style={S.marcaNome}>Minasjato</div>
          <div style={S.marcaSub}>Sistema da Qualidade</div>
        </div>

        <nav style={S.nav}>
          {MENU.map((m) => {
            const ativo = rota === m.chave;
            return (
              <button
                key={m.chave}
                onClick={() => setRota(m.chave)}
                style={{
                  ...S.item,
                  background: ativo ? c.acentoFraco : 'transparent',
                  borderLeftColor: ativo ? c.acentoMarca : 'transparent',
                  color: ativo ? c.tinta : c.tinta2,
                }}
              >
                <span style={{ fontWeight: ativo ? 700 : 500 }}>{m.rotulo}</span>
                <span style={S.itemNota}>{m.nota}</span>
              </button>
            );
          })}
        </nav>

        <div style={S.rodape}>
          <div style={S.pessoaNome}>{pessoa.nome}</div>
          <div style={S.pessoaPapel}>{pessoa.papel}</div>
          <button style={S.sair} onClick={() => { sair(); setPessoa(null); }}>
            Trocar de usuário
          </button>
        </div>
      </aside>

      <main style={S.conteudo}>
        <div style={S.faixaDev}>
          Ambiente de desenvolvimento — entrada sem senha, dados locais.
        </div>
        <div style={S.miolo}>
          {rota === 'vencimentos' && <Vencimentos />}
          {rota === 'instrumentos' && <Instrumentos />}
          {rota === 'clientes' && <Clientes />}
        </div>
        <div style={S.rodapeApp}>{appInfo.client} · {appInfo.name}</div>
      </main>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  pagina: {
    minHeight: '100vh', display: 'flex', background: c.fundo,
    color: c.tinta, fontFamily: fonte.texto,
  },
  lateral: {
    width: 232, flexShrink: 0, background: c.superficie,
    borderRight: `1px solid ${c.linhaForte}`, display: 'flex', flexDirection: 'column',
  },
  marca: { padding: '20px 18px', borderBottom: `1px solid ${c.linha}` },
  marcaNome: { fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' },
  marcaSub: {
    fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase',
    color: c.suave, fontWeight: 600, marginTop: 3,
  },
  nav: { padding: '10px 0', flex: 1, display: 'flex', flexDirection: 'column' },
  item: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1,
    padding: '10px 18px', border: 'none', borderLeft: '3px solid transparent',
    fontFamily: fonte.texto, fontSize: 14.5, cursor: 'pointer', textAlign: 'left', width: '100%',
  },
  itemNota: { fontSize: 11.5, color: c.suave },
  rodape: { padding: '16px 18px', borderTop: `1px solid ${c.linha}` },
  pessoaNome: { fontSize: 13.5, fontWeight: 600 },
  pessoaPapel: { fontSize: 11.5, color: c.suave, marginTop: 2 },
  sair: {
    marginTop: 10, padding: 0, border: 'none', background: 'none',
    color: c.acento, fontFamily: fonte.texto, fontSize: 12.5,
    cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2,
  },
  conteudo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  faixaDev: {
    background: c.acentoFraco, borderBottom: `1px solid ${c.acentoMarca}`,
    color: c.acento, fontSize: 11.5, fontWeight: 600, padding: '6px 28px',
  },
  miolo: { flex: 1, padding: '28px 28px 40px', maxWidth: 1080 },
  rodapeApp: {
    padding: '14px 28px', borderTop: `1px solid ${c.linha}`,
    fontSize: 11.5, color: c.suave,
  },
};
