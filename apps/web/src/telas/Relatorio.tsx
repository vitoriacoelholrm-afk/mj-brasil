// O relatório de inspeção — FM-002 — gerado a partir da ordem de serviço.
//
// Não existe campo para digitar aqui. Tudo que aparece foi lido da OS: a especificação, a
// medição, os lotes, as condições, os instrumentos, as datas. É por isso que ele não pode
// divergir do Plano de Serviço: é o mesmo dado, mostrado de outro jeito.
//
// E o veredito não é uma caixinha que alguém marca. Se a OS não libera, o relatório sai
// reprovado — e o botão mostra por quê, antes de gerar.
import { useRef, useState } from 'react';
import {
  gerarRelatorio, impedimentosDoRelatorio,
  type Anexo, type OrdemServico, type Relatorio,
} from '@/os/exemplos';
import { carimbo } from '@/documentos/listaMestra';
import { c, dataBR, fonte, pastilha, s } from '@/ui/estilo';

export function PainelRelatorio({
  os, anexos, aoAdicionar, aoAlterar, aoRemover,
}: {
  os: OrdemServico;
  anexos: Anexo[];
  aoAdicionar: (novos: Anexo[]) => void;
  aoAlterar: (id: string, campo: 'legenda' | 'comentario', valor: string) => void;
  aoRemover: (id: string) => void;
}) {
  const [gerado, setGerado] = useState<Relatorio | null>(null);
  const impedimentos = impedimentosDoRelatorio(os);
  const podeAprovar = impedimentos.length === 0;

  return (
    <div style={{ ...s.cartao, overflow: 'hidden' }}>
      <div style={S.faixa}>
        <span>Relatório de inspeção · {carimbo('FM-002')}</span>
        <span style={pastilha(podeAprovar ? 'ok' : 'critico')}>
          {podeAprovar ? 'sai aprovado' : 'sai reprovado'}
        </span>
      </div>

      <div style={S.acao}>
        <button
          style={podeAprovar ? s.botaoPrimario : { ...s.botao, borderColor: c.critico, color: c.critico }}
          onClick={() => setGerado(gerarRelatorio(os))}
        >
          {gerado ? 'Gerar de novo' : 'Gerar RIP'}
        </button>
        <span style={S.explica}>
          {podeAprovar
            ? 'Tudo medido e dentro da tolerância. O relatório sai pronto, sem redigitar nada.'
            : 'Dá para gerar, mas o resultado vem reprovado — e o motivo vai no documento.'}
        </span>
      </div>

      {!podeAprovar && (
        <div style={S.impedimentos}>
          <div style={S.impedTit}>O que impede a aprovação</div>
          <ul style={S.impedLista}>
            {impedimentos.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      )}

      <Anexos anexos={anexos} aoAdicionar={aoAdicionar} aoAlterar={aoAlterar} aoRemover={aoRemover} />

      {gerado && <Documento rel={gerado} anexos={anexos} />}
    </div>
  );
}

/* ── Evidência ─────────────────────────────────────────────────────────────────────────────── */

function Anexos({
  anexos, aoAdicionar, aoAlterar, aoRemover,
}: {
  anexos: Anexo[];
  aoAdicionar: (novos: Anexo[]) => void;
  aoAlterar: (id: string, campo: 'legenda' | 'comentario', valor: string) => void;
  aoRemover: (id: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  async function escolher(lista: FileList | null) {
    if (!lista?.length) return;
    const novos = await Promise.all([...lista].map(async (f, i): Promise<Anexo> => ({
      id: `an-${Date.now()}-${i}`,
      tipo: f.type.startsWith('image/') ? 'foto' : 'arquivo',
      nome: f.name,
      url: f.type.startsWith('image/') ? await lerComoDataUrl(f) : null,
      legenda: '',
      comentario: '',
      etapa: null,
      data: new Date().toISOString().slice(0, 10),
      adicionadoPor: null,
    })));
    aoAdicionar(novos);
    if (input.current) input.current.value = '';
  }

  return (
    <div style={S.bloco}>
      <div style={S.blocoTopo}>
        <div style={S.blocoTit}>Evidência anexada</div>
        <button style={{ ...s.botao, padding: '6px 12px', fontSize: 13 }} onClick={() => input.current?.click()}>
          Adicionar foto ou arquivo
        </button>
        <input
          ref={input} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          style={{ display: 'none' }} onChange={(e) => void escolher(e.target.files)}
        />
      </div>

      {anexos.length === 0 ? (
        <div style={S.vazio}>
          Nenhuma evidência ainda. A foto do ensaio de aderência e o certificado do abrasivo entram aqui —
          a legenda sai impressa no relatório, o comentário fica só no registro interno.
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
                <label style={S.rotuloCampo}>Legenda — sai no relatório</label>
                <input
                  style={S.campoTexto} value={a.legenda} placeholder="Ex.: ensaio de aderência em X — X0Y0"
                  onChange={(e) => aoAlterar(a.id, 'legenda', e.target.value)}
                />
                <label style={S.rotuloCampo}>Comentário — fica no registro interno</label>
                <textarea
                  style={{ ...S.campoTexto, minHeight: 46, resize: 'vertical' }} value={a.comentario}
                  placeholder="Contexto, quem pediu, o que observar na imagem"
                  onChange={(e) => aoAlterar(a.id, 'comentario', e.target.value)}
                />
                <div style={S.anexoRodape}>
                  <span style={{ fontFamily: fonte.mono, fontSize: 11, color: c.suave }}>{dataBR(a.data)}</span>
                  <button style={S.remover} onClick={() => aoRemover(a.id)}>remover</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function lerComoDataUrl(f: File): Promise<string | null> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === 'string' ? r.result : null);
    r.onerror = () => resolve(null);
    r.readAsDataURL(f);
  });
}

/* ── O documento ───────────────────────────────────────────────────────────────────────────── */

const ORDINAL = ['1ª', '2ª', '3ª', '4ª'];

function Documento({ rel, anexos }: { rel: Relatorio; anexos: Anexo[] }) {
  const aprovado = rel.resultado === 'aprovado';
  const comFoto = anexos.filter((a) => a.tipo === 'foto');

  return (
    <div style={S.folha}>
      <div style={S.folhaTopo}>
        <div>
          <div style={S.folhaTitulo}>Relatório de Inspeção de Jateamento e Pintura</div>
          <div style={S.folhaSub}>{carimbo('FM-002')} · emitido pelo sistema a partir da OS {rel.osReferida}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: fonte.mono, fontSize: 15, fontWeight: 700, color: c.tinta }}>{rel.numero}</div>
          <div style={{ fontFamily: fonte.mono, fontSize: 12, color: c.suave }}>folha {rel.folha} · {dataBR(rel.dataEmissao)}</div>
        </div>
      </div>

      <div style={S.folhaIdent}>
        <Dado rot="Esquema" val={rel.esquema} mono />
        <Dado rot="Equipamento" val={rel.equipamento} />
        <Dado rot="Obra" val={rel.obra} />
      </div>

      <div style={S.secao}>Preparação da superfície</div>
      <div style={S.folhaIdent}>
        <Dado rot="Padrão de jateamento" val={rel.padraoJateamento} />
        <Dado rot="Grau de intemperismo" val={rel.grauIntemperismo} />
        <Dado rot="Data" val={dataBR(rel.dataJateamento)} mono />
        <Dado rot="Rugosidade" val={rel.rugosidade ? `${rel.rugosidade} µm` : null} mono />
        <Dado rot="Abrasivo" val={rel.abrasivo} />
        <Dado rot="Certificado" val={rel.abrasivoCertificado} mono />
      </div>

      <div style={S.secao}>Aplicação</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={s.tabela}>
          <thead>
            <tr>
              <th style={s.th}>Demão</th>
              <th style={s.th}>Tinta</th>
              <th style={s.th}>Lote A · B</th>
              <th style={s.th}>Ambiente</th>
              <th style={s.th}>EFS esp. · enc.</th>
              <th style={s.th}>Inspeção</th>
              <th style={s.th}>Aderência</th>
            </tr>
          </thead>
          <tbody>
            {rel.demaos.map((d, i) => (
              <tr key={d.ordem}>
                <td style={{ ...s.td, color: c.tinta, fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {ORDINAL[i] ?? `${d.ordem}ª`}
                  <div style={{ ...S.sub, fontFamily: fonte.mono }}>{dataBR(d.data)}</div>
                </td>
                <td style={s.td}>{d.tinta}<div style={S.sub}>{d.cor} · {d.fabricante}</div></td>
                <td style={{ ...s.td, ...s.mono, fontSize: 12 }}>
                  {d.loteA} <span style={{ color: c.suave }}>({d.validadeA})</span>
                  <div>{d.loteB} <span style={{ color: c.suave }}>({d.validadeB})</span></div>
                </td>
                <td style={{ ...s.td, ...s.mono, fontSize: 12, whiteSpace: 'nowrap' }}>
                  {d.tempAmbiente}°C · {d.umidadeRelativa}%
                  <div style={{ color: c.suave }}>substrato {d.tempSubstrato}°C</div>
                </td>
                <td style={{ ...s.td, ...s.mono }}>{d.espessuraEspecificada} · <strong>{d.espessuraEncontrada}</strong> µm</td>
                <td style={{ ...s.td, ...s.mono, whiteSpace: 'nowrap' }}>{dataBR(d.dataInspecao)}</td>
                <td style={s.td}>{d.aderencia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {comFoto.length > 0 && (
        <>
          <div style={S.secao}>Teste de aderência e evidência fotográfica</div>
          <div style={S.fotos}>
            {comFoto.map((a) => (
              <figure key={a.id} style={S.figura}>
                {a.url
                  ? <img src={a.url} alt={a.legenda || a.nome} style={S.fotoImg} />
                  : <div style={{ ...S.fotoImg, ...S.semImagem }}>sem pré-visualização</div>}
                <figcaption style={S.legenda}>{a.legenda || <em style={{ color: c.suave }}>sem legenda</em>}</figcaption>
              </figure>
            ))}
          </div>
        </>
      )}

      <div style={S.rodapeDoc}>
        <div style={{ fontFamily: fonte.mono, fontSize: 11.5, color: c.suave, lineHeight: 1.6 }}>
          Instrumentos: {rel.instrumentos.join(' · ') || '—'}
          <div>{rel.normas.join(' · ')}</div>
          {rel.ressalvas.map((r) => <div key={r}>{r}</div>)}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={pastilha(aprovado ? 'ok' : 'critico')}>{aprovado ? 'Aprovado' : 'Reprovado'}</span>
          <div style={S.assina}>Emitido por {rel.emitidoPor}</div>
          <div style={S.assina}>Verificado por {rel.verificadoPor}</div>
        </div>
      </div>
    </div>
  );
}

function Dado({ rot, val, mono }: { rot: string; val: string | null; mono?: boolean }) {
  return (
    <div>
      <div style={S.dadoRot}>{rot}</div>
      <div style={{ fontSize: 13.5, color: val ? c.tinta : c.suave, fontFamily: mono && val ? fonte.mono : fonte.texto, marginTop: 3 }}>
        {val ?? '—'}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  faixa: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: '10px 18px', background: c.superficie2, borderBottom: `1px solid ${c.linhaForte}`,
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: c.tinta2,
  },
  acao: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', flexWrap: 'wrap' },
  explica: { fontSize: 13, color: c.tinta2, flex: 1, minWidth: 220, lineHeight: 1.5 },
  impedimentos: {
    margin: '0 18px 16px', padding: '12px 16px', borderRadius: 3,
    background: c.criticoFraco, border: `1px solid ${c.critico}`,
  },
  impedTit: {
    fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
    color: c.critico, marginBottom: 7,
  },
  impedLista: { margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: c.tinta2 },
  bloco: { padding: '14px 18px 18px', borderTop: `1px solid ${c.linha}` },
  blocoTopo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  blocoTit: {
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
    color: c.suave, flex: 1,
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
  anexoRodape: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  remover: {
    border: 'none', background: 'none', color: c.critico, cursor: 'pointer',
    fontFamily: fonte.texto, fontSize: 12, padding: 0,
  },
  folha: { borderTop: `1px solid ${c.linhaForte}`, background: c.superficie, padding: '20px 18px' },
  folhaTopo: { display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 },
  folhaTitulo: { fontSize: 16, fontWeight: 700, color: c.tinta, letterSpacing: '-.01em' },
  folhaSub: { fontFamily: fonte.mono, fontSize: 11.5, color: c.suave, marginTop: 3 },
  folhaIdent: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14,
    padding: '12px 0', borderTop: `1px solid ${c.linha}`,
  },
  dadoRot: { fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: c.suave, fontWeight: 600 },
  secao: {
    marginTop: 14, marginBottom: 2, fontSize: 11, fontWeight: 700, letterSpacing: '.1em',
    textTransform: 'uppercase', color: c.acento,
  },
  sub: { fontSize: 11.5, color: c.suave, marginTop: 2 },
  fotos: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginTop: 10 },
  figura: { margin: 0 },
  fotoImg: {
    width: '100%', height: 150, objectFit: 'cover', borderRadius: 3, border: `1px solid ${c.linhaForte}`,
    display: 'block', background: c.superficie2,
  },
  legenda: { fontSize: 12, color: c.tinta2, marginTop: 6, lineHeight: 1.5 },
  rodapeDoc: {
    display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
    marginTop: 18, paddingTop: 14, borderTop: `1px solid ${c.linhaForte}`,
  },
  assina: { fontSize: 12, color: c.tinta2, marginTop: 6 },
};
