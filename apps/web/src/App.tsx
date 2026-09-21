// O shell do app: navegação em cima agrupada por domínio, e a home é um veredito
// ("estamos em dia?") em vez de uma lista.
//
// Este arquivo não conhece tela nenhuma. Ele lê o registro de módulos, filtra pelo que o papel
// pode ver, e desenha. Acrescentar uma tela é acrescentar um módulo — nada aqui muda.
import { useState } from 'react';
import appInfo from './app-info.json';
import { papelAtual, pessoaAtual, sair } from '@/lib/session';
import { Entrar } from '@/ui/Entrar';
import { Situacao } from '@/modules/nucleo/ui/Situacao';
import { MODULOS, modulosDe } from '@/modules';
import { modulosVisiveis, telaDaRota, type Modulo, type Rota } from '@/plataforma/modulo';
import { pode, type Papel } from '@/plataforma/acesso';
import { c, fonte } from '@/ui/estilo';
import { margemLateral, useEhCelular } from '@/ui/tela';
import { definirEmpresaAtiva, empresaAtiva, empresas } from '@/plataforma/empresa';
import '@/empresas';   // põe as empresas atendidas no registro

export type { Rota };

/** A home não é módulo: é o destino padrão e o único lugar que navega para os outros. */
const SITUACAO: Rota = 'situacao';

/** Os módulos desta empresa que este papel enxerga. */
function menuDe(papel: Papel): Modulo[] {
  return modulosVisiveis(modulosDe(empresaAtiva().modulos), (p) => pode(papel, p));
}

/** Os domínios do menu de cima, na ordem em que os módulos aparecem. Dois módulos podem dividir
 *  um domínio — as telas dos dois viram abas dentro dele. */
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
  const empresa = empresaAtiva();
  const celular = useEhCelular();
  const lado = margemLateral(celular);

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
  const grupos = dominios(meus);
  const verSituacao = pode(papel, 'sgq.ver');

  const grupoAtivo = rota === SITUACAO
    ? null
    : grupos.find((g) => g.telas.some((t) => t.rota === rota)) ?? null;
  const tela = rota === SITUACAO ? null : telaDaRota(meus, rota);

  return (
    <div style={S.pagina}>
      <header style={{ ...S.topo, flexWrap: celular ? 'wrap' : 'nowrap' }}>
        <div style={{ ...S.marca, padding: celular ? '12px 16px' : '14px 24px', borderRight: celular ? 'none' : `1px solid ${c.linha}`, flex: celular ? '1 1 auto' : '0 0 auto', minWidth: 0 }}>
          <div style={{ ...S.marcaNome, color: empresa.identidade.acento }}>{empresa.identidade.nome}</div>
          <div style={S.marcaSub}>{empresa.identidade.subtitulo}</div>
          {empresas().length > 1 && (
            <select
              value={empresaId}
              onChange={(e) => { definirEmpresaAtiva(e.target.value); setEmpresaId(e.target.value); setRota(primeiraRota(papel)); }}
              style={S.trocaEmpresa}
              title="A empresa atendida. Trocar aqui troca a codificação, a tolerância, a marca e quais módulos existem — nenhuma regra muda."
            >
              {empresas().map((x) => (
                <option key={x.id} value={x.id}>{x.identidade.nome}{x.modelo ? ' (modelo)' : ''}</option>
              ))}
            </select>
          )}
        </div>

        <nav style={{ ...S.nav, flexBasis: celular ? '100%' : 'auto', order: celular ? 3 : 0, borderTop: celular ? `1px solid ${c.linha}` : 'none' }}>
          {verSituacao && (
            <BotaoDeMenu
              rotulo="Situação" ativo={rota === SITUACAO} celular={celular}
              aoClicar={() => setRota(SITUACAO)}
            />
          )}
          {grupos.map((g) => (
            <BotaoDeMenu
              key={g.rotulo} rotulo={g.rotulo} ativo={g === grupoAtivo} celular={celular}
              aoClicar={() => g.telas[0] && setRota(g.telas[0].rota)}
            />
          ))}
        </nav>

        <div style={{ ...S.pessoa, padding: celular ? '12px 16px' : '12px 24px', borderLeft: celular ? 'none' : `1px solid ${c.linha}` }}>
          <div style={S.pessoaNome}>{pessoa.nome}</div>
          <div style={S.pessoaPapel}>{pessoa.cargo}</div>
          <button style={S.sair} onClick={() => { sair(); setPessoa(null); }}>Trocar de usuário</button>
        </div>
      </header>

      <div style={{ ...S.faixaDev, padding: `6px ${lado}px` }}>
        {import.meta.env?.VITE_DEMO === '1'
          ? 'Demonstração — nomes de empresas, obras e pessoas foram substituídos. As telas ligadas ao banco são só de leitura aqui.'
          : 'Ambiente de desenvolvimento — entrada sem senha, dados locais.'}
      </div>

      {grupoAtivo && grupoAtivo.telas.length > 1 && (
        <div style={{ ...S.subnav, padding: `14px ${lado}px 0`, flexWrap: 'wrap' }}>
          {grupoAtivo.telas.map((t) => (
            <button
              key={t.rota}
              onClick={() => setRota(t.rota)}
              style={{
                ...S.subItem,
                background: rota === t.rota ? c.acentoFraco : 'transparent',
                borderColor: rota === t.rota ? c.acentoMarca : c.linha,
                color: rota === t.rota ? c.acento : c.tinta2,
                fontWeight: rota === t.rota ? 700 : 500,
              }}
            >
              {t.rotulo}
            </button>
          ))}
        </div>
      )}

      <main style={{ ...S.miolo, padding: `${celular ? 16 : 24}px ${lado}px 40px` }}>
        {rota === SITUACAO
          ? <Situacao irPara={setRota} />
          // Rota que não é de nenhum módulo instalado acontece de verdade: troca-se de empresa
          // e a tela em que se estava pode não existir na outra. Cai na situação em vez de na
          // tela em branco.
          : tela?.render() ?? <Situacao irPara={setRota} />}
      </main>

      <div style={{ ...S.rodape, padding: `14px ${lado}px` }}>{appInfo.client} · {appInfo.name}</div>
    </div>
  );
}

function BotaoDeMenu({ rotulo, ativo, celular, aoClicar }: {
  rotulo: string; ativo: boolean; celular: boolean; aoClicar: () => void;
}) {
  return (
    <button
      onClick={aoClicar}
      style={{
        ...S.navItem,
        padding: celular ? '12px 14px' : '0 20px',
        borderBottomColor: ativo ? c.acentoMarca : 'transparent',
        fontWeight: ativo ? 700 : 500,
        color: ativo ? c.tinta : c.tinta2,
      }}
    >
      {rotulo}
    </button>
  );
}

export { MODULOS };

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
