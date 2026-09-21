// A SEPARAÇÃO DAS DUAS PALETAS.
//
// A regra: cor de MARCA vive na casca — a coluna, a tela de entrada, a régua. Cor de ESTADO vive
// no conteúdo, e ali cor é significado: verde é conforme, amarelo vence em breve, vermelho é não
// conformidade.
//
// Isto não é gosto. Numa tela em que quase nada tem cor, a pastilha vermelha é a primeira coisa
// que o olho acha; numa tela colorida de ponta a ponta, ela é mais uma. O dia em que uma tela
// pintar um cartão de turquesa "porque é a cor da marca", a vermelha perde metade da força — e
// ninguém vai notar, porque nada quebra. Por isso a trava é um teste.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { c, marca } from './estilo';
import { MODULOS, chaveRaiz } from '@/modules';

const SRC = join(__dirname, '..');

/** As pastas dos módulos que existem de verdade — os que MODULOS lista. */
function pastasInstaladas(): string[] {
  return [...new Set(MODULOS.map(chaveRaiz))].map((chave) => join(SRC, 'modules', chave));
}

/** Percorre a pasta e as de dentro. Testes ficam de fora: teste pode citar o que quiser. */
function arquivosDe(dir: string, achados: string[] = []): string[] {
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) arquivosDe(caminho, achados);
    else if (/\.tsx?$/.test(entrada.name) && !/\.test\.tsx?$/.test(entrada.name)) achados.push(caminho);
  }
  return achados;
}

/** O que o arquivo importa de '@/ui/estilo' — ou de './estilo', dentro da própria pasta ui. */
function importaDeEstilo(caminho: string): string[] {
  const texto = readFileSync(caminho, 'utf8');
  const re = /import\s*\{([^}]*)\}\s*from\s*'(?:@\/ui\/estilo|\.\/estilo)'/g;
  const nomes: string[] = [];
  for (const achado of texto.matchAll(re)) {
    for (const parte of achado[1].split(',')) {
      const nome = parte.trim().split(/\s+as\s+/)[0].trim();
      if (nome) nomes.push(nome);
    }
  }
  return nomes;
}

const curto = (caminho: string) => caminho.split(/[\\/]/).slice(-2).join('/');

describe('a cor da marca não entra no conteúdo', () => {
  const DA_CASCA = ['marca', 'reguaDaMarca'];

  it('nenhum módulo importa a paleta da marca', () => {
    const vazamentos = arquivosDe(join(SRC, 'modules'))
      .flatMap((f) => importaDeEstilo(f).filter((n) => DA_CASCA.includes(n)).map((n) => `${curto(f)} usa "${n}"`));
    expect(vazamentos).toEqual([]);
  });

  it('nem a plataforma — ela não desenha, e cor nenhuma é regra de negócio', () => {
    const vazamentos = arquivosDe(join(SRC, 'plataforma'))
      .flatMap((f) => importaDeEstilo(f).filter((n) => DA_CASCA.includes(n)).map((n) => `${curto(f)} usa "${n}"`));
    expect(vazamentos).toEqual([]);
  });

  it('e nenhuma tela escreve cor na mão — quem quiser cor pede ao token', () => {
    // Um `#hex` solto numa tela é uma cor que a paleta não conhece e que ninguém vai achar no dia
    // de trocar a marca. Branco e preto passam: não são cor de marca nem veredito.
    //
    // A varredura é pelos módulos que MODULOS realmente lista, e não pela pasta inteira. A pasta
    // ainda guarda módulos do catálogo que nunca foram instalados aqui — cobrar deles seria
    // cobrar de código que não desenha nada. E a conta se corrige sozinha: instalar um deles o
    // põe sob a regra no mesmo instante.
    const permitido = /^#(fff|ffffff|000|000000)$/i;
    const soltas = pastasInstaladas()
      .flatMap((dir) => arquivosDe(dir))
      .flatMap((f) => (readFileSync(f, 'utf8').match(/#[0-9a-fA-F]{3,8}\b/g) ?? [])
        .filter((h) => !permitido.test(h))
        .map((h) => `${curto(f)} escreve ${h}`));
    expect(soltas).toEqual([]);
  });
});

describe('o semáforo continua legível', () => {
  it('o acento deixou de ser parente do alerta', () => {
    // Eram #8A6C00 e #8A5F0E: dois ocres a um passo um do outro. Botão que se parece com aviso
    // ensina a ignorar os dois, e foi o que mandou o ocre embora.
    expect(c.acento).not.toBe(c.alerta);
    expect(matiz(c.acento)).not.toBeCloseTo(matiz(c.alerta), 0);
  });

  it('e nenhum veredito usa uma cor da marca', () => {
    const vereditos = [c.ok, c.alerta, c.critico, c.okFraco, c.alertaFraco, c.criticoFraco];
    const daMarca = [marca.azulProfundo, marca.azul, marca.turquesa, marca.verde, marca.amarelo];
    for (const v of vereditos) expect(daMarca).not.toContain(v);
  });
});

/** Matiz em graus, para comparar duas cores sem depender do brilho. */
function matiz(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
