// A entrada: dois painéis. À esquerda a marca, à direita usuário e senha.
//
// A versão anterior listava a equipe para clicar. Era cômodo e estava errado por dois motivos:
// mostrava, para qualquer um que abrisse a página, quem trabalha na empresa; e só funcionava
// porque havia UMA empresa — no cliente 02 a lista seria outra, e a tela precisaria saber de qual
// antes de alguém dizer quem é.
//
// Campo de usuário não tem esse problema: ele não revela nada e serve a qualquer empresa. Quem
// confere é `autenticar`, em lib/session.ts, e é lá — e só lá — que o banco entra quando entrar.
import { useState } from 'react';
import { autenticar, entrar } from '@/lib/session';
import { empresaAtiva } from '@/plataforma/empresa';
import { c, fonte, marca, s } from '@/ui/estilo';
import { useEhCelular } from '@/ui/tela';

export function Entrar({ aoEntrar }: { aoEntrar: () => void }) {
  const celular = useEhCelular();
  const ano = new Date().getFullYear();

  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ajuda, setAjuda] = useState(false);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const pessoa = autenticar(usuario, senha);
    if (!pessoa) {
      // Uma recusa só, para os dois casos: dizer qual deles falhou transformaria esta tela numa
      // lista de quem trabalha na empresa, que é o que ela deixou de ser.
      setErro('Usuário ou senha não conferem.');
      setSenha('');
      return;
    }
    entrar(pessoa.id);
    aoEntrar();
  };

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
        <form style={{ ...S.acesso, padding: celular ? '26px 22px 24px' : '48px 46px 40px' }} onSubmit={enviar}>
          <div style={S.cliente}>{empresaAtiva().identidade.nome}</div>
          <h1 style={S.titulo}>Bem-vindo!</h1>
          <p style={S.sub}>Acesse sua conta para continuar.</p>

          <label style={S.rotulo} htmlFor="usuario">Usuário</label>
          <input
            id="usuario" name="usuario" value={usuario}
            onChange={(e) => { setUsuario(e.target.value); setErro(null); }}
            placeholder="Seu nome"
            autoComplete="username" autoFocus={!celular}
            style={{ ...S.campo, borderColor: erro ? c.critico : c.linhaForte }}
          />

          <label style={{ ...S.rotulo, marginTop: 14 }} htmlFor="senha">Senha</label>
          <input
            id="senha" name="senha" type="password" value={senha}
            onChange={(e) => { setSenha(e.target.value); setErro(null); }}
            placeholder="Sua senha"
            autoComplete="current-password"
            style={{ ...S.campo, borderColor: erro ? c.critico : c.linhaForte }}
          />

          {/* O aviso ocupa lugar fixo: sem isso ele empurra o botão para baixo no instante do
              erro, e o clique seguinte cai no lugar errado. */}
          <div style={S.erro}>{erro}</div>

          <button type="submit" style={S.entrar}>Entrar</button>

          {/* "Esqueceu sua senha?" precisa levar a algum lugar. Enquanto não há banco, o lugar
              honesto é dizer qual é a senha — ela é a mesma para todos e está no código. */}
          <button type="button" style={S.esqueceu} onClick={() => setAjuda((v) => !v)}>
            Esqueceu sua senha?
          </button>
          {ajuda && (
            <p style={S.ajuda}>
              Enquanto o banco de dados não entra, a senha é <strong>123456</strong> para todo
              mundo, e o usuário é o seu nome. Trocar de senha passa a existir junto com o banco.
            </p>
          )}

          <div style={S.rodape}>BraMex © {ano}. Todos os direitos reservados.</div>
        </form>
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
  sub: { fontSize: 14.5, color: c.suave, margin: '6px 0 24px' },

  rotulo: {
    display: 'block', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase',
    color: c.suave, fontWeight: 700, marginBottom: 6,
  },
  campo: { ...s.campo, padding: '11px 13px' },
  erro: { minHeight: 20, marginTop: 8, fontSize: 12.5, color: c.critico, fontWeight: 600 },
  entrar: {
    ...s.botaoPrimario, width: '100%', padding: '12px 16px', fontSize: 15,
    background: c.acento, borderColor: c.acento,
  },
  esqueceu: {
    alignSelf: 'flex-start', marginTop: 12, padding: 0, border: 'none', background: 'none',
    fontFamily: fonte.texto, fontSize: 13, color: c.acentoMarca, fontWeight: 600,
    cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2,
  },
  ajuda: {
    margin: '10px 0 0', padding: '10px 12px', borderRadius: 4,
    background: c.acentoFraco, border: `1px solid ${c.acentoMarca}`,
    fontSize: 12.5, lineHeight: 1.55, color: c.acento,
  },
  rodape: {
    marginTop: 'auto', paddingTop: 22,
    fontSize: 11.5, color: c.acentoMarca, fontWeight: 600,
  },
};
