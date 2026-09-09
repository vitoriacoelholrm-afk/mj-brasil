// Tela de entrada de desenvolvimento — escolhe uma pessoa da equipe. Não pede senha e não emite
// token: só grava o id da membership que o middleware de dev aceita. Some quando a autenticação
// real entrar.
import { EQUIPE, entrar } from '@/lib/session';
import { c, fonte, s } from '@/ui/estilo';

export function Entrar({ aoEntrar }: { aoEntrar: () => void }) {
  return (
    <div style={S.pagina}>
      <div style={S.caixa}>
        <div style={S.marca}>MJ Serviços Industriais Ltda</div>
        <h1 style={S.titulo}>Sistema da Qualidade</h1>
        <p style={S.sub}>Escolha quem está usando o sistema.</p>

        <div style={S.lista}>
          {EQUIPE.map((p) => (
            <button
              key={p.id}
              style={S.pessoa}
              onClick={() => { entrar(p.id); aoEntrar(); }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = c.acentoMarca; e.currentTarget.style.background = c.acentoFraco; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = c.linhaForte; e.currentTarget.style.background = c.superficie; }}
            >
              <span style={S.nome}>{p.nome}</span>
              <span style={S.papel}>{p.papel}</span>
            </button>
          ))}
        </div>

        <p style={S.aviso}>
          Entrada de desenvolvimento, sem senha. Vale apenas nesta máquina, com o servidor de
          desenvolvimento. Autenticação de verdade entra antes de publicar.
        </p>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  pagina: {
    minHeight: '100vh', background: c.fundo, color: c.tinta, fontFamily: fonte.texto,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  caixa: { ...s.cartao, width: 460, maxWidth: '100%', padding: '32px 30px' },
  marca: {
    fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase',
    color: c.suave, fontWeight: 700, marginBottom: 14,
  },
  titulo: { fontSize: 27, fontWeight: 700, letterSpacing: '-.02em', margin: '0 0 6px' },
  sub: { fontSize: 14.5, color: c.suave, margin: '0 0 22px' },
  lista: { display: 'flex', flexDirection: 'column', gap: 8 },
  pessoa: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
    padding: '12px 14px', borderRadius: 3, border: `1px solid ${c.linhaForte}`,
    background: c.superficie, cursor: 'pointer', textAlign: 'left',
    fontFamily: fonte.texto, transition: 'background .12s, border-color .12s',
  },
  nome: { fontSize: 15, fontWeight: 600, color: c.tinta },
  papel: { fontSize: 12.5, color: c.suave },
  aviso: {
    marginTop: 22, paddingTop: 16, borderTop: `1px solid ${c.linha}`,
    fontSize: 12, lineHeight: 1.6, color: c.suave,
  },
};
