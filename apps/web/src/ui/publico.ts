// O ENDEREÇO DE UM ARQUIVO DA PASTA `public/`.
//
// Parece bobagem e não é. O caminho escrito à mão — `/marca/logo.png` — é absoluto a partir da
// RAIZ DO DOMÍNIO. Funciona enquanto o app mora na raiz, que é o caso do `vite dev` e de um
// domínio próprio, e quebra no instante em que ele passa a morar numa subpasta: publicado em
// `/mj-brasil/`, o navegador vai procurar em `dominio.com/marca/logo.png` e não acha.
//
// O Vite reescreve o `base` no HTML e nos imports que ele enxerga. Não reescreve texto dentro de
// um componente, porque não tem como saber que aquela string é um caminho.
//
// `import.meta.env.BASE_URL` é o valor real do build — '/' no desenvolvimento, '/mj-brasil/' no
// GitHub Pages — e sempre termina em barra. Por isso o caminho entra SEM barra na frente.
//
// Há um teste que falha se alguém voltar a escrever '/marca/...' direto numa tela.

/** O endereço servível de um arquivo de `public/`. Ex.: `publico('marca/logo.png')`. */
export function publico(caminho: string): string {
  const base = import.meta.env?.BASE_URL ?? '/';
  return `${base}${caminho.replace(/^\/+/, '')}`;
}
