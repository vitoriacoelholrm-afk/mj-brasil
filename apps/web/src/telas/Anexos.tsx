// O bloco de evidência anexada — foto e arquivo, com legenda e comentário.
//
// Era parte da tela de relatório e saiu de lá para cá quando a portaria precisou do mesmo bloco.
// Duplicar teria custado pouco hoje e caro depois: são dois lugares onde a legenda importa, e
// eles teriam divergido no primeiro ajuste.
//
// Dois botões, não um. "Tirar foto" pede a câmera de trás direto — no tablet do portão isso é a
// diferença entre um toque e quatro. No computador, onde não há câmera, ele abre o seletor de
// arquivos do mesmo jeito, e ninguém fica preso.
import { useRef } from 'react';
import { anexoDeArquivo, type Anexo } from '@/plataforma/anexos';
import { c, dataBR, fonte, s } from '@/ui/estilo';

export function Anexos({
  anexos, podeAnexar, titulo = 'Evidência anexada', vazio, porQuem = null,
  aoAdicionar, aoAlterar, aoRemover,
}: {
  anexos: Anexo[];
  podeAnexar: boolean;
  titulo?: string;
  /** O que dizer quando não há nada anexado. É onde se explica o que entra aqui. */
  vazio?: string;
  porQuem?: string | null;
  aoAdicionar: (novos: Anexo[]) => void;
  aoAlterar: (id: string, campo: 'legenda' | 'comentario', valor: string) => void;
  aoRemover: (id: string) => void;
}) {
  const camera = useRef<HTMLInputElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  async function escolher(lista: FileList | null, onde: HTMLInputElement | null) {
    if (!lista?.length) return;
    aoAdicionar(await Promise.all([...lista].map((f, i) => anexoDeArquivo(f, i, porQuem))));
    if (onde) onde.value = '';
  }

  return (
    <div style={S.bloco}>
      <div style={S.blocoTopo}>
        <div style={S.blocoTit}>{titulo}</div>
        {podeAnexar && (
          <>
            <button style={S.botaoFoto} onClick={() => camera.current?.click()}>Tirar foto</button>
            <button style={{ ...s.botao, padding: '6px 12px', fontSize: 13 }} onClick={() => arquivo.current?.click()}>
              Anexar arquivo
            </button>
          </>
        )}
        <input
          ref={camera} type="file" accept="image/*" capture="environment"
          style={{ display: 'none' }} onChange={(e) => void escolher(e.target.files, camera.current)}
        />
        <input
          ref={arquivo} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          style={{ display: 'none' }} onChange={(e) => void escolher(e.target.files, arquivo.current)}
        />
      </div>

      {anexos.length === 0 ? (
        <div style={S.vazio}>
          {podeAnexar
            ? vazio ?? 'Nenhuma evidência ainda.'
            : 'Nenhuma evidência anexada a este registro.'}
        </div>
      ) : (
        <div style={S.grade}>
          {anexos.map((a) => (
            <div key={a.id} style={S.anexo}>
              <div style={S.miniatura}>
                {a.url
                  ? <img src={a.url} alt={a.legenda || a.nome} style={S.img} />
                  : <span style={S.semImagem}>{a.tipo === 'foto' ? 'foto' : 'arquivo'}</span>}
              </div>
              <div style={S.anexoCorpo}>
                <div style={S.anexoNome} title={a.nome}>{a.nome}</div>

                <label style={S.rotuloCampo}>Legenda — sai no documento</label>
                {podeAnexar
                  ? <input
                      style={S.campoTexto} value={a.legenda}
                      placeholder="O que a foto mostra, em uma linha"
                      onChange={(e) => aoAlterar(a.id, 'legenda', e.target.value)}
                    />
                  : <div style={S.textoFixo}>{a.legenda || <em style={{ color: c.suave }}>sem legenda</em>}</div>}

                <label style={S.rotuloCampo}>Observação — fica no registro interno</label>
                {podeAnexar
                  ? <textarea
                      style={{ ...S.campoTexto, minHeight: 46, resize: 'vertical' }} value={a.comentario}
                      placeholder="Contexto, quem pediu, o que observar na imagem"
                      onChange={(e) => aoAlterar(a.id, 'comentario', e.target.value)}
                    />
                  : <div style={S.textoFixo}>{a.comentario || <em style={{ color: c.suave }}>sem observação</em>}</div>}

                <div style={S.anexoRodape}>
                  <span style={S.data}>
                    {dataBR(a.data)}{a.adicionadoPor ? ` · ${a.adicionadoPor}` : ''}
                  </span>
                  {podeAnexar && <button style={S.remover} onClick={() => aoRemover(a.id)}>remover</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  bloco: { padding: '14px 18px 18px', borderTop: `1px solid ${c.linha}` },
  blocoTopo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  blocoTit: {
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
    color: c.suave, flex: 1,
  },
  botaoFoto: {
    padding: '6px 12px', fontSize: 13, borderRadius: 3, cursor: 'pointer',
    fontFamily: fonte.texto, fontWeight: 600,
    border: `1px solid ${c.acentoMarca}`, background: c.acentoFraco, color: c.acento,
  },
  vazio: { fontSize: 13, color: c.suave, lineHeight: 1.6, maxWidth: 620 },
  grade: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 },
  anexo: { display: 'flex', gap: 12, border: `1px solid ${c.linha}`, borderRadius: 3, padding: 10, background: c.superficie2 },
  miniatura: {
    width: 74, height: 74, flexShrink: 0, borderRadius: 3, overflow: 'hidden',
    border: `1px solid ${c.linhaForte}`, background: c.superficie,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  semImagem: {
    fontFamily: fonte.mono, fontSize: 10.5, color: c.suave, textTransform: 'uppercase', letterSpacing: '.06em',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  anexoCorpo: { flex: 1, minWidth: 0 },
  anexoNome: {
    fontSize: 12.5, fontWeight: 600, color: c.tinta, marginBottom: 7,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  rotuloCampo: { display: 'block', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: c.suave, fontWeight: 600, marginBottom: 3 },
  campoTexto: {
    width: '100%', fontFamily: fonte.texto, fontSize: 13, padding: '6px 8px', marginBottom: 8,
    borderRadius: 3, border: `1px solid ${c.linhaForte}`, background: c.superficie, color: c.tinta,
  },
  textoFixo: { fontSize: 13, color: c.tinta2, marginBottom: 8, lineHeight: 1.5 },
  anexoRodape: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  data: { fontFamily: fonte.mono, fontSize: 11, color: c.suave, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  remover: {
    border: 'none', background: 'none', color: c.critico, cursor: 'pointer',
    fontFamily: fonte.texto, fontSize: 12, padding: 0, flexShrink: 0,
  },
};
