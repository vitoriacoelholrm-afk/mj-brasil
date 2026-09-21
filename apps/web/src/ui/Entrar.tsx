// Tela de entrada de desenvolvimento — escolhe uma pessoa da equipe. Não pede senha e não emite
// token: só grava o id da membership que o middleware de dev aceita. Some quando a autenticação
// real entrar.
import { EQUIPE, entrar } from '@/lib/session';
import { somenteLeitura } from '@/plataforma/acesso';
import { empresaAtiva } from '@/plataforma/empresa';
import { c, fonte, s } from '@/ui/estilo';

export function Entrar({ aoEntrar }: { aoEntrar: () => void }) {
  return (
    <div style={S.pagina}>
      <div style={S.caixa}>
        {/* A marca do SISTEMA em cima, e o nome do CLIENTE embaixo dela — a mesma divisão de
            territórios do app: quem entra precisa saber em que sistema está e em qual empresa,
            e as duas respostas não são a mesma. */}
        {/* Sem régua abaixo: a assinatura já traz as três barras dentro dela, e repeti-las seria
            a mesma marca dita duas vezes em quatro centímetros. */}
        <img src="/marca/BraMex_logo_exata.png" alt="BraMex — Sistema de Qualidade e Gestão" style={S.logo} />
        <div style={S.cliente}>{empresaAtiva().identidade.nome}</div>
        <h1 style={S.titulo}>Entrar</h1>
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
              <span style={S.papel}>{p.cargo}</span>
              {somenteLeitura(p.papel) && <span style={S.soLeitura}>só consulta</span>}
            </button>
          ))}
        </div>

        <p style={S.aviso}>
          {import.meta.env?.VITE_DEMO === '1'
            ? 'Demonstração: escolha qualquer pessoa para entrar, sem senha. Os nomes de empresas e de pessoas foram substituídos. Autenticação de verdade entra antes de publicar.'
            : 'Entrada de desenvolvimento, sem senha. Vale apenas nesta máquina, com o servidor de desenvolvimento. Autenticação de verdade entra antes de publicar.'}
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
  caixa: { ...s.cartao, width: 460, maxWidth: '100%', padding: '30px 30px 32px', overflow: 'hidden' },
  // A assinatura EXATA é vertical e foi feita para fundo branco — é aqui que ela cai bem, dentro
  // do cartão branco e com altura sobrando. Na coluna ela não caberia: teria 218px de altura e
  // empurraria o menu para baixo da dobra.
  logo: { display: 'block', width: 190, maxWidth: '100%', height: 'auto', margin: '0 auto 6px' },
  cliente: {
    fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase',
    color: c.suave, fontWeight: 700, margin: '14px 0 16px', textAlign: 'center',
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
  soLeitura: {
    display: 'block', fontSize: 10.5, color: c.suave, marginTop: 3,
    letterSpacing: '.05em', textTransform: 'uppercase',
  },
  papel: { fontSize: 12.5, color: c.suave },
  aviso: {
    marginTop: 22, paddingTop: 16, borderTop: `1px solid ${c.linha}`,
    fontSize: 12, lineHeight: 1.6, color: c.suave,
  },
};
