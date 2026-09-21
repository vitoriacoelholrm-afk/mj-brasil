// O ARQUIVO dos documentos, entre a tela e o banco.
//
// A lista mestra sabe que o PG-004 existe. `textos.ts` traz o que se escreve pela tela. Isto traz
// o terceiro estado, que é o mais comum num cliente: o documento existe como ARQUIVO — o .docx
// que alguém editou, o .pdf assinado — e até agora o sistema só apontava para a pasta.
//
// O `perfil` viaja em toda chamada pela mesma razão de `textos.ts`: o acervo do modelo e o de um
// cliente convivem no mesmo banco enquanto a entrada resolver uma empresa só.
import { trpc } from '@/lib/trpc';

const api = () => (trpc as any).documentos;

export interface ArquivoDeDocumento {
  id: string;
  codigo: string;
  nome: string;
  mime: string | null;
  tamanhoBytes: number | null;
  /** A revisão que ESTE arquivo contém. Vazio quando quem anexou não disse. */
  revisao: string;
  /** Por que ele está aqui: "assinado", "editável", "digitalizado da pasta física". */
  observacao: string;
  adicionadoPorNome: string | null;
  criadoEm: string | null;
}

interface LinhaDoBanco {
  id: string; codigo: string; nome: string; mime: string | null;
  tamanho_bytes: number | null; revisao: string | null; observacao: string | null;
  adicionado_por_nome: string | null; created_at: string | null;
}

/** Os arquivos deste perfil, agrupados PELO CÓDIGO do documento — que é como a tela pergunta:
 *  ela desenha a lista de documentos da cláusula e quer, de cada um, o que há. */
export async function listarArquivos(perfil: string): Promise<Map<string, ArquivoDeDocumento[]>> {
  const r = await api().listarArquivos.query({ perfil });
  const linhas = (r?.rows ?? []) as LinhaDoBanco[];
  const mapa = new Map<string, ArquivoDeDocumento[]>();
  for (const l of linhas) {
    const a: ArquivoDeDocumento = {
      id: l.id, codigo: l.codigo, nome: l.nome, mime: l.mime,
      tamanhoBytes: l.tamanho_bytes, revisao: l.revisao ?? '', observacao: l.observacao ?? '',
      adicionadoPorNome: l.adicionado_por_nome, criadoEm: l.created_at,
    };
    const atual = mapa.get(l.codigo);
    if (atual) atual.push(a); else mapa.set(l.codigo, [a]);
  }
  return mapa;
}

/** Só a parte base64 de um data URL — o prefixo `data:...;base64,` não é conteúdo. */
const semPrefixo = (dataUrl: string) => dataUrl.slice(dataUrl.indexOf(',') + 1);

export async function anexarArquivo(
  perfil: string, codigo: string, dataUrl: string,
  meta: { nome: string; mime?: string | null; revisao?: string; observacao?: string; quem?: string | null },
): Promise<void> {
  await api().anexarArquivo.mutate({
    perfil, codigo,
    nome: meta.nome, mime: meta.mime ?? null,
    revisao: meta.revisao ?? '', observacao: meta.observacao ?? '',
    conteudoBase64: semPrefixo(dataUrl),
    adicionadoPorNome: meta.quem ?? null,
  });
}

export async function removerArquivo(arquivoId: string): Promise<void> {
  await api().removerArquivo.mutate({ arquivoId });
}

/** Baixa o arquivo pelo navegador. Pede os bytes só agora, e é por isso que a listagem não os
 *  traz: a tela da cláusula desenha nomes, não conteúdo. */
export async function baixarArquivo(arquivoId: string): Promise<void> {
  const r = await api().lerArquivo.query({ arquivoId });
  if (!r?.conteudoBase64) throw new Error('O arquivo não está guardado no banco.');
  const bin = atob(r.conteudoBase64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: r.mime ?? 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = r.nome ?? 'documento';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Soltar na hora cancelaria o download em alguns navegadores; um tique depois já baixou.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** O tamanho como se lê. Byte cru numa lista de documentos não diz nada a ninguém. */
export function tamanhoLegivel(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}
