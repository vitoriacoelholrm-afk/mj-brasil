// O ENDEREÇO DOS ARQUIVOS DE `public/`.
//
// Este teste existe por um erro que só aparece DEPOIS de publicado, e é o pior tipo: tudo
// funciona na máquina de quem escreveu.
//
// A logo era referida como `/marca/BraMex_logo_exata.png`. Absoluto a partir da raiz do domínio,
// e por isso certo no `vite dev`, onde a raiz é `/`. Publicado numa subpasta — `/mj-brasil/` no
// GitHub Pages — o navegador foi procurar em `github.io/marca/...`, que não existe, e a tela de
// entrada abriu com o quadro de imagem quebrada no lugar da assinatura.
//
// O Vite reescreve o `base` no HTML e nos imports que ele enxerga. Não reescreve uma string
// dentro de um componente, porque não tem como saber que aquilo é um caminho.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { publico } from './publico';

const RAIZ = join(__dirname, '..');

/** As telas — todo .ts/.tsx do app, menos os testes e menos o PRÓPRIO ajudante, cujo comentário
 *  precisa mostrar o caminho errado para explicar por que ele existe. */
function arquivosDe(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivosDe(caminho);
    if (nome === 'publico.ts' || /\.test\.tsx?$/.test(nome)) return [];
    return /\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

describe('o caminho respeita a base do build', () => {
  it('monta o endereço a partir da BASE_URL, sem barra dobrada', () => {
    // BASE_URL sempre termina em barra. Por isso o caminho entra SEM barra na frente — e a função
    // tira a que vier por engano, que é o erro de digitação natural de quem está acostumado com
    // o caminho absoluto.
    expect(publico('marca/logo.png')).toBe('/marca/logo.png');
    expect(publico('/marca/logo.png')).toBe('/marca/logo.png');
    expect(publico('//marca/logo.png')).toBe('/marca/logo.png');
  });
});

describe('ninguém escreve o caminho à mão', () => {
  it('nenhuma tela referencia /marca/ direto', () => {
    // Se voltar a aparecer, a imagem some outra vez — e some só no site publicado, depois de
    // alguém já ter mandado o link.
    const culpados: string[] = [];
    for (const arquivo of arquivosDe(RAIZ)) {
      const texto = readFileSync(arquivo, 'utf8');
      // `src="/marca/…"` ou `'/marca/…'` — o caminho absoluto, em qualquer aspas.
      if (/["'`]\/marca\//.test(texto)) culpados.push(arquivo.split(/[\\/]/).slice(-2).join('/'));
    }
    expect(culpados).toEqual([]);
  });

  it('e as imagens que as telas pedem existem mesmo em public/', () => {
    // O outro lado do mesmo erro: o caminho certo para um arquivo que não foi gerado dá o mesmo
    // quadro quebrado, e é ainda mais fácil de não notar.
    const emPublic = new Set(readdirSync(join(RAIZ, '..', 'public', 'marca')));
    const pedidos = new Set<string>();
    for (const arquivo of arquivosDe(RAIZ)) {
      for (const m of readFileSync(arquivo, 'utf8').matchAll(/publico\(\s*['"]marca\/([^'"]+)['"]/g)) {
        pedidos.add(m[1]);
      }
    }
    expect(pedidos.size).toBeGreaterThan(0);   // guarda contra o regex parar de casar
    expect([...pedidos].filter((f) => !emPublic.has(f))).toEqual([]);
  });
});
