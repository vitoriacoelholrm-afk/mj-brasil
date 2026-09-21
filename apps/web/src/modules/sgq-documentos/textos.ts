// O texto dos documentos, entre a tela e o banco.
//
// A lista mestra sempre soube que um documento EXISTE. Isto é o documento em si — o texto que a
// consultoria escreve no modelo e que o próximo cliente recebe pronto.
//
// O `perfil` viaja em toda chamada porque os textos do modelo e os de um cliente convivem no mesmo
// banco enquanto a entrada resolver uma empresa só. Separá-los na chave desde já é o que faz a
// troca de empresa, quando vier, não ter de mexer em conteúdo nenhum.
import { trpc } from '@/lib/trpc';

const api = () => (trpc as any).documentos;

export interface TextoDeDocumento {
  codigo: string;
  texto: string;
  atualizadoPorNome: string | null;
  atualizadoEm: string | null;
}

interface LinhaDoBanco {
  codigo: string; texto: string;
  atualizado_por_nome: string | null; updated_at: string | null;
}

/** Os textos já escritos deste perfil, por código. Documento sem texto não vem — a tela mostra
 *  o vazio dela, que é diferente de "texto em branco". */
export async function listarTextos(perfil: string): Promise<Map<string, TextoDeDocumento>> {
  const r = await api().listarTextos.query({ perfil });
  const linhas = (r?.rows ?? []) as LinhaDoBanco[];
  return new Map(linhas.map((l) => [l.codigo, {
    codigo: l.codigo,
    texto: l.texto ?? '',
    atualizadoPorNome: l.atualizado_por_nome,
    atualizadoEm: l.updated_at,
  }]));
}

export async function salvarTexto(
  perfil: string, codigo: string, texto: string, quem: string | null,
): Promise<void> {
  await api().salvarTexto.mutate({ perfil, codigo, texto, atualizadoPorNome: quem });
}
