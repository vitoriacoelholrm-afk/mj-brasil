import appInfo from './app-info.json';
import installed from './installed.json';

// Minimal chassis landing — proves a freshly-created app boots and knows what it is +
// which catalog modules are installed. Real UX comes from the installed modules' route
// composition (apps/web/src/routes/); this is just the bootstrap shell.
export function App() {
  const modules = Object.entries(installed.modules ?? {}) as [string, { version: string; layer?: string }][];
  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.brandRow}><div style={S.dot} /><span style={S.brand}>Astralitics chassis</span></div>
        <h1 style={S.h1}>{appInfo.name}</h1>
        <p style={S.sub}>{appInfo.client ? `${appInfo.client} · ` : ''}{appInfo.domain || 'composed from the Astralitics catalog'}</p>

        <div style={S.card}>
          <div style={S.cardHead}>Installed modules ({modules.length})</div>
          {modules.length === 0 ? (
            <div style={S.empty}>none yet — install with <code style={S.code}>astralitics install &lt;module&gt; --app .</code></div>
          ) : (
            <ul style={S.list}>
              {modules.map(([name, m]) => (
                <li key={name} style={S.li}>
                  <code style={S.code}>{name}</code>
                  <span style={S.ver}>@{m.version}</span>
                  {m.layer ? <span style={S.layer}>{m.layer}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        <p style={S.foot}>chassis {appInfo.chassisVersion ?? '0.1.0'} · Supabase + Drizzle + tRPC + Vite</p>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e293b,#0f172a)', color: '#e2e8f0', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  wrap: { width: 560, padding: 32 },
  brandRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 14, height: 14, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%,#7dd3fc,#6366f1)' },
  brand: { color: '#94a3b8', fontSize: 13, letterSpacing: '.03em' },
  h1: { fontSize: 34, margin: '0 0 6px', fontWeight: 700 },
  sub: { color: '#94a3b8', margin: '0 0 24px' },
  card: { background: 'rgba(30,41,59,.6)', border: '1px solid #334155', borderRadius: 14, padding: '18px 20px' },
  cardHead: { fontSize: 12, textTransform: 'uppercase', letterSpacing: '.05em', color: '#94a3b8', marginBottom: 12 },
  empty: { color: '#64748b', fontSize: 14 },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  li: { display: 'flex', alignItems: 'center', gap: 8 },
  code: { background: '#0b1220', color: '#7dd3fc', padding: '2px 7px', borderRadius: 6, fontSize: 13 },
  ver: { color: '#94a3b8', fontFamily: 'monospace', fontSize: 13 },
  layer: { fontSize: 11, color: '#cbd5e1', border: '1px solid #475569', borderRadius: 20, padding: '1px 8px' },
  foot: { color: '#475569', fontSize: 12, marginTop: 20 },
};
