// A conversa da tela de registros com o banco.
//
// De um lado o `Registro` que a tela usa (o mesmo que `plataforma/formularios.ts` declara), do
// outro as linhas do banco. A tradução mora aqui, num arquivo só, porque foi onde ela ficou
// pequena: a tela não sabe de linha e a capability não sabe de tela.
//
// A foto atravessa em base64. Ela viaja em dois momentos diferentes, e isso é de propósito:
// ao GRAVAR vai junto com o registro; ao LISTAR não vem — vem a ficha (nome, legenda, tamanho) e
// os bytes só quando alguém abre aquele registro. Uma lista de portão com duzentas passagens e
// uma foto em cada não abre no celular se carregar tudo.
import { trpc } from '@/lib/trpc';
import type { Anexo } from '@/plataforma/anexos';
import type { PapelDeFormulario } from '@/plataforma/empresa';
import type { Registro, Valores } from '@/plataforma/formularios';

interface AnexoDoBanco {
  id: string; tipo: string; nome: string; mime: string | null;
  tamanhoBytes: number | null; legenda: string | null; comentario: string | null;
  etapa: string | null; adicionadoPorNome: string | null; criadoEm: string | null;
}
interface LinhaDoBanco {
  id: string; papel: string; valores: Valores | null;
  registrado_por_nome: string | null; created_at: string; anexos: AnexoDoBanco[] | null;
}

const api = () => (trpc as any).registros;

/** A data pelo relógio de quem olha. `toISOString()` daria o dia seguinte depois das 21h daqui —
 *  um registro feito à noite apareceria com a data de amanhã. */
function dataLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  const dd = (n: number) => String(n).padStart(2, '0');
  return [d.getFullYear(), dd(d.getMonth() + 1), dd(d.getDate())].join('-');
}

/** Separa o "data:image/jpeg;base64,xxxx" em tipo e conteúdo, sem regex. */
function partesDoDataUrl(url: string): { mime: string | null; base64: string } | null {
  const marca = ';base64,';
  const corte = url.indexOf(marca);
  if (!url.startsWith('data:') || corte < 0) return null;
  return {
    mime: url.slice('data:'.length, corte) || null,
    base64: url.slice(corte + marca.length),
  };
}

function anexoDaLinha(a: AnexoDoBanco): Anexo {
  return {
    id: a.id,
    tipo: a.tipo === 'arquivo' ? 'arquivo' : 'foto',
    nome: a.nome,
    // Os bytes não vêm na lista. Quem abre o registro chama `conteudoDoAnexo`.
    url: null,
    legenda: a.legenda ?? '',
    comentario: a.comentario ?? '',
    etapa: a.etapa,
    data: a.criadoEm ? dataLocal(a.criadoEm) : null,
    adicionadoPor: a.adicionadoPorNome,
  };
}

function registroDaLinha(r: LinhaDoBanco): Registro {
  return {
    id: r.id,
    papel: r.papel as PapelDeFormulario,
    valores: r.valores ?? {},
    anexos: (r.anexos ?? []).map(anexoDaLinha),
    criadoEm: dataLocal(r.created_at),
    criadoPor: r.registrado_por_nome,
  };
}

export async function listarRegistros(papel: PapelDeFormulario): Promise<Registro[]> {
  const r = await api().listar.query({ papel });
  return ((r?.rows ?? []) as LinhaDoBanco[]).map(registroDaLinha);
}

export async function criarRegistro(
  papel: PapelDeFormulario, valores: Valores, anexos: Anexo[], quem: string | null,
): Promise<void> {
  await api().criar.mutate({
    papel,
    valores,
    registradoPorNome: quem,
    anexos: anexos.flatMap((a) => {
      const partes = a.url ? partesDoDataUrl(a.url) : null;
      // Anexo sem conteúdo não é anexo — o banco recusa, e mandar assim só trocaria a mensagem
      // clara por um erro de restrição.
      if (!partes) return [];
      return [{
        tipo: a.tipo,
        nome: a.nome,
        mime: partes.mime,
        legenda: a.legenda,
        comentario: a.comentario,
        etapa: a.etapa ?? null,
        conteudoBase64: partes.base64,
      }];
    }),
  });
}

/** Os bytes de um anexo, já como data URL para a tela usar direto no `<img>`. */
export async function conteudoDoAnexo(anexoId: string): Promise<string | null> {
  const r = await api().lerAnexo.query({ anexoId });
  if (!r?.conteudoBase64) return null;
  return `data:${r.mime ?? 'application/octet-stream'};base64,${r.conteudoBase64}`;
}
