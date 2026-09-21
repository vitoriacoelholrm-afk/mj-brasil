// O DOCUMENTO ABERTO — a ficha da lista mestra e, embaixo, o texto dele.
//
// Escrever aqui só vale para a EMPRESA MODELO. No perfil de um cliente a mesma tela abre em
// leitura, e o aviso diz por quê: o registro do cliente é evidência DA EMPRESA dele, e
// consultoria que escreve dentro dele tira a independência da conferência (§9.2).
//
// O modelo é outra coisa — é o molde, escrito antes de existir cliente. Quem o escreve é quem
// conhece a norma. A regra inteira mora em `podeEditarOModelo`, e esta tela só a consulta.
import { useEffect, useState } from 'react';
import type { DocumentoMestre } from '@/plataforma/documentos';
import { NATUREZA_ROTULO } from '@/plataforma/documentos';
import { podeEditarOModelo } from '@/plataforma/acesso';
import { empresaAtiva } from '@/plataforma/empresa';
import { papelAtual, pessoaAtual } from '@/lib/session';
import { listarTextos, salvarTexto, type TextoDeDocumento } from '../textos';
import { catalogoPara } from '../catalogoPadrao';
import { c, dataBR, fonte, pastilha, s } from '@/ui/estilo';

/** O roteiro do padrão que este documento cumpre — os pontos que a cláusula obriga a cobrir.
 *  Vem do catálogo, é da norma, e vale para qualquer empresa. Null quando o documento não cumpre
 *  padrão nenhum, que é o caso de tudo que a empresa criou por conta. */
function roteiroDe(doc: DocumentoMestre, modulos: string[]): string[] | null {
  const chaves = doc.padroes ?? [];
  if (chaves.length === 0) return null;
  const padrao = catalogoPara(modulos).find((p) => chaves.includes(p.chave) && p.roteiro?.length);
  return padrao?.roteiro ?? null;
}

/** Transforma o roteiro no começo do documento: cada ponto vira um título, com espaço embaixo.
 *  É esqueleto, não conteúdo — o que vai debaixo de cada título é de quem conhece a empresa. */
const esqueleto = (roteiro: string[]) =>
  roteiro.map((ponto) => `${ponto.split(' — ')[0]}\n\n`).join('\n');

export function Documento({ doc, aoVoltar }: { doc: DocumentoMestre; aoVoltar: () => void }) {
  const empresa = empresaAtiva();
  const podeEscrever = podeEditarOModelo(papelAtual(), empresa.modelo === true);
  const roteiro = roteiroDe(doc, empresa.modulos);

  const [texto, setTexto] = useState('');
  const [gravado, setGravado] = useState<TextoDeDocumento | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    setErro(null);
    listarTextos(empresa.id)
      .then((mapa) => {
        if (!vivo) return;
        const achado = mapa.get(doc.codigo) ?? null;
        setGravado(achado);
        setTexto(achado?.texto ?? '');
      })
      .catch((e) => { if (vivo) setErro((e as Error)?.message ?? 'falha ao carregar'); })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [doc.codigo, empresa.id]);

  const mudou = texto !== (gravado?.texto ?? '');

  async function salvar() {
    if (!podeEscrever || salvando || !mudou) return;
    setSalvando(true);
    setErro(null);
    try {
      const quem = pessoaAtual()?.nome ?? null;
      await salvarTexto(empresa.id, doc.codigo, texto, quem);
      // Só considera gravado depois que o banco confirmou. Marcar antes daria "salvo" numa tela
      // onde a pessoa acabou de escrever três páginas que não foram a lugar nenhum.
      setGravado({ codigo: doc.codigo, texto, atualizadoPorNome: quem, atualizadoEm: new Date().toISOString() });
    } catch (e) {
      setErro((e as Error)?.message ?? 'não foi possível gravar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={aoVoltar} style={S.voltar}>← Toda a lista mestra</button>

      <div style={{ ...s.cartao, overflow: 'hidden' }}>
        <div style={S.faixa}>
          <span style={S.codigo}>{doc.codigo}</span>
          <span style={{ flex: 1 }}>{doc.titulo}</span>
          <span style={pastilha(doc.situacao === 'vigente' ? 'ok' : 'alerta')}>{doc.situacao}</span>
        </div>
        <div style={S.ficha}>
          <Campo rotulo="Natureza" valor={NATUREZA_ROTULO[doc.natureza]} />
          <Campo rotulo="Categoria" valor={doc.categoria} />
          <Campo rotulo="Responsável" valor={doc.responsavel ?? '—'} />
          <Campo rotulo="Revisão" valor={doc.revisao ?? 'sem revisão'} />
          <Campo rotulo="Emissão" valor={doc.emissao ? dataBR(doc.emissao) : '—'} />
          <Campo rotulo="Cláusulas" valor={(doc.clausulas ?? []).join(', ') || '—'} />
        </div>
      </div>

      {roteiro && (
        <div style={{ ...s.cartao, overflow: 'hidden' }}>
          <div style={S.faixa}>
            <span style={{ flex: 1 }}>O que a cláusula obriga este documento a cobrir</span>
            <span style={pastilha('neutro')}>{roteiro.length} pontos</span>
          </div>
          <div style={{ ...S.aviso, ...s.prosa, paddingBottom: 6 }}>
            Isto é da norma, não da empresa — vale para qualquer cliente. O texto de cada ponto é
            que é de quem conhece a casa.
          </div>
          <ol style={S.roteiro}>
            {roteiro.map((ponto) => {
              const [titulo, ...resto] = ponto.split(' — ');
              return (
                <li key={titulo} style={S.pontoDoRoteiro}>
                  <span style={S.pontoTitulo}>{titulo}</span>
                  {resto.length > 0 && <span style={{ ...S.pontoNota, ...s.prosa }}>{resto.join(' — ')}</span>}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div style={{ ...s.cartao, overflow: 'hidden' }}>
        <div style={S.faixa}>
          <span style={{ flex: 1 }}>O documento</span>
          {podeEscrever && (
            <span style={pastilha(mudou ? 'alerta' : 'ok')}>
              {mudou ? 'não gravado' : gravado ? 'gravado' : 'em branco'}
            </span>
          )}
        </div>

        {!podeEscrever && (
          <div style={{ ...S.aviso, ...s.prosa }}>
            {empresa.modelo
              ? 'Escrever o modelo é da Coordenação da Qualidade.'
              : `Este é o sistema da ${empresa.identidade.nome}, e o texto dos documentos dela é escrito por ela. A consultoria confere — e quem confere não preenche, senão o registro deixa de ser evidência da empresa e a independência da conferência (§9.2) some junto. O que se edita aqui é a EMPRESA MODELO.`}
          </div>
        )}

        {carregando ? (
          <div style={S.aviso}>Carregando o texto…</div>
        ) : podeEscrever ? (
          <div style={{ padding: '14px 18px' }}>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={`Escreva aqui o ${NATUREZA_ROTULO[doc.natureza].toLowerCase()}. É o texto que o próximo cliente vai receber pronto — depois é só trocar o nome da empresa e o que for dela.`}
              style={S.editor}
            />
          </div>
        ) : (
          <div style={{ padding: '14px 18px' }}>
            {texto
              ? <div style={{ ...S.leitura, ...s.prosa }}>{texto}</div>
              : <div style={{ ...S.aviso, padding: 0 }}>Este documento ainda não tem texto no sistema. Ele existe como arquivo, em {doc.local ?? 'lugar não informado'}.</div>}
          </div>
        )}

        <div style={S.acoes}>
          {podeEscrever && (
            <button
              style={mudou && !salvando ? s.botaoPrimario : { ...s.botao, opacity: 0.55, cursor: 'not-allowed' }}
              onClick={salvar}
              disabled={!mudou || salvando}
            >
              {salvando ? 'Gravando…' : 'Gravar documento'}
            </button>
          )}
          {/* Só quando está em branco: despejar o esqueleto em cima de texto escrito seria
              apagar trabalho. */}
          {podeEscrever && roteiro && texto.trim() === '' && (
            <button style={s.botao} onClick={() => setTexto(esqueleto(roteiro))}>
              Começar pelo roteiro
            </button>
          )}
          {gravado?.atualizadoEm && (
            <span style={S.rodape}>
              Última gravação em {dataBR(gravado.atualizadoEm.slice(0, 10))}
              {gravado.atualizadoPorNome ? ` por ${gravado.atualizadoPorNome}` : ''}
            </span>
          )}
          {erro && <span style={{ ...S.rodape, color: c.critico }}>Não gravou: {erro}</span>}
        </div>
      </div>
    </div>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <div style={S.rotulo}>{rotulo}</div>
      <div style={S.valor}>{valor}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  voltar: {
    alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0,
    color: c.acento, fontFamily: fonte.texto, fontSize: 13.5, cursor: 'pointer',
  },
  faixa: {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    padding: '10px 18px', background: c.superficie2, borderBottom: `1px solid ${c.linhaForte}`,
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: c.tinta2,
  },
  codigo: { fontFamily: fonte.mono, fontSize: 13, color: c.acento, letterSpacing: 0 },
  ficha: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, padding: 18 },
  rotulo: { fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: c.suave, fontWeight: 600 },
  valor: { fontSize: 14, color: c.tinta, marginTop: 3, lineHeight: 1.5 },
  aviso: { fontSize: 13.5, color: c.suave, lineHeight: 1.6, padding: '16px 18px' },
  editor: {
    width: '100%', minHeight: 340, resize: 'vertical',
    fontFamily: fonte.texto, fontSize: 14, lineHeight: 1.65, padding: '12px 14px',
    borderRadius: 3, border: `1px solid ${c.linhaForte}`, background: c.superficie, color: c.tinta,
  },
  leitura: { fontSize: 14, color: c.tinta, lineHeight: 1.7, whiteSpace: 'pre-wrap' },
  roteiro: { margin: 0, padding: '0 18px 18px 40px', display: 'flex', flexDirection: 'column', gap: 12 },
  pontoDoRoteiro: { display: 'flex', flexDirection: 'column', gap: 3 },
  pontoTitulo: { fontSize: 13.5, fontWeight: 600, color: c.tinta },
  pontoNota: { fontSize: 12.5, color: c.suave, lineHeight: 1.55 },
  acoes: {
    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    padding: '14px 18px', borderTop: `1px solid ${c.linha}`, background: c.superficie2,
  },
  rodape: { fontFamily: fonte.mono, fontSize: 11.5, color: c.suave },
};
