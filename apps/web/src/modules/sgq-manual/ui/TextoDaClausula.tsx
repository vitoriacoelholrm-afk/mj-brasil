// O QUE O MANUAL DIZ SOBRE ESTA CLÁUSULA — e, no modelo, onde se escreve.
//
// É a primeira resposta que o auditor quer: ele pergunta "o que vocês fazem quanto à 8.5.5?" e o
// que responde não é a lista de documentos, é o texto que a empresa escreveu e assinou. A lista
// vem depois, para provar.
//
// Duas fontes, e a ordem importa:
//   · o PERFIL traz o texto do documento emitido (ou, no modelo, o exemplo). É a base.
//   · o BANCO traz o que alguém escreveu pela tela. Quando existe, vale este — foi escrito depois.
//
// Escrever só abre na empresa modelo, pela regra de sempre: no cliente, quem escreve é a empresa.
import { useEffect, useState } from 'react';
import { podeEditarOModelo } from '@/plataforma/acesso';
import { empresaAtiva } from '@/plataforma/empresa';
import { papelAtual, pessoaAtual } from '@/lib/session';
import {
  chaveDoTexto, listarTextos, salvarTexto, type TextoDeDocumento,
} from '@/modules/sgq-documentos/textos';
import { corridoDo, manualDaEmpresa, textoDaClausula, type ClausulaDoManual } from '../texto';
import { c, dataBR, fonte, pastilha, s } from '@/ui/estilo';

/** O texto do perfil virado em linhas, para servir de ponto de partida à edição. Mantém os
 *  subitens numerados: é por eles que o auditor pede o trecho. */
function comoTexto(clausula: ClausulaDoManual): string {
  return clausula.trechos.map((t) => [
    [t.sub, t.titulo].filter(Boolean).join(' '),
    ...(t.paragrafos ?? []),
    t.citacao ? `"${t.citacao}"` : '',
    ...(t.itens ?? []).map((i) => `- ${i}`),
    t.nota ? `NOTA: ${t.nota}` : '',
  ].filter(Boolean).join('\n')).join('\n\n');
}

export function TextoDaClausula({ ref_ }: { ref_: string }) {
  const empresa = empresaAtiva();
  const manual = manualDaEmpresa();
  const doPerfil = textoDaClausula(ref_);
  const podeEscrever = podeEditarOModelo(papelAtual(), empresa.modelo === true);

  const [gravado, setGravado] = useState<TextoDeDocumento | null>(null);
  const [texto, setTexto] = useState('');
  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    setEditando(false);
    setErro(null);
    listarTextos(empresa.id)
      .then((mapa) => {
        if (!vivo || !manual) return;
        const achado = mapa.get(chaveDoTexto(manual.codigo, ref_)) ?? null;
        setGravado(achado);
        setTexto(achado?.texto ?? '');
      })
      .catch((e) => { if (vivo) setErro((e as Error)?.message ?? 'falha ao carregar'); })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [ref_, empresa.id]);

  if (!manual) {
    return (
      <Cartao titulo="O que o manual da empresa diz">
        <div style={{ ...S.vazio, ...s.prosa }}>
          Esta empresa ainda não tem o texto do manual no sistema. Ele pode existir como arquivo —
          o que falta é ele chegar aqui, cláusula por cláusula.
        </div>
      </Cartao>
    );
  }

  const escrito = gravado?.texto?.trim() ? gravado.texto : null;
  const mudou = texto !== (gravado?.texto ?? '');

  async function salvar() {
    if (!podeEscrever || salvando || !manual) return;
    setSalvando(true);
    setErro(null);
    try {
      const quem = pessoaAtual()?.nome ?? null;
      await salvarTexto(empresa.id, manual.codigo, texto, quem, ref_);
      setGravado({
        codigo: manual.codigo, secao: ref_, texto,
        atualizadoPorNome: quem, atualizadoEm: new Date().toISOString(),
      });
      setEditando(false);
    } catch (e) {
      setErro((e as Error)?.message ?? 'não foi possível gravar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Cartao
      titulo="O que o manual da empresa diz"
      acao={
        <>
          <span style={S.selo}>{manual.codigo}{doPerfil ? ` · ${doPerfil.titulo}` : ''}</span>
          {manual.exemplo && <span style={pastilha('alerta')}>exemplo</span>}
          {escrito && <span style={pastilha('ok')}>editado na tela</span>}
        </>
      }
    >
      {/* O exemplo do modelo é dito em voz alta. Texto de exemplo que passa por manual assinado é
          como a lista mestra dizer "vigente" num documento que ninguém escreveu. */}
      {manual.exemplo && !escrito && (
        <div style={{ ...S.aviso, ...s.prosa }}>
          Este é o texto de partida do modelo, não o manual de uma empresa. "A EMPRESA" em caixa
          alta é o que se troca primeiro — se sobrar no documento final, salta aos olhos de quem
          revisa.
        </div>
      )}

      {carregando ? (
        <div style={S.vazio}>Carregando o texto…</div>
      ) : editando ? (
        <div style={{ padding: '14px 18px' }}>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`O que a empresa faz quanto à cláusula ${ref_}.`}
            style={S.editor}
          />
        </div>
      ) : escrito ? (
        <div style={{ padding: '4px 18px 14px' }}>
          {escrito.split('\n').filter((l) => l.trim()).map((linha, i) => (
            <p key={i} style={{ ...S.paragrafo, ...s.prosa }}>{linha}</p>
          ))}
        </div>
      ) : doPerfil ? (
        <div style={{ padding: '4px 18px 14px' }}>
          {doPerfil.trechos.map((t, i) => (
            <div key={i} style={S.trecho}>
              {(t.sub || t.titulo) && (
                <div style={S.subTitulo}>
                  {t.sub && <span style={S.sub}>{t.sub}</span>}
                  {t.titulo}
                </div>
              )}
              {(t.paragrafos ?? []).map((p, j) => (
                <p key={j} style={{ ...S.paragrafo, ...s.prosa }}>{p}</p>
              ))}
              {t.citacao && <blockquote style={{ ...S.citacao, ...s.prosa }}>{t.citacao}</blockquote>}
              {t.itens && (
                <ul style={S.itens}>
                  {t.itens.map((item, j) => (
                    <li key={j} style={{ ...S.item, ...s.prosa }}>{item}</li>
                  ))}
                </ul>
              )}
              {t.nota && (
                <p style={{ ...S.nota, ...s.prosa }}>
                  <strong style={{ color: c.tinta2 }}>NOTA: </strong>{t.nota}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...S.vazio, ...s.prosa }}>
          O manual {manual.codigo} não escreve nada sobre esta cláusula. Um manual da qualidade
          percorre a norma inteira — cláusula sem texto aqui é buraco no manual, e é o tipo de
          coisa que o auditor encontra antes de qualquer outra.
        </div>
      )}

      {(podeEscrever || erro || gravado?.atualizadoEm) && (
        <div style={S.acoes}>
          {podeEscrever && !editando && (
            <button
              style={s.botao}
              onClick={() => {
                // Começa do que já existe: o gravado, ou o exemplo do perfil. Abrir em branco
                // faria a pessoa redigitar um texto que já está na tela.
                setTexto(gravado?.texto || (doPerfil ? comoTexto(doPerfil) : ''));
                setEditando(true);
              }}
            >
              {escrito ? 'Editar o texto' : 'Escrever esta cláusula'}
            </button>
          )}
          {podeEscrever && editando && (
            <>
              <button
                style={mudou && !salvando ? s.botaoPrimario : { ...s.botao, opacity: 0.55, cursor: 'not-allowed' }}
                onClick={salvar}
                disabled={!mudou || salvando}
              >
                {salvando ? 'Gravando…' : 'Gravar a cláusula'}
              </button>
              <button
                style={s.botao}
                onClick={() => { setTexto(gravado?.texto ?? ''); setEditando(false); }}
              >
                Cancelar
              </button>
            </>
          )}
          {gravado?.atualizadoEm && !editando && (
            <span style={S.rodape}>
              Gravado em {dataBR(gravado.atualizadoEm.slice(0, 10))}
              {gravado.atualizadoPorNome ? ` por ${gravado.atualizadoPorNome}` : ''}
            </span>
          )}
          {erro && <span style={{ ...S.rodape, color: c.critico }}>Não gravou: {erro}</span>}
        </div>
      )}
    </Cartao>
  );
}

/** O resumo de uma linha, para a lista de cláusulas. Serve para dizer que há texto sem abrir. */
export function resumoDoManual(ref_: string, limite = 130): string | null {
  const x = textoDaClausula(ref_);
  if (!x) return null;
  const corrido = x.trechos.map(corridoDo).join(' ').trim();
  return corrido.length > limite ? `${corrido.slice(0, limite).trimEnd()}…` : corrido;
}

function Cartao({ titulo, acao, children }: {
  titulo: string; acao?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{ ...s.cartao, overflow: 'hidden' }}>
      <div style={S.faixa}>
        <span style={{ flex: 1 }}>{titulo}</span>
        {acao}
      </div>
      {children}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  faixa: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    padding: '10px 18px', background: c.superficie2, borderBottom: `1px solid ${c.linhaForte}`,
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: c.tinta2,
  },
  selo: {
    fontFamily: fonte.mono, fontSize: 11.5, fontWeight: 700, color: c.tinta2,
    letterSpacing: 0, textTransform: 'none',
  },
  trecho: { paddingTop: 10 },
  subTitulo: {
    display: 'flex', alignItems: 'baseline', gap: 8,
    fontSize: 13, fontWeight: 700, color: c.tinta2, marginBottom: 4,
  },
  sub: { fontFamily: fonte.mono, fontSize: 12, color: c.acento },
  paragrafo: { fontSize: 14, color: c.tinta, lineHeight: 1.65, margin: '0 0 8px' },
  citacao: {
    fontSize: 14, color: c.tinta, lineHeight: 1.65, fontStyle: 'italic',
    margin: '0 0 10px', padding: '8px 14px',
    borderLeft: `3px solid ${c.acentoMarca}`, background: c.acentoFraco,
  },
  itens: { margin: '0 0 10px', paddingLeft: 20 },
  item: { fontSize: 13.5, color: c.tinta2, lineHeight: 1.6, marginBottom: 4 },
  nota: { fontSize: 12.5, color: c.suave, lineHeight: 1.6, margin: '0 0 8px' },
  vazio: { fontSize: 13.5, color: c.suave, lineHeight: 1.6, padding: '16px 18px' },
  aviso: { fontSize: 13, color: c.suave, lineHeight: 1.6, padding: '12px 18px 0' },
  editor: {
    width: '100%', minHeight: 260, resize: 'vertical',
    fontFamily: fonte.texto, fontSize: 14, lineHeight: 1.65, color: c.tinta,
    padding: '12px 14px', borderRadius: 3,
    border: `1px solid ${c.linhaForte}`, background: c.superficie, boxSizing: 'border-box',
  },
  acoes: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    padding: '12px 18px', borderTop: `1px solid ${c.linha}`, background: c.superficie2,
  },
  rodape: { fontSize: 12, color: c.suave },
};
