// O shell do app, no layout escolhido: navegação em cima agrupada por domínio do SGQ, e a
// home é um veredito ("estamos em dia?") em vez de uma lista.
import { useState } from 'react';
import appInfo from './app-info.json';
import { pessoaAtual, sair } from '@/lib/session';
import { Entrar } from '@/telas/Entrar';
import { Situacao } from '@/telas/Situacao';
import { Diagnostico } from '@/telas/Diagnostico';
import { PlanoServico } from '@/telas/PlanoServico';
import { Vencimentos } from '@/telas/Vencimentos';
import { Instrumentos } from '@/telas/Instrumentos';
import { Clientes } from '@/telas/Clientes';
import { ListaMestra } from '@/telas/ListaMestra';
import { c, fonte } from '@/ui/estilo';
import { definirEmpresaAtiva, empresaAtiva, empresas } from '@/plataforma/empresa';
import '@/documentos/listaMestra';   // registra as empresas

export type Rota = 'situacao' | 'plano' | 'diagnostico' | 'vencimentos' | 'instrumentos' | 'clientes' | 'lista-mestra';

// Cada item de topo é um domínio; os de dentro são as telas dele. Um domínio sem tela ainda
// aparece desabilitado — some quando o módulo entrar, não antes.
const MENU: { rotulo: string; rota?: Rota; filhas?: { rotulo: string; rota: Rota }[] }[] = [
  { rotulo: 'Situação', rota: 'situacao' },
  { rotulo: 'Ordens de Serviço', rota: 'plano' },
  { rotulo: 'Qualidade', filhas: [
    { rotulo: 'Diagnóstico', rota: 'diagnostico' },
    { rotulo: 'Lista Mestra', rota: 'lista-mestra' },
    { rotulo: 'Vencimentos', rota: 'vencimentos' },
    { rotulo: 'Instrumentos', rota: 'instrumentos' },
  ] },
  { rotulo: 'Cadastros', filhas: [
    { rotulo: 'Clientes', rota: 'clientes' },
  ] },
];

const DOMINIO: Record<Rota, string> = {
  situacao: 'Situação',
  plano: 'Ordens de Serviço',
  diagnostico: 'Qualidade',
  'lista-mestra': 'Qualidade',
  vencimentos: 'Qualidade',
  instrumentos: 'Qualidade',
  clientes: 'Cadastros',
};

export function App() {
  const [pessoa, setPessoa] = useState(pessoaAtual);
  const [rota, setRota] = useState<Rota>('situacao');
  const [empresaId, setEmpresaId] = useState(() => empresaAtiva().id);
  const empresa = empresaAtiva();

  if (!pessoa) return <Entrar aoEntrar={() => setPessoa(pessoaAtual())} />;

  const dominioAtivo = DOMINIO[rota];
  const filhas = MENU.find((m) => m.rotulo === dominioAtivo)?.filhas;

  return (
    <div style={S.pagina}>
      <header style={S.topo}>
        <div style={S.marca}>
          <div style={{ ...S.marcaNome, color: empresa.identidade.acento }}>{empresa.identidade.nome}</div>
          <div style={S.marcaSub}>{empresa.identidade.subtitulo}</div>
          {empresas().length > 1 && (
            <select
              value={empresaId}
              onChange={(e) => { definirEmpresaAtiva(e.target.value); setEmpresaId(e.target.value); setRota('situacao'); }}
              style={S.trocaEmpresa}
              title="A empresa atendida. Trocar aqui troca a codificação, a tolerância e a marca — nenhuma regra muda."
            >
              {empresas().map((x) => (
                <option key={x.id} value={x.id}>{x.identidade.nome}{x.modelo ? ' (modelo)' : ''}</option>
              ))}
            </select>
          )}
        </div>

        <nav style={S.nav}>
          {MENU.map((m) => {
            const ativo = m.rotulo === dominioAtivo;
            const destino = m.rota ?? m.filhas?.[0]?.rota;
            return (
              <button
                key={m.rotulo}
                onClick={() => destino && setRota(destino)}
                style={{
                  ...S.navItem,
                  borderBottomColor: ativo ? c.acentoMarca : 'transparent',
                  fontWeight: ativo ? 700 : 500,
                  color: ativo ? c.tinta : c.tinta2,
                }}
              >
                {m.rotulo}
              </button>
            );
          })}
        </nav>

        <div style={S.pessoa}>
          <div style={S.pessoaNome}>{pessoa.nome}</div>
          <div style={S.pessoaPapel}>{pessoa.papel}</div>
          <button style={S.sair} onClick={() => { sair(); setPessoa(null); }}>Trocar de usuário</button>
        </div>
      </header>

      <div style={S.faixaDev}>
        {import.meta.env?.VITE_DEMO === '1'
          ? 'Demonstração — nomes de empresas, obras e pessoas foram substituídos. As telas ligadas ao banco são só de leitura aqui.'
          : 'Ambiente de desenvolvimento — entrada sem senha, dados locais.'}
      </div>

      {filhas && filhas.length > 1 && (
        <div style={S.subnav}>
          {filhas.map((f) => (
            <button
              key={f.rota}
              onClick={() => setRota(f.rota)}
              style={{
                ...S.subItem,
                background: rota === f.rota ? c.acentoFraco : 'transparent',
                borderColor: rota === f.rota ? c.acentoMarca : c.linha,
                color: rota === f.rota ? c.acento : c.tinta2,
                fontWeight: rota === f.rota ? 700 : 500,
              }}
            >
              {f.rotulo}
            </button>
          ))}
        </div>
      )}

      <main style={S.miolo}>
        {rota === 'situacao' && <Situacao irPara={setRota} />}
        {rota === 'plano' && <PlanoServico />}
        {rota === 'diagnostico' && <Diagnostico />}
        {rota === 'vencimentos' && <Vencimentos />}
        {rota === 'instrumentos' && <Instrumentos />}
        {rota === 'clientes' && <Clientes />}
        {rota === 'lista-mestra' && <ListaMestra />}
      </main>

      <div style={S.rodape}>{appInfo.client} · {appInfo.name}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  pagina: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    background: c.fundo, color: c.tinta, fontFamily: fonte.texto,
  },
  topo: {
    background: c.superficie, borderBottom: `1px solid ${c.linhaForte}`,
    display: 'flex', alignItems: 'stretch',
  },
  marca: {
    padding: '14px 24px', borderRight: `1px solid ${c.linha}`,
    display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0,
  },
  marcaNome: { fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' },
  trocaEmpresa: {
    marginTop: 6, fontFamily: fonte.texto, fontSize: 11.5, color: c.tinta2,
    padding: '2px 6px', borderRadius: 3, border: `1px solid ${c.linha}`, background: c.superficie,
    maxWidth: 170,
  },
  marcaSub: {
    fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase',
    color: c.suave, fontWeight: 600, marginTop: 2,
  },
  nav: { display: 'flex', alignItems: 'stretch', flex: 1, minWidth: 0, overflowX: 'auto' },
  navItem: {
    display: 'flex', alignItems: 'center', padding: '0 20px',
    border: 'none', borderBottom: '3px solid transparent', background: 'none',
    fontFamily: fonte.texto, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  pessoa: {
    padding: '12px 24px', borderLeft: `1px solid ${c.linha}`,
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    textAlign: 'right', flexShrink: 0,
  },
  pessoaNome: { fontSize: 13, fontWeight: 600 },
  pessoaPapel: { fontSize: 11, color: c.suave, marginTop: 2 },
  sair: {
    marginTop: 4, padding: 0, border: 'none', background: 'none', alignSelf: 'flex-end',
    color: c.acento, fontFamily: fonte.texto, fontSize: 11.5,
    cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2,
  },
  faixaDev: {
    background: c.acentoFraco, borderBottom: `1px solid ${c.acentoMarca}`,
    color: c.acento, fontSize: 11.5, fontWeight: 600, padding: '6px 28px',
  },
  subnav: {
    display: 'flex', gap: 8, padding: '14px 28px 0',
  },
  subItem: {
    padding: '7px 14px', borderRadius: 3, border: '1px solid',
    fontFamily: fonte.texto, fontSize: 13.5, cursor: 'pointer',
  },
  miolo: { flex: 1, padding: '24px 28px 40px', maxWidth: 1180 },
  rodape: {
    padding: '14px 28px', borderTop: `1px solid ${c.linha}`,
    fontSize: 11.5, color: c.suave,
  },
};
