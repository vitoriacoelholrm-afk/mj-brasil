// ANEXO — a foto e o arquivo que viram evidência, com o que se escreve sobre eles.
//
// Mora na plataforma porque não é assunto de setor nenhum: a foto do ensaio de aderência, a
// foto do caminhão no portão e o certificado do fornecedor têm a mesma forma. O que muda é
// quem anexa e em que registro.
//
// Dois campos de texto, e a diferença entre eles importa:
//
//   · LEGENDA — a frase curta que sai impressa junto com a imagem, no documento que vai ao
//     cliente. Foto sem legenda é foto de alguma coisa; ninguém sabe do quê, seis meses depois.
//   · COMENTÁRIO — o que fica no registro interno. Contexto, quem pediu, o que observar.
//
// Juntá-los num campo só obrigaria a escolher entre escrever para o cliente ou para a casa.

export interface Anexo {
  id: string;
  tipo: 'foto' | 'arquivo';
  nome: string;
  /** No protótipo, o data URL que o navegador devolve ao escolher o arquivo. Quando entrar
   *  armazenamento de verdade, vira a chave do objeto e o resto desta interface não muda. */
  url: string | null;
  /** A frase curta que aparece embaixo da imagem no documento. */
  legenda: string;
  /** Observação mais longa — não sai no documento, fica no registro interno. */
  comentario: string;
  /** A que etapa do processo o anexo pertence, quando o registro tem etapas. */
  etapa?: string | null;
  data: string | null;
  adicionadoPor: string | null;
}

/** Lê o arquivo escolhido como data URL. Devolve null quando não dá — arquivo grande demais,
 *  permissão negada — em vez de estourar: perder a miniatura é melhor que perder o registro. */
export function lerComoDataUrl(f: File): Promise<string | null> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === 'string' ? r.result : null);
    r.onerror = () => resolve(null);
    r.readAsDataURL(f);
  });
}

/** A data de hoje pelo relógio local. `toISOString()` daria o dia seguinte depois das 21h daqui. */
function dataDeHoje(): string {
  const d = new Date();
  const dd = (n: number) => String(n).padStart(2, '0');
  return [d.getFullYear(), dd(d.getMonth() + 1), dd(d.getDate())].join('-');
}

/** Monta o anexo a partir do arquivo escolhido. `porQuem` fica registrado porque evidência sem
 *  autor é evidência de ninguém. */
export async function anexoDeArquivo(f: File, i: number, porQuem: string | null): Promise<Anexo> {
  const ehImagem = f.type.startsWith('image/');
  return {
    id: `an-${Date.now()}-${i}`,
    tipo: ehImagem ? 'foto' : 'arquivo',
    nome: f.name,
    // Lê o conteúdo de TUDO, e não só de imagem. Antes o certificado em PDF entrava como nome sem
    // arquivo nenhum: aparecia anexado na tela e não havia o que gravar. Quem decide mostrar
    // miniatura é o `tipo`, não a presença do conteúdo.
    url: await lerComoDataUrl(f),
    legenda: '',
    comentario: '',
    etapa: null,
    data: dataDeHoje(),
    adicionadoPor: porQuem,
  };
}

export const quantasFotos = (anexos: Anexo[]) => anexos.filter((a) => a.tipo === 'foto').length;
