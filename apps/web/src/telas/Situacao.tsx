// A home: um veredito antes de qualquer lista. Responde "estamos em dia?" — a pergunta da
// Análise Crítica pela Direção (ISO 9001 §9.3) e a primeira que um auditor faz.
//
// Os cartões mostram o que está vazio tanto quanto o que está cheio: um domínio ainda não
// construído aparece como tal, em vez de sumir.
import { trpc } from '@/lib/trpc';
import { usarDados } from '@/lib/usarDados';
import { c, dataBR, diasAte, fonte, pastilha, s } from '@/ui/estilo';
import { catalogados, conflitos, listaMestraMeta } from '@/documentos/listaMestra';

interface Credencial {
  id: string; holder_label: string; kind: string;
  number: string | null; expires_at: string | null; bucket: string;
}
interface Painel {
  buckets: Record<string, Credencial[]>;
  counts: Record<string, number>;
}

type Rota = 'situacao' | 'vencimentos' | 'instrumentos' | 'clientes';

export function Situacao({ irPara }: { irPara: (r: Rota) => void }) {
  const { dados, carregando, erro } = usarDados<Painel>(
    () => (trpc as any)['compliance-certifications'].vencimientosBoard.query({}),
  );

  if (carregando) return <div style={S.vazio}>Carregando…</div>;
  if (erro) return <div style={{ ...S.vazio, color: c.critico, borderColor: c.critico }}>{erro}</div>;

  const cont = dados?.counts ?? {};
  const total = Object.values(cont).reduce((a, b) => a + b, 0);
  const atencao = (cont.expired ?? 0) + (cont.d7 ?? 0) + (cont.d15 ?? 0) + (cont.d30 ?? 0);
  const emDia = atencao === 0;

  // As duas credenciais que vencem primeiro, seja qual for o balde.
  const proximas = ['expired', 'd7', 'd15', 'd30', 'later']
    .flatMap((b) => dados?.buckets?.[b] ?? [])
    .slice(0, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* o veredito */}
      <div style={{ ...s.cartao, display: 'flex', alignItems: 'center', gap: 22, padding: '24px 26px' }}>
        <div style={{
          width: 52, height: 52, flexShrink: 0, borderRadius: '50%',
          background: emDia ? c.okFraco : c.alertaFraco,
          border: `1px solid ${emDia ? c.ok : c.alerta}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {emDia ? <IconeCerto /> : <IconeAlerta />}
        </div>
        <div style={{ flexGrow: 1 }}>
          <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-.02em' }}>
            {emDia ? 'Estamos em dia' : `${atencao} ${atencao === 1 ? 'item precisa' : 'itens precisam'} de atenção`}
          </div>
          <div style={{ fontSize: 14.5, color: c.suave, marginTop: 4 }}>
            {emDia
              ? 'Nenhum vencimento controlado nos próximos 30 dias.'
              : 'Vencimentos dentro dos próximos 30 dias, ou já vencidos.'}
          </div>
        </div>
        <div style={{ textAlign: 'right', paddingLeft: 20, borderLeft: `1px solid ${c.linha}` }}>
          <div style={{ ...S.rotuloMono, color: c.suave }}>Atualizado</div>
          <div style={{ fontFamily: fonte.mono, fontSize: 13, marginTop: 4 }}>
            {new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* cartões por domínio */}
      <div style={S.grade}>
        <Cartao
          titulo="Vencimentos"
          numero={String(total)}
          nota={emDia ? 'itens controlados, todos em dia' : 'itens controlados'}
          selo={{ texto: `${cont.expired ?? 0} vencidos`, tom: (cont.expired ?? 0) > 0 ? 'critico' : 'ok' }}
          aoClicar={() => irPara('vencimentos')}
          icone={<IconeRelogio />}
        />
        <Cartao
          titulo="Ordens de Serviço"
          numero="—"
          nota="módulo ainda não instalado"
          selo={{ texto: 'a construir', tom: 'neutro' }}
          icone={<IconeOS />}
        />
        <Cartao
          titulo="Não conformidades"
          numero="—"
          nota="módulo ainda não instalado"
          selo={{ texto: 'a construir', tom: 'neutro' }}
          icone={<IconeAlerta cor={c.suave} />}
        />
        <CartaoListaMestra irPara={irPara} />
      </div>

      {/* o que vence primeiro */}
      {proximas.length > 0 && (
        <div style={{ ...s.cartao, display: 'flex', flexDirection: 'column' }}>
          <div style={S.cabecalhoLista}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>O que vence primeiro</span>
            <button style={S.link} onClick={() => irPara('vencimentos')}>
              ver {total === 1 ? 'o item' : `todos os ${total}`}
            </button>
          </div>
          {proximas.map((p, i) => {
            const dias = diasAte(p.expires_at);
            const tom = dias === null ? 'neutro' : dias < 0 ? 'critico' : dias <= 30 ? 'alerta' : 'ok';
            return (
              <div key={p.id} style={{ ...S.linha, borderBottom: i < proximas.length - 1 ? `1px solid ${c.linha}` : 'none' }}>
                <span style={{ ...S.marca, background: tom === 'ok' ? c.ok : tom === 'alerta' ? c.alerta : tom === 'critico' ? c.critico : c.suave }} />
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 500 }}>{p.holder_label}</div>
                  <div style={{ fontSize: 12, color: c.suave, marginTop: 2 }}>
                    {p.kind === 'calibracao' ? 'Calibração' : 'Certificação'}
                    {p.number ? ` · certificado ${p.number}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: fonte.mono, fontSize: 13 }}>{dataBR(p.expires_at)}</div>
                  <div style={{ fontSize: 11.5, color: c.suave, marginTop: 2 }}>
                    {dias === null ? '' : dias < 0 ? `há ${Math.abs(dias)} dias` : `em ${dias} dias`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Cartao({ titulo, numero, nota, selo, icone, aoClicar }: {
  titulo: string; numero: string; nota: string;
  selo: { texto: string; tom: 'ok' | 'alerta' | 'critico' | 'neutro' };
  icone: React.ReactNode; aoClicar?: () => void;
}) {
  const clicavel = !!aoClicar;
  return (
    <div
      onClick={aoClicar}
      role={clicavel ? 'button' : undefined}
      tabIndex={clicavel ? 0 : undefined}
      onKeyDown={clicavel ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoClicar!(); } } : undefined}
      style={{
        ...s.cartao, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14,
        cursor: clicavel ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.02em' }}>{titulo}</span>
        {icone}
      </div>
      <div>
        <div style={{
          fontSize: 38, fontWeight: 700, lineHeight: 1, letterSpacing: '-.03em',
          fontVariantNumeric: 'tabular-nums', color: numero === '—' ? c.suave : c.tinta,
        }}>{numero}</div>
        <div style={{ fontSize: 12.5, color: c.suave, marginTop: 7 }}>{nota}</div>
      </div>
      <div style={{ paddingTop: 12, borderTop: `1px solid ${c.linha}` }}>
        <span style={pastilha(selo.tom)}>{selo.texto}</span>
      </div>
    </div>
  );
}

/* ── ícones ─────────────────────────────────────────────────────────────── */
const svg = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const IconeRelogio = () => (
  <svg {...svg} stroke={c.suave}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
const IconeOS = () => (
  <svg {...svg} stroke={c.suave}><path d="M4 5h16v14H4z" /><path d="M8 9h8M8 13h5" /></svg>
);
const IconeDoc = () => (
  <svg {...svg} stroke={c.suave}><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" /></svg>
);
const IconeAlerta = ({ cor }: { cor?: string }) => (
  <svg {...svg} width={cor ? 18 : 26} height={cor ? 18 : 26} strokeWidth={cor ? 1.8 : 2.2} stroke={cor ?? c.alerta}>
    <path d="M12 4 2 20h20L12 4z" /><path d="M12 10v4M12 17h.01" />
  </svg>
);
const IconeCerto = () => (
  <svg {...svg} width={26} height={26} strokeWidth={2.2} stroke={c.ok}><path d="M20 6 9 17l-5-5" /></svg>
);

/** O cartão da lista mestra lê tudo do perfil da empresa ativa — nada aqui é fixo. */
function CartaoListaMestra({ irPara }: { irPara: (r: 'lista-mestra') => void }) {
  const meta = listaMestraMeta();
  const graves = conflitos().filter((x) => x.gravidade === 'alta').length;
  return (
    <div onClick={() => irPara('lista-mestra')} style={{ cursor: 'pointer' }}>
      <Cartao
        titulo="Lista Mestra"
        numero={String(catalogados().length)}
        nota={`documentos na lista de ${dataBR(meta.emissao)}`}
        selo={graves
          ? { texto: `${graves} conflito${graves > 1 ? 's' : ''}`, tom: 'critico' }
          : { texto: 'sem conflitos', tom: 'ok' }}
        icone={<IconeDoc />}
      />
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  vazio: {
    padding: '14px 16px', border: `1px solid ${c.linha}`, borderRadius: 3,
    background: c.superficie, fontSize: 14, color: c.suave,
  },
  grade: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(215px,1fr))', gap: 16 },
  rotuloMono: {
    fontFamily: fonte.mono, fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase',
  },
  cabecalhoLista: {
    padding: '14px 20px', borderBottom: `1px solid ${c.linha}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  link: {
    border: 'none', background: 'none', padding: 0, cursor: 'pointer',
    fontFamily: fonte.texto, fontSize: 12.5, color: c.acento,
    textDecoration: 'underline', textUnderlineOffset: 2,
  },
  linha: { display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' },
  marca: { display: 'inline-block', width: 4, height: 34, borderRadius: 2, flexShrink: 0 },
};
