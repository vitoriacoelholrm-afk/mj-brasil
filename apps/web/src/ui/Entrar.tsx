// A entrada, nas medidas da prancha editável (BraMex_tela_login_editavel.svg).
//
// Painel azul à esquerda com a assinatura e a frase; painel branco à direita com o acolhimento,
// os dois campos, o link e o botão. As proporções são as do arquivo: 670 para 930 em 1600, campo
// com 70% da largura do painel, botão em pílula, e as ondas nos cantos.
//
// A prancha não nomeia cliente nenhum, e está certa: quando a autenticação for de verdade, é a
// PESSOA que diz de qual empresa ela é — a tela de entrada não tem como saber antes disso. A
// versão anterior listava a equipe da Minasjato e por isso parecia o sistema de um cliente só.
//
// Quem confere usuário e senha é `autenticar`, em lib/session.ts. É lá — e só lá — que o banco
// entra quando entrar; esta tela não muda por causa disso.
import { useState } from 'react';
import { autenticar, entrar } from '@/lib/session';
import { c, fonte, marca } from '@/ui/estilo';
import { useEhCelular } from '@/ui/tela';
import { publico } from '@/ui/publico';

/** Os tons que só existem nesta tela, tirados da prancha. Os que a paleta já tinha a menos de um
 *  fio de distância — o azul do painel, o do botão, o do título — usam o token, para o produto
 *  não passar a ter dois azuis profundos que ninguém distingue mas o olho estranha. */
const PRANCHA = {
  borda: '#BCD7F0',
  icone: '#0E56A9',
  espaco: '#41617E',
  curvaEscura: '#09244A',
};

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
      // Uma recusa só, para os dois casos. Dizer qual deles falhou transformaria a tela numa
      // lista de quem trabalha na empresa — que é o que ela deixou de ser.
      setErro('Usuário ou senha não conferem.');
      setSenha('');
      return;
    }
    entrar(pessoa.id);
    aoEntrar();
  };

  return (
    <div style={{ ...S.pagina, gridTemplateColumns: celular ? '1fr' : '670fr 930fr' }}>

      {/* ── painel da marca ───────────────────────────────────────────────────────────────── */}
      <div style={{ ...S.marcaPainel, padding: celular ? '36px 26px 32px' : '0 12%' }}>
        {/* Placa, frase e régua dividem UMA coluna e esticam nela. Antes cada uma tinha a sua
            largura — 72%, 18ch e 76% — e as três bordas caíam em pontos diferentes: era isso que
            se via como desalinho, e não a posição do conjunto. */}
        <div style={{ ...S.bloco, maxWidth: celular ? 240 : 300 }}>
          {/* A assinatura vai numa PLACA BRANCA, e não direto no azul.
              A prancha mostra o "Bra" em branco sobre o azul, mas essa versão não existe no
              material escolhido — e derivá-la não é possível: as letras são desenhadas como forma
              escura com um brilho claro por dentro, então clarear a forma funde letra e miolo e o
              "B" vira uma mancha. Preferi a placa a entregar a assinatura desmanchada. Com a
              versão de fundo escuro em mãos, a placa sai e a assinatura vai direto no azul. */}
          <div style={S.placa}>
            <img
              src={publico('marca/BraMex_logo_exata.png')}
              alt="BraMex — Sistema de Qualidade e Gestão"
              style={S.logo}
            />
          </div>
          <p style={{ ...S.frase, fontSize: celular ? 14 : 'clamp(15px, 1.4vw, 19px)' }}>
            Processos que conectam resultados.
          </p>
          <div style={S.regua}><i style={S.tira1} /><i style={S.tira2} /><i style={S.tira3} /></div>
        </div>

        {/* A curva do canto inferior, da prancha. */}
        {!celular && (
          <svg viewBox="0 820 470 180" style={S.curva} aria-hidden>
            <path d="M0 820 C130 940 300 970 470 1000 H0Z" fill={PRANCHA.curvaEscura} />
          </svg>
        )}
      </div>

      {/* ── painel de acesso ──────────────────────────────────────────────────────────────── */}
      <div style={S.acessoPainel}>
        {!celular && (
          <>
            <svg viewBox="1240 0 360 250" style={S.ondaCima} aria-hidden>
              <defs>
                <linearGradient id="bmCanto" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#70E2D0" /><stop offset="1" stopColor="#1680F0" />
                </linearGradient>
              </defs>
              <path d="M1240 0 H1600 V250 C1470 190 1370 100 1240 0Z" fill="#CFEAF8" />
              <path d="M1350 0 H1600 V210 C1500 150 1430 75 1350 0Z" fill="url(#bmCanto)" />
            </svg>
            <svg viewBox="1200 790 400 210" style={S.ondaBaixo} aria-hidden>
              <path d="M1200 1000 C1310 900 1430 840 1600 790 V1000Z" fill="#D9EEF9" />
              <path d="M1360 1000 C1460 900 1530 860 1600 830 V1000Z" fill="#8BE8C9" />
              <path d="M1450 1000 C1510 940 1560 910 1600 890 V1000Z" fill="#00CFAE" />
            </svg>
          </>
        )}

        <form style={{ ...S.form, padding: celular ? '30px 24px 26px' : '11% 11% 5%' }} onSubmit={enviar}>
          <h1 style={{ ...S.titulo, fontSize: celular ? 30 : 'clamp(30px, 3.3vw, 46px)' }}>Bem-vindo!</h1>
          <p style={S.sub}>Acesse sua conta para continuar.</p>

          <div style={S.caixaCampo}>
            <span style={S.icone}><IconePessoa /></span>
            <input
              value={usuario}
              onChange={(e) => { setUsuario(e.target.value); setErro(null); }}
              placeholder="Usuário"
              aria-label="Usuário"
              autoComplete="username" autoFocus={!celular}
              style={{ ...S.campo, border: `1.5px solid ${erro ? c.critico : PRANCHA.borda}` }}
            />
          </div>

          <div style={{ ...S.caixaCampo, marginTop: 16 }}>
            <span style={S.icone}><IconeCadeado /></span>
            <input
              type="password" value={senha}
              onChange={(e) => { setSenha(e.target.value); setErro(null); }}
              placeholder="Senha"
              aria-label="Senha"
              autoComplete="current-password"
              style={{ ...S.campo, border: `1.5px solid ${erro ? c.critico : PRANCHA.borda}` }}
            />
          </div>

          {/* Lugar fixo mesmo vazio: senão o aviso empurra o botão para baixo no instante do erro,
              e o clique seguinte cai no lugar errado. */}
          <div style={S.erro}>{erro}</div>

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

          <button type="submit" style={S.entrar}>Entrar</button>

          <div style={S.rodape}>BraMex © {ano}. Todos os direitos reservados.</div>
        </form>
      </div>
    </div>
  );
}

/* Os dois ícones da prancha, no mesmo traço. */
function IconePessoa() {
  return (
    <svg width="20" height="20" viewBox="0 0 60 60" fill="none" aria-hidden>
      <circle cx="30" cy="21" r="12" stroke={PRANCHA.icone} strokeWidth="4.5" />
      <path d="M9 52 Q30 32 51 52" stroke={PRANCHA.icone} strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

function IconeCadeado() {
  return (
    <svg width="20" height="20" viewBox="0 0 60 60" fill="none" aria-hidden>
      <rect x="14" y="26" width="32" height="26" rx="6" stroke={PRANCHA.icone} strokeWidth="4.5" />
      <path d="M21 26V17q0-9 9-9t9 9v9" stroke={PRANCHA.icone} strokeWidth="4.5" />
      <circle cx="30" cy="39" r="3.2" fill={PRANCHA.icone} />
    </svg>
  );
}

const S: Record<string, React.CSSProperties> = {
  pagina: {
    minHeight: '100vh', display: 'grid',
    background: c.superficie, color: c.tinta, fontFamily: fonte.texto,
  },

  /* ── esquerda ──────────────────────────────────────────────────────────────────────────── */
  marcaPainel: {
    position: 'relative', overflow: 'hidden',
    background: marca.azulProfundo, color: '#FFFFFF',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  bloco: {
    position: 'relative', zIndex: 1, width: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 24,
  },
  placa: {
    background: '#FFFFFF', borderRadius: 16, padding: 26,
    boxShadow: '0 10px 30px rgba(0,0,0,.18)',
  },
  logo: { display: 'block', width: '100%', height: 'auto' },
  frase: { margin: 0, color: '#FFFFFF', lineHeight: 1.45, fontWeight: 500, textAlign: 'center' },
  regua: { display: 'flex', gap: 12 },
  tira1: { flex: 1, height: 6, borderRadius: 3, background: marca.verde },
  tira2: { flex: 1, height: 6, borderRadius: 3, background: marca.azul },
  tira3: { flex: 1, height: 6, borderRadius: 3, background: marca.turquesa },
  curva: { position: 'absolute', left: 0, bottom: 0, width: '70%', height: 'auto' },

  /* ── direita ───────────────────────────────────────────────────────────────────────────── */
  acessoPainel: { position: 'relative', overflow: 'hidden', background: c.superficie },
  ondaCima: { position: 'absolute', top: 0, right: 0, width: '39%', height: 'auto' },
  ondaBaixo: { position: 'absolute', bottom: 0, right: 0, width: '43%', height: 'auto' },
  form: {
    position: 'relative', zIndex: 1, height: '100%',
    display: 'flex', flexDirection: 'column',
  },

  titulo: { fontWeight: 700, letterSpacing: '-.02em', margin: 0, color: c.acento },
  sub: { fontSize: 15, color: c.suave, margin: '8px 0 34px' },

  caixaCampo: { position: 'relative', display: 'flex', alignItems: 'center' },
  icone: {
    position: 'absolute', left: 18, display: 'flex', alignItems: 'center', pointerEvents: 'none',
  },
  campo: {
    width: '100%', maxWidth: 560,
    fontFamily: fonte.texto, fontSize: 15, color: c.tinta,
    padding: '15px 18px 15px 50px', borderRadius: 14,
    border: `1.5px solid ${PRANCHA.borda}`, background: c.superficie,
  },
  erro: { minHeight: 20, marginTop: 10, fontSize: 12.5, color: c.critico, fontWeight: 600 },

  esqueceu: {
    alignSelf: 'flex-start', padding: 0, border: 'none', background: 'none',
    fontFamily: fonte.texto, fontSize: 13.5, color: c.acentoMarca, fontWeight: 700,
    cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3,
  },
  ajuda: {
    margin: '12px 0 0', padding: '11px 13px', borderRadius: 10, maxWidth: 560,
    background: c.acentoFraco, border: `1px solid ${PRANCHA.borda}`,
    fontSize: 12.5, lineHeight: 1.55, color: c.acento,
  },

  entrar: {
    width: '100%', maxWidth: 560, marginTop: 24,
    fontFamily: fonte.texto, fontSize: 16, fontWeight: 600,
    padding: '15px 20px', borderRadius: 999,
    border: `1px solid ${c.acento}`, background: c.acento, color: '#FFFFFF',
    cursor: 'pointer',
  },

  rodape: { marginTop: 'auto', paddingTop: 30, fontSize: 12, color: PRANCHA.espaco },
};
