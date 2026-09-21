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
  /** Onde, DENTRO do documento. No manual é a cláusula da norma; vazio é o documento inteiro. */
  secao: string;
  texto: string;
  atualizadoPorNome: string | null;
  atualizadoEm: string | null;
}

interface LinhaDoBanco {
  codigo: string; secao: string | null; texto: string;
  atualizado_por_nome: string | null; updated_at: string | null;
}

/** A chave de um texto: o documento inteiro é o código puro, um trecho é `codigo§secao`.
 *
 *  O manual é o único documento que se lê por PEDAÇO — ninguém o abre para ler do começo, abre
 *  para ver o que a empresa diz sobre a 8.5.5. Por isso o texto dele tem endereço, e o endereço
 *  entra na chave em vez de virar 37 códigos inventados na lista mestra. */
export const chaveDoTexto = (codigo: string, secao?: string | null) =>
  secao ? `${codigo}§${secao}` : codigo;

/** Os textos já escritos deste perfil, pela chave acima. Documento sem texto não vem — a tela
 *  mostra o vazio dela, que é diferente de "texto em branco". */
export async function listarTextos(perfil: string): Promise<Map<string, TextoDeDocumento>> {
  const r = await api().listarTextos.query({ perfil });
  const linhas = (r?.rows ?? []) as LinhaDoBanco[];
  return new Map(linhas.map((l) => [chaveDoTexto(l.codigo, l.secao), {
    codigo: l.codigo,
    secao: l.secao ?? '',
    texto: l.texto ?? '',
    atualizadoPorNome: l.atualizado_por_nome,
    atualizadoEm: l.updated_at,
  }]));
}

export async function salvarTexto(
  perfil: string, codigo: string, texto: string, quem: string | null, secao?: string,
): Promise<void> {
  await api().salvarTexto.mutate({
    perfil, codigo, secao: secao ?? '', texto, atualizadoPorNome: quem,
  });
}
