// Paleta e primitivos visuais do app.
//
// DUAS PALETAS, E ELAS NÃO SE CRUZAM:
//
//   `marca` é a identidade — azul profundo, azul, turquesa, verde. Vive na CASCA: a coluna da
//   esquerda, a tela de entrada, a régua que fecha o cabeçalho. Ali a cor não significa nada
//   além de "este sistema é este sistema".
//
//   `c` é a interface — neutros, e o semáforo. Vive no CONTEÚDO, e ali cor É significado: verde
//   é conforme, amarelo é vence em breve, vermelho é não conformidade. Num painel em que quase
//   nada tem cor, a pastilha vermelha é a primeira coisa que o olho acha; num painel colorido de
//   ponta a ponta, ela é mais uma.
//
// Foi por isso que o ocre saiu do acento: ele era quase o mesmo tom do alerta, e botão parecido
// com aviso ensina a ignorar os dois. O acento agora é o azul da marca, que nenhum veredito usa.
export const c = {
  fundo: '#F4F7FA',
  superficie: '#FFFFFF',
  superficie2: '#F5F8FB',
  tinta: '#0F1A26',
  tinta2: '#33414F',
  suave: '#6B7280',
  linha: '#E2E8F0',
  linhaForte: '#CBD5E1',
  acento: '#0B2F5A',
  acentoMarca: '#1468D5',
  acentoFraco: '#E8EFFB',
  ok: '#046B37',
  okFraco: '#E4F5EC',
  alerta: '#7A5B00',
  alertaFraco: '#FDF4DA',
  critico: '#A32B22',
  criticoFraco: '#FBE9E7',
};

/** A identidade. Só a casca a usa — coluna, entrada, régua. O conteúdo usa `c`.
 *
 *  O vermelho não está aqui de propósito: a marca não tem um, e um sistema de qualidade precisa
 *  de um. Ele vive em `c.critico`, que é semáforo e não identidade. */
export const marca = {
  /** Os valores são os DOS ARQUIVOS da logo, e não os da prancha de identidade — as duas
   *  divergiam em três cores. O arquivo é o que aparece na tela: se a coluna e o SVG discordarem,
   *  a emenda aparece justamente onde os dois se encostam. */
  azulProfundo: '#0B2F5A',
  azul: '#1468D5',
  turquesa: '#00BFAE',
  verde: '#00A651',
  amarelo: '#F4C430',
  cinza: '#6B7280',
  /** Sobre o azul profundo da coluna: item, item ativo, e o rótulo de seção. */
  emFundoEscuro: '#C7D8EC',
  emFundoEscuroForte: '#FFFFFF',
  emFundoEscuroFraco: '#7796B8',
};

/** A régua de três cores que fecha a casca. Não entra no conteúdo: lá, listra colorida seria cor
 *  sem veredito — exatamente o que a separação das duas paletas existe para evitar. */
export const reguaDaMarca: React.CSSProperties = {
  height: 3,
  flexShrink: 0,
  background: `linear-gradient(90deg,
    ${marca.verde} 0 33.34%, ${marca.azul} 33.34% 66.67%, ${marca.turquesa} 66.67%)`,
};

export const fonte = {
  texto: '"Segoe UI", system-ui, -apple-system, sans-serif',
  mono: '"Cascadia Mono", Consolas, ui-monospace, monospace',
};

export const s: Record<string, React.CSSProperties> = {
  cartao: {
    background: c.superficie,
    border: `1px solid ${c.linhaForte}`,
    borderRadius: 3,
  },
  tabela: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    textAlign: 'left',
    padding: '10px 14px',
    fontSize: 11,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    color: c.suave,
    fontWeight: 600,
    background: c.superficie2,
    borderBottom: `1px solid ${c.linhaForte}`,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '11px 14px',
    borderBottom: `1px solid ${c.linha}`,
    color: c.tinta2,
    verticalAlign: 'top',
  },
  mono: { fontFamily: fonte.mono, fontSize: 12.5, color: c.tinta },
  botao: {
    fontFamily: fonte.texto,
    fontSize: 14,
    fontWeight: 600,
    padding: '9px 16px',
    borderRadius: 3,
    border: `1px solid ${c.linhaForte}`,
    background: c.superficie,
    color: c.tinta,
    cursor: 'pointer',
  },
  botaoPrimario: {
    fontFamily: fonte.texto,
    fontSize: 14,
    fontWeight: 600,
    padding: '9px 16px',
    borderRadius: 3,
    border: `1px solid ${c.acentoMarca}`,
    background: c.acentoMarca,
    // Branco sobre o azul, e não preto: com o ocre antigo o texto escuro é que contrastava.
    color: '#FFFFFF',
    cursor: 'pointer',
  },
  campo: {
    fontFamily: fonte.texto,
    fontSize: 14,
    padding: '9px 11px',
    borderRadius: 3,
    border: `1px solid ${c.linhaForte}`,
    background: c.superficie,
    color: c.tinta,
    width: '100%',
  },
  /** Texto corrido não deve passar disto: linha muito longa faz o olho perder a volta.
   *  Vale para parágrafo e lista de observação — nunca para tabela ou grade de cartão. */
  prosa: { maxWidth: '74ch' },
  rotulo: {
    display: 'block',
    fontSize: 11,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    color: c.suave,
    fontWeight: 600,
    marginBottom: 6,
  },
};

/** Pastilha de estado. `tom` escolhe o par cor/fundo do semáforo. */
export function pastilha(tom: 'ok' | 'alerta' | 'critico' | 'neutro'): React.CSSProperties {
  const pares = {
    ok: [c.ok, c.okFraco],
    alerta: [c.alerta, c.alertaFraco],
    critico: [c.critico, c.criticoFraco],
    neutro: [c.suave, c.superficie2],
  } as const;
  const [cor, fundo] = pares[tom];
  return {
    display: 'inline-block',
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: '.07em',
    textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: 2,
    color: cor,
    background: fundo,
    border: `1px solid ${cor}`,
    whiteSpace: 'nowrap',
  };
}

/** Data ISO (yyyy-mm-dd) para o formato brasileiro. */
export function dataBR(iso?: string | null): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

/** Dias entre hoje e uma data ISO. Negativo = já passou. */
export function diasAte(iso?: string | null): number | null {
  if (!iso) return null;
  const alvo = new Date(iso.slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(alvo.getTime())) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
}
