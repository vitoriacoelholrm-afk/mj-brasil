// O shell do app: navegação numa coluna à esquerda, e a home é um veredito
// ("estamos em dia?") em vez de uma lista.
//
// Este arquivo não conhece tela nenhuma. Ele lê o registro de módulos, filtra pelo que o papel
// pode ver, e desenha. Acrescentar uma tela é acrescentar um módulo — nada aqui muda.
//
// DE QUEM É A TELA. A coluna é do SISTEMA e o cabeçalho é do CLIENTE. Os dois aparecem no alto,
// cada um no seu território, porque as duas perguntas são diferentes: "que sistema é este" e
// "de quem são estes dados". Quem atende mais de uma empresa precisa da segunda resposta antes
// de digitar qualquer coisa.
//
// A coluna também acabou com a segunda barra de menu. Antes se clicava no domínio e só então na
// tela; agora as telas do domínio estão todas visíveis e cada uma é um clique. A conta é a mesma
// de sempre — `dominios()` não mudou —, só o desenho é outro.
import { useEffect, useState } from 'react';
import appInfo from './app-info.json';
import { papelAtual, pessoaAtual, sair } from '@/lib/session';
import { Entrar } from '@/ui/Entrar';
import { Situacao } from '@/modules/nucleo/ui/Situacao';
import { MODULOS, modulosDe } from '@/modules';
import { modulosVisiveis, telaDaRota, type Modulo, type Rota } from '@/plataforma/modulo';
import { pode, type Papel } from '@/plataforma/acesso';
import { c, fonte, marca, reguaDaMarca } from '@/ui/estilo';
import { margemLateral, useEhCelular } from '@/ui/tela';
import { definirEmpresaAtiva, empresaAtiva, empresas } from '@/plataforma/empresa';
import '@/empresas';   // põe as empresas atendidas no registro

export type { Rota };

/** A home não é módulo: é o destino padrão e o único lugar que navega para os outros. */
const SITUACAO: Rota = 'situacao';

/** Largura da coluna. Cabe "Propriedade do Cliente" numa linha só, que é o rótulo mais longo. */
const COLUNA = 244;

/** Os módulos desta empresa que este papel enxerga. */
function menuDe(papel: Papel): Modulo[] {
  return modulosVisiveis(modulosDe(empresaAtiva().modulos), (p) => pode(papel, p));
}

/** Os domínios do menu, na ordem em que os módulos aparecem. Dois módulos podem dividir um
 *  domínio — as telas dos dois entram na mesma seção. */
function dominios(modulos: Modulo[]): { rotulo: string; telas: Modulo['telas'] }[] {
  const ordem: string[] = [];
  const por = new Map<string, Modulo['telas']>();
  for (const m of modulos) {
    if (!por.has(m.dominio)) { por.set(m.dominio, []); ordem.push(m.dominio); }
    por.get(m.dominio)!.push(...m.telas);
  }
  return ordem.map((rotulo) => ({ rotulo, telas: por.get(rotulo)! }));
}

/** Onde a pessoa cai ao entrar: a situação, se ela puder vê-la; senão a primeira tela que tem.
 *  O posto de uso único (a portaria) cai direto no que tem a fazer. */
function primeiraRota(papel: Papel): Rota {
  if (pode(papel, 'sgq.ver')) return SITUACAO;
  return menuDe(papel)[0]?.telas[0]?.rota ?? SITUACAO;
}

export function App() {
  const [pessoa, setPessoa] = useState(pessoaAtual);
  const [rota, setRota] = useState<Rota>(() => primeiraRota(papelAtual()));
  const [empresaId, setEmpresaId] = useState(() => empresaAtiva().id);
  const [menuAberto, setMenuAberto] = useState(false);
  const empresa = empresaAtiva();
  const celular = useEhCelular();
  const lado = margemLateral(celular);

  // Esc fecha a gaveta. O gancho fica ANTES do desvio da tela de entrada de propósito: gancho que
  // só roda em um dos caminhos quebra a ordem entre renderizações, e o React cobra.
  useEffect(() => {
    if (!menuAberto) return;
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuAberto(false); };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [menuAberto]);

  if (!pessoa) {
    return (
      <Entrar
        aoEntrar={() => {
          const quem = pessoaAtual();
          setPessoa(quem);
          setRota(primeiraRota(quem?.papel ?? 'coordenacao_qualidade'));
        }}
      />
    );
  }

  const papel = papelAtual();
  const meus = menuDe(papel);
  // Tudo que a empresa tem, sem filtro de permissão. Vai junto para a tela porque o manual mostra
  // o MODELO em branco de qualquer formulário instalado — modelo é documento, não registro.
  const instalados = modulosDe(empresaAtiva().modulos);
  const grupos = dominios(meus);
  const verSituacao = pode(papel, 'sgq.ver');

  const grupoAtivo = rota === SITUACAO
    ? null
    : grupos.find((g) => g.telas.some((t) => t.rota === rota)) ?? null;
  const tela = rota === SITUACAO ? null : telaDaRota(meus, rota);

  // Navegar fecha a gaveta. No celular ela cobre a tela: deixá-la aberta esconderia justamente o
  // que a pessoa acabou de pedir.
  const ir = (r: Rota) => { setRota(r); setMenuAberto(false); };

  const trocarEmpresa = (id: string) => {
    definirEmpresaAtiva(id);
    setEmpresaId(id);
    setRota(primeiraRota(papel));
    setMenuAberto(false);
  };

  return (
    <div style={{ ...S.pagina, flexDirection: celular ? 'column' : 'row' }}>

      {/* No celular a coluna vira gaveta, e some. Sem esta barra não sobraria nem como abri-la
          nem de quem é o sistema — e "de quem são os dados" é pergunta que não pode sumir junto
          com o menu. */}
      {celular && (
        <header style={S.topoCelular}>
          <button
            style={S.hamburguer}
            onClick={() => setMenuAberto((v) => !v)}
            aria-label={menuAberto ? 'Fechar o menu' : 'Abrir o menu'}
            aria-expanded={menuAberto}
          >
            {menuAberto ? '✕' : '☰'}
          </button>
          {/* Aqui vai o ÍCONE, e não a assinatura inteira: a 36px de altura o subtítulo da
              assinatura seria um borrão, e borrão não identifica nada. */}
          <img src="/marca/BraMex_icone_app.svg" alt="BraMex" style={S.iconeCelular} />
          <div style={{ minWidth: 0 }}>
            <div style={S.marcaNomeCelular}>BraMex</div>
            <div style={S.clienteCelular}>{empresa.identidade.nome}</div>
          </div>
        </header>
      )}

      {/* O véu é BOTÃO, e não `div aria-hidden`. Sobreposição que só fecha clicando num elemento
          escondido da árvore de acessibilidade não fecha para quem navega por teclado nem para
          leitor de tela — some da única saída que existe. Como botão, ele tem nome, recebe foco,
          e o Esc fecha junto. */}
      {celular && menuAberto && (
        <button style={S.veu} onClick={() => setMenuAberto(false)} aria-label="Fechar o menu" />
      )}

      <aside
        style={{
          ...S.coluna,
          ...(celular
            ? { ...S.colunaGaveta, transform: menuAberto ? 'translateX(0)' : `translateX(-${COLUNA + 8}px)` }
            : null),
        }}
      >
        {/* A marca fica na gaveta também: aberta, ela cobre a barra do celular, e sem isto o menu
            aberto seria a única tela do sistema que não diz que sistema é. */}
        <div style={S.marca}>
          {/* A assinatura escolhida é vertical e feita para fundo BRANCO: a borda dela é branca e
              o "Bra" é azul quase preto. Sobre escuro, a borda vira auréola e o "Bra" some. Por
              isso a coluna é clara — é o fundo que o arquivo pede. */}
          <img src="/marca/BraMex_logo_exata.png" alt="BraMex — Sistema de Qualidade e Gestão" style={S.marcaImg} />
        </div>

        <nav style={S.nav}>
          {verSituacao && (
            <ItemDeMenu rotulo="Situação" ativo={rota === SITUACAO} aoClicar={() => ir(SITUACAO)} />
          )}

          {grupos.map((g) => (
            // Domínio de uma tela só não ganha cabeçalho: seria um título para um item, e a
            // coluna encheria de rótulo repetido. Vira item direto, com o nome do domínio — que
            // é o nome pelo qual a pessoa o procura.
            g.telas.length === 1
              ? (
                <ItemDeMenu
                  key={g.rotulo} rotulo={g.rotulo} ativo={g === grupoAtivo}
                  aoClicar={() => ir(g.telas[0].rota)}
                />
              )
              : (
                <div key={g.rotulo}>
                  <div style={S.secao}>{g.rotulo}</div>
                  {g.telas.map((t) => (
                    <ItemDeMenu
                      key={t.rota} rotulo={t.rotulo} ativo={rota === t.rota}
                      aoClicar={() => ir(t.rota)}
                    />
                  ))}
                </div>
              )
          ))}
        </nav>

        <div style={S.rodapeColuna}>
          {empresas().length > 1 && (
            <select
              value={empresaId}
              onChange={(e) => trocarEmpresa(e.target.value)}
              style={S.trocaEmpresa}
              title="A empresa atendida. Trocar aqui troca a codificação, a tolerância, a marca e quais módulos existem — nenhuma regra muda."
            >
              {empresas().map((x) => (
                <option key={x.id} value={x.id}>{x.identidade.nome}{x.modelo ? ' (modelo)' : ''}</option>
              ))}
            </select>
          )}
          <div style={S.eu}>
            <span style={S.bolha}>{iniciais(pessoa.nome)}</span>
            <div style={{ minWidth: 0 }}>
              <div style={S.pessoaNome}>{pessoa.nome}</div>
              <div style={S.pessoaPapel}>{pessoa.cargo}</div>
            </div>
          </div>
          <button style={S.sair} onClick={() => { sair(); setPessoa(null); setMenuAberto(false); }}>
            Trocar de usuário
          </button>
        </div>
      </aside>

      <div style={S.direita}>
        {!celular && (
          <header style={S.faixaTopo}>
            <div style={S.onde}>{grupoAtivo?.rotulo ?? 'Visão geral'}</div>
            <div style={S.cliente}>
              <div style={S.clienteRotulo}>Cliente</div>
              <div style={S.clienteNome}>{empresa.identidade.nome}</div>
              <div style={S.clienteSub}>{empresa.identidade.subtitulo}</div>
              {/* O fio da cor do cliente, no canto do cliente. É o único lugar em que a marca de
                  quem é atendido pinta alguma coisa: pintar mais faria cada novo cliente trazer
                  uma paleta para dentro do sistema. */}
              <div style={{ ...S.clienteFio, background: empresa.identidade.acento }} />
            </div>
          </header>
        )}

        <div style={reguaDaMarca} />

        <div style={{ ...S.faixaDev, padding: `6px ${lado}px` }}>
          {import.meta.env?.VITE_DEMO === '1'
            ? 'Demonstração — nomes de empresas, obras e pessoas foram substituídos. As telas ligadas ao banco são só de leitura aqui.'
            : 'Ambiente de desenvolvimento — entrada sem senha, dados locais.'}
        </div>

        <main style={{ ...S.miolo, padding: `${celular ? 16 : 24}px ${lado}px 40px` }}>
          {rota === SITUACAO
            ? <Situacao irPara={ir} />
            // Rota que não é de nenhum módulo instalado acontece de verdade: troca-se de empresa
            // e a tela em que se estava pode não existir na outra. Cai na situação em vez de na
            // tela em branco.
            : tela?.render({ irPara: ir, modulos: meus, instalados }) ?? <Situacao irPara={ir} />}
        </main>

        {/* O rodapé diz o SISTEMA. Dizer o cliente aqui o repetiria pela terceira vez na mesma
            tela — ele já está no cabeçalho e no conteúdo inteiro. */}
        <div style={{ ...S.rodape, padding: `14px ${lado}px` }}>
          BraMex · Sistema de Qualidade e Gestão · {appInfo.chassisVersion}
        </div>
      </div>
    </div>
  );
}

function ItemDeMenu({ rotulo, ativo, aoClicar }: {
  rotulo: string; ativo: boolean; aoClicar: () => void;
}) {
  return (
    <button
      onClick={aoClicar}
      aria-current={ativo ? 'page' : undefined}
      style={{
        ...S.item,
        background: ativo ? c.acentoFraco : 'transparent',
        borderLeftColor: ativo ? marca.azul : 'transparent',
        color: ativo ? c.acento : c.tinta2,
        fontWeight: ativo ? 700 : 400,
      }}
    >
      {rotulo}
    </button>
  );
}

/** As duas primeiras iniciais do nome. Nome composto vira "VC", não "VCM". */
function iniciais(nome: string): string {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export { MODULOS };

const S: Record<string, React.CSSProperties> = {
  pagina: {
    minHeight: '100vh', display: 'flex',
    background: c.fundo, color: c.tinta, fontFamily: fonte.texto,
  },

  /* ── a coluna: território da marca ─────────────────────────────────────────────────────── */
  coluna: {
    width: COLUNA, flexShrink: 0, background: c.superficie, color: c.tinta,
    borderRight: `1px solid ${c.linhaForte}`,
    display: 'flex', flexDirection: 'column',
    // Sticky e não fixed: a coluna acompanha a rolagem sem tirar o miolo do fluxo, e uma coluna
    // mais alta que a tela ainda rola por dentro.
    position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100vh',
  },
  colunaGaveta: {
    position: 'fixed', top: 0, left: 0, zIndex: 40,
    boxShadow: '4px 0 24px rgba(0,0,0,.35)', transition: 'transform .18s ease-out',
  },
  // O respiro é padding e não margem no arquivo: o SVG traz o fundo na cor da coluna, então o
  // espaço em volta dele desaparece dentro da própria coluna.
  marca: {
    padding: '16px 16px 12px', borderBottom: `1px solid ${c.linha}`, flexShrink: 0,
  },
  marcaImg: { display: 'block', width: 140, maxWidth: '100%', height: 'auto', margin: '0 auto' },
  nav: { flex: 1, overflowY: 'auto', padding: '8px 0 16px', minHeight: 0 },
  secao: {
    fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase',
    color: c.suave, fontWeight: 700, padding: '16px 20px 6px',
  },
  item: {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '9px 20px', border: 'none', borderLeft: '3px solid transparent',
    fontFamily: fonte.texto, fontSize: 13.5, cursor: 'pointer',
  },
  rodapeColuna: {
    padding: '12px 18px 14px', borderTop: `1px solid ${c.linha}`, flexShrink: 0,
  },
  trocaEmpresa: {
    width: '100%', marginBottom: 10, fontFamily: fonte.texto, fontSize: 11.5,
    color: c.tinta2, padding: '4px 6px', borderRadius: 4,
    border: `1px solid ${c.linhaForte}`, background: c.superficie2,
  },
  eu: { display: 'flex', alignItems: 'center', gap: 10 },
  bolha: {
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: `linear-gradient(135deg, ${marca.verde}, ${marca.azul})`,
    color: '#FFFFFF', fontWeight: 700, fontSize: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  pessoaNome: { fontSize: 12.5, fontWeight: 600, color: c.tinta },
  pessoaPapel: { fontSize: 11, color: c.suave, marginTop: 1 },
  sair: {
    width: '100%', marginTop: 10, padding: '5px 9px', borderRadius: 4,
    border: `1px solid ${c.linhaForte}`, background: c.superficie,
    color: c.tinta2, fontFamily: fonte.texto, fontSize: 11, cursor: 'pointer',
  },

  /* ── o celular: barra fina e gaveta ────────────────────────────────────────────────────── */
  topoCelular: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px',
    background: marca.azulProfundo, color: marca.emFundoEscuroForte, position: 'sticky', top: 0, zIndex: 30,
  },
  hamburguer: {
    width: 36, height: 36, flexShrink: 0, borderRadius: 6, cursor: 'pointer',
    border: '1px solid rgba(255,255,255,.26)', background: 'transparent',
    color: marca.emFundoEscuroForte, fontSize: 15, lineHeight: 1,
  },
  iconeCelular: { width: 30, height: 30, borderRadius: 7, display: 'block', flexShrink: 0 },
  marcaNomeCelular: { fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' },
  clienteCelular: {
    fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase',
    color: marca.emFundoEscuroFraco, fontWeight: 600, marginTop: 1,
  },
  veu: {
    position: 'fixed', inset: 0, zIndex: 35, background: 'rgba(11,47,90,.5)',
    border: 'none', padding: 0, cursor: 'pointer',
  },

  /* ── a direita: território do conteúdo ─────────────────────────────────────────────────── */
  direita: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  faixaTopo: {
    background: c.superficie, borderBottom: `1px solid ${c.linha}`,
    padding: '13px 28px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
  },
  onde: { fontSize: 19, fontWeight: 700, letterSpacing: '-.02em', color: c.acento },
  cliente: { textAlign: 'right', borderLeft: `1px solid ${c.linha}`, paddingLeft: 20 },
  clienteRotulo: {
    fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase',
    color: c.suave, fontWeight: 700,
  },
  clienteNome: { fontSize: 15, fontWeight: 700, color: c.acento, letterSpacing: '-.01em' },
  clienteSub: { fontSize: 11.5, color: c.suave },
  clienteFio: { height: 3, borderRadius: 2, marginTop: 5, marginLeft: 'auto', width: 44 },
  faixaDev: {
    background: c.alertaFraco, borderBottom: `1px solid ${c.alerta}`,
    color: c.alerta, fontSize: 11.5, fontWeight: 600,
  },
  // minWidth: 0 é o que impede um filho largo (tabela) de esticar o main inteiro:
  // em flex, min-width vale 'auto' por padrão e o container cresce com o conteúdo.
  //
  // marginInline: 'auto' centra. Sem isso o conteúdo cola na esquerda e toda a sobra de um
  // monitor largo se junta do lado direito — parece defeito, e é.
  //
  // 1600 em vez de 1180: isto é painel com tabela, não artigo. O que precisa de linha curta
  // para ler é o texto corrido, e esse tem limite próprio (`prosa`), não o container inteiro.
  miolo: {
    flex: 1, minWidth: 0, width: '100%', maxWidth: 1600,
    marginInline: 'auto', padding: '24px 28px 40px',
  },
  rodape: {
    padding: '14px 28px', borderTop: `1px solid ${c.linha}`,
    fontSize: 11.5, color: c.suave,
  },
};
