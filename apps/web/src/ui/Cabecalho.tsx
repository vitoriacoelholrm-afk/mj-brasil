// O cabeçalho de tela e o aviso de uma linha — os dois pedaços que TODA tela usa.
//
// Moravam dentro da tela de vencimentos, e sete telas importavam de lá. Enquanto tudo estava na
// mesma pasta isso passava; quando cada módulo foi para a sua, virou o que era: um módulo
// importando a tela de outro para pegar um título emprestado. Peça que todo mundo usa é da casa.
import { c, fonte, s } from '@/ui/estilo';

export function Cabecalho({ titulo, sub, acao }: {
  titulo: string; sub?: string; acao?: React.ReactNode;
}) {
  return (
    <div style={S.cabecalho}>
      <div>
        <h1 style={S.h1}>{titulo}</h1>
        {sub && <p style={{ ...S.sub, ...s.prosa }}>{sub}</p>}
      </div>
      {acao}
    </div>
  );
}

export function Aviso({ texto, erro }: { texto: string; erro?: boolean }) {
  return (
    <div style={{ ...S.aviso, color: erro ? c.critico : c.suave, borderColor: erro ? c.critico : c.linha }}>
      {texto}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  cabecalho: {
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    gap: 16, marginBottom: 22,
  },
  h1: { fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', margin: 0 },
  sub: { fontSize: 14.5, color: c.suave, margin: '6px 0 0', maxWidth: '62ch' },
  aviso: {
    padding: '14px 16px', border: `1px solid ${c.linha}`, borderRadius: 3,
    background: c.superficie, fontSize: 14, fontFamily: fonte.texto,
  },
};
