// Paleta e primitivos visuais do app. Aço primerizado como neutro, ocre como acento — o amarelo
// que os formulários da Minasjato já usam para "campo obrigatório". Semáforo separado do acento.
export const c = {
  fundo: '#EFF1EF',
  superficie: '#FFFFFF',
  superficie2: '#F7F8F6',
  tinta: '#14181A',
  tinta2: '#33403F',
  suave: '#5A6468',
  linha: '#D3D8D5',
  linhaForte: '#B6BEBA',
  acento: '#8A6C00',
  acentoMarca: '#B08900',
  acentoFraco: '#FBF3D2',
  ok: '#35664A',
  okFraco: '#E2EDE6',
  alerta: '#8A5F0E',
  alertaFraco: '#F7EDD8',
  critico: '#9C3225',
  criticoFraco: '#F6E3E0',
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
    color: '#1A1400',
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
