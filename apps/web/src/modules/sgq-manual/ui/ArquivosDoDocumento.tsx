// O ARQUIVO do documento, dentro da cláusula.
//
// A tela já dizia que o PG-004 responde pela 9.2. Agora ela ABRE o PG-004 — que é a pergunta que
// o auditor faz de verdade: ele não pede o nome do procedimento, pede o procedimento.
//
// Fica AQUI, e não numa tela de acervo à parte, porque é aqui que alguém se lembra de que o
// arquivo falta: olhando a cláusula, vendo o documento listado e não tendo o que abrir.
import { useRef, useState } from 'react';
import { lerComoDataUrl } from '@/plataforma/anexos';
import {
  anexarArquivo, baixarArquivo, removerArquivo, tamanhoLegivel,
  type ArquivoDeDocumento,
} from '@/modules/sgq-documentos/arquivos';
import { c, dataBR, fonte, s } from '@/ui/estilo';

/** 8 MB — o mesmo teto da capability. Barrar antes de subir evita a ida ao servidor para ouvir
 *  não, e é a diferença entre um aviso imediato e trinta segundos de espera. */
const LIMITE_BYTES = 8 * 1024 * 1024;

export function ArquivosDoDocumento({
  perfil, codigo, revisaoNaLista, arquivos, podeAnexar, quem, aoMudar,
}: {
  perfil: string;
  codigo: string;
  /** A revisão que a lista mestra declara. Serve de sugestão quando quem anexa não diz qual é.
   *  Nula em documento que está em uso sem revisão registrada — e há sete deles na empresa 01. */
  revisaoNaLista?: string | null;
  arquivos: ArquivoDeDocumento[];
  podeAnexar: boolean;
  quem: string | null;
  aoMudar: () => void;
}) {
  const campo = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(lista: FileList | null) {
    const f = lista?.[0];
    if (!f) return;
    setErro(null);
    if (f.size > LIMITE_BYTES) {
      setErro(`${f.name} tem ${tamanhoLegivel(f.size)} — o limite é 8 MB.`);
      return;
    }
    setOcupado(true);
    try {
      const dataUrl = await lerComoDataUrl(f);
      if (!dataUrl) throw new Error('não foi possível ler o arquivo');
      await anexarArquivo(perfil, codigo, dataUrl, {
        nome: f.name, mime: f.type || null, revisao: revisaoNaLista ?? '', quem,
      });
      aoMudar();
    } catch (e) {
      setErro((e as Error)?.message ?? 'não foi possível anexar');
    } finally {
      setOcupado(false);
      if (campo.current) campo.current.value = '';   // permite reescolher o MESMO arquivo
    }
  }

  async function abrir(a: ArquivoDeDocumento) {
    setErro(null);
    try { await baixarArquivo(a.id); }
    catch (e) { setErro((e as Error)?.message ?? 'não foi possível abrir'); }
  }

  async function tirar(a: ArquivoDeDocumento) {
    setErro(null);
    setOcupado(true);
    try { await removerArquivo(a.id); aoMudar(); }
    catch (e) { setErro((e as Error)?.message ?? 'não foi possível remover'); }
    finally { setOcupado(false); }
  }

  if (!arquivos.length && !podeAnexar) return null;

  return (
    <div style={S.caixa}>
      {arquivos.map((a) => (
        <div key={a.id} style={S.linha}>
          <button type="button" onClick={() => abrir(a)} style={S.nome} title="Abrir o arquivo">
            {a.nome}
          </button>
          <span style={S.ficha}>
            {[
              a.revisao ? `rev. ${a.revisao}` : null,
              tamanhoLegivel(a.tamanhoBytes) || null,
              a.criadoEm ? dataBR(a.criadoEm.slice(0, 10)) : null,
              a.adicionadoPorNome,
            ].filter(Boolean).join(' · ')}
          </span>
          {podeAnexar && (
            <button type="button" onClick={() => tirar(a)} disabled={ocupado} style={S.tirar}
              title="Tirar este arquivo do documento">
              remover
            </button>
          )}
        </div>
      ))}

      {podeAnexar && (
        <div style={S.rodape}>
          <input
            ref={campo} type="file" style={{ display: 'none' }}
            onChange={(e) => escolher(e.target.files)}
          />
          <button type="button" onClick={() => campo.current?.click()} disabled={ocupado} style={S.anexar}>
            {ocupado ? 'enviando…' : arquivos.length ? '+ outro arquivo' : '+ anexar o arquivo'}
          </button>
          {!arquivos.length && (
            <span style={S.dica}>
              O documento está na lista mestra, mas o arquivo dele não está aqui.
            </span>
          )}
        </div>
      )}

      {erro && <div style={{ ...S.erro, ...s.prosa }}>{erro}</div>}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  caixa: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 },
  linha: { display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  nome: {
    border: 'none', background: 'none', padding: 0, cursor: 'pointer',
    fontFamily: fonte.texto, fontSize: 13, color: c.acentoMarca, textDecoration: 'underline',
    textAlign: 'left',
  },
  ficha: { fontSize: 11.5, color: c.suave },
  tirar: {
    border: 'none', background: 'none', padding: 0, cursor: 'pointer',
    fontFamily: fonte.texto, fontSize: 11.5, color: c.suave, textDecoration: 'underline',
  },
  rodape: { display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginTop: 2 },
  anexar: {
    border: `1px solid ${c.linhaForte}`, background: c.superficie2, borderRadius: 3,
    padding: '3px 9px', cursor: 'pointer',
    fontFamily: fonte.texto, fontSize: 12, color: c.tinta2,
  },
  dica: { fontSize: 11.5, color: c.suave },
  erro: { fontSize: 12, color: c.critico, marginTop: 2 },
};
