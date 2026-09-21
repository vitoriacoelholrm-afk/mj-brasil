// A entrada: dois painéis. À esquerda a marca, à direita quem entra.
//
// O desenho é o da prancha da BraMex — painel azul com a assinatura e a frase, painel branco com
// o acolhimento e o acesso. O que muda em relação à prancha é o MIOLO do painel branco, e a razão
// é simples: usuário e senha ainda não existem neste sistema.
//
// Desenhar os dois campos assim mesmo seria a tela mentir sobre o que ela faz. Quem visse a
// prancha na tela suporia que há conta, sessão e senha guardada — e não há: a entrada é por
// escolha de pessoa, sem senha, e vale só no servidor de desenvolvimento. No lugar dos campos
// fica o que de fato acontece, com o mesmo acabamento. Quando a autenticação entrar, os campos
// ocupam exatamente este espaço e o resto da tela não muda.
import { EQUIPE, entrar } from '@/lib/session';
import { somenteLeitura } from '@/plataforma/acesso';
import { empresaAtiva } from '@/plataforma/empresa';
import { c, fonte, marca } from '@/ui/estilo';
import { useEhCelular } from '@/ui/tela';

export function Entrar({ aoEntrar }: { aoEntrar: () => void }) {
  const celular = useEhCelular();
  const ano = new Date().getFullYear();

  return (
    <div style={{ ...S.pagina, padding: celular ? 0 : 24 }}>
      <div
        style={{
          ...S.quadro,
          gridTemplateColumns: celular ? '1fr' : '1fr 1.15fr',
          borderRadius: celular ? 0 : 10,
          border: celular ? 'none' : `1px solid ${c.linhaForte}`,
        }}
      >
        {/* ── o painel da marca ─────────────────────────────────────────────────────────── */}
        <div style={{ ...S.marcaPainel, padding: celular ? '32px 24px 28px' : '52px 44px' }}>
          <img
            src="/marca/BraMex_logo_fundo_escuro_exata.png"
            alt="BraMex — Sistema de Qualidade e Gestão"
            style={{ ...S.logo, width: celular ? 148 : 208 }}
          />
          <p style={{ ...S.frase, fontSize: celular ? 13.5 : 15.5 }}>
            Processos que conectam resultados.
          </p>
        </div>

        {/* ── o painel de acesso ────────────────────────────────────────────────────────── */}
        <div style={{ ...S.acesso, padding: celular ? '26px 22px 24px' : '48px 46px 40px' }}>
          <div style={S.cliente}>{empresaAtiva().identidade.nome}</div>
          <h1 style={S.titulo}>Bem-vindo!</h1>
          <p style={S.sub}>Acesse sua conta para continuar.</p>

          <div style={S.lista}>
            {EQUIPE.map((p) => (
              <button
                key={p.id}
                style={S.pessoa}
                onClick={() => { entrar(p.id); aoEntrar(); }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = c.acentoMarca;
                  e.currentTarget.style.background = c.acentoFraco;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = c.linhaForte;
                  e.currentTarget.style.background = c.superficie;
                }}
              >
                <span style={S.nome}>{p.nome}</span>
                <span style={S.papel}>{p.cargo}</span>
                {somenteLeitura(p.papel) && <span style={S.soLeitura}>só consulta</span>}
              </button>
            ))}
          </div>

          <p style={S.aviso}>
            {import.meta.env?.VITE_DEMO === '1'
              ? 'Demonstração: escolha qualquer pessoa para entrar, sem senha. Os nomes de empresas e de pessoas foram substituídos. Autenticação de verdade entra antes de publicar.'
              : 'Entrada de desenvolvimento, sem senha. Vale apenas nesta máquina, com o servidor de desenvolvimento. Usuário e senha ocupam este espaço quando a autenticação existir.'}
          </p>

          <div style={S.rodape}>BraMex © {ano}. Todos os direitos reservados.</div>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  pagina: {
    minHeight: '100vh', background: c.fundo, color: c.tinta, fontFamily: fonte.texto,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  quadro: {
    display: 'grid', width: 940, maxWidth: '100%', overflow: 'hidden',
    background: c.superficie, boxShadow: '0 18px 50px rgba(11,47,90,.16)',
  },

  marcaPainel: {
    // O clarão diagonal faz o que as ondas fazem na prancha: dá profundidade sem desenhar nada
    // que dispute com a assinatura.
    background: `radial-gradient(120% 90% at 15% 0%, #14417A 0%, ${marca.azulProfundo} 62%)`,
    color: '#FFFFFF',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 20, textAlign: 'center',
  },
  logo: { display: 'block', maxWidth: '100%', height: 'auto' },
  frase: { margin: 0, color: marca.emFundoEscuro, lineHeight: 1.5, maxWidth: '24ch' },

  acesso: { display: 'flex', flexDirection: 'column' },
  cliente: {
    fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase',
    color: c.suave, fontWeight: 700, marginBottom: 10,
  },
  titulo: { fontSize: 30, fontWeight: 700, letterSpacing: '-.02em', margin: 0, color: c.acento },
  sub: { fontSize: 14.5, color: c.suave, margin: '6px 0 22px' },

  lista: { display: 'flex', flexDirection: 'column', gap: 8 },
  pessoa: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
    padding: '12px 14px', borderRadius: 4, border: `1px solid ${c.linhaForte}`,
    background: c.superficie, cursor: 'pointer', textAlign: 'left',
    fontFamily: fonte.texto, transition: 'background .12s, border-color .12s',
  },
  nome: { fontSize: 15, fontWeight: 600, color: c.tinta },
  papel: { fontSize: 12.5, color: c.suave },
  soLeitura: {
    display: 'block', fontSize: 10.5, color: c.suave, marginTop: 3,
    letterSpacing: '.05em', textTransform: 'uppercase',
  },

  aviso: {
    marginTop: 20, paddingTop: 15, borderTop: `1px solid ${c.linha}`,
    fontSize: 12, lineHeight: 1.6, color: c.suave,
  },
  rodape: {
    marginTop: 'auto', paddingTop: 18,
    fontSize: 11.5, color: c.acentoMarca, fontWeight: 600,
  },
};
