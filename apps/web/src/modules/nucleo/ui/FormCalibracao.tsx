// REGISTRAR A CALIBRAÇÃO DE UM INSTRUMENTO — o que faz o vencimento deixar de vencer.
//
// Era a peça que faltava. O painel de vencimentos mostrava o que estava para expirar e não havia
// por onde dizer "voltou do laboratório, aqui está o certificado novo". Quem media via o alerta e
// não tinha o que fazer com ele.
//
// A mesma peça serve as duas telas de propósito: no inventário, na linha do instrumento; no
// painel, na linha do que vence. É o mesmo ato, e formulário duplicado é onde os dois começam a
// divergir.
//
// O SERVIDOR JÁ SABE RENOVAR. `upsertCredentialRecord` aposenta a calibração anterior do mesmo
// instrumento (`superseded`) e registra o evento de renovação. Aqui não se apaga nada: a
// calibração velha continua no banco como histórico, que é o que a §7.1.5 pede como evidência.
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { c, fonte, s } from '@/ui/estilo';

/** O instrumento que está sendo calibrado. `label` é o que aparece no painel de vencimentos. */
export interface AlvoDaCalibracao {
  id: string;
  label: string;
}

export function FormCalibracao({ alvo, aoFechar, aoSalvar }: {
  alvo: AlvoDaCalibracao;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [numero, setNumero] = useState('');
  const [laboratorio, setLaboratorio] = useState('');
  const [emitidoEm, setEmitidoEm] = useState(hoje());
  const [venceEm, setVenceEm] = useState(emUmAno());
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;
    // A conta que o servidor também faz, adiantada: dizer aqui evita a viagem e a mensagem crua.
    if (venceEm && emitidoEm && venceEm < emitidoEm) {
      setErro('A validade não pode ser anterior à emissão do certificado.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await (trpc as any)['compliance-certifications'].upsertCredentialRecord.mutate({
        holderKind: 'asset',
        holderId: alvo.id,
        holderLabel: alvo.label,
        kind: 'calibracao',
        title: 'Certificado de calibração',
        number: numero.trim() || undefined,
        issuingAuthority: laboratorio.trim() || undefined,
        issuedAt: emitidoEm || undefined,
        expiresAt: venceEm || undefined,
      });
      aoSalvar();
    } catch (err) {
      setErro((err as Error)?.message ?? 'não foi possível registrar a calibração');
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} style={{ ...s.cartao, padding: 20, marginBottom: 18 }}>
      <div style={S.titulo}>Calibração de {alvo.label}</div>
      <div style={S.grade}>
        <div>
          <label style={s.rotulo} htmlFor="cal-numero">Certificado</label>
          <input
            id="cal-numero" style={s.campo} value={numero}
            onChange={(e) => setNumero(e.target.value)} placeholder="M008200/2026" required
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={s.rotulo} htmlFor="cal-lab">Laboratório</label>
          <input
            id="cal-lab" style={s.campo} value={laboratorio}
            onChange={(e) => setLaboratorio(e.target.value)} placeholder="Quem emitiu o certificado"
          />
        </div>
        <div>
          <label style={s.rotulo} htmlFor="cal-emissao">Emitido em</label>
          <input id="cal-emissao" type="date" style={s.campo} value={emitidoEm} onChange={(e) => setEmitidoEm(e.target.value)} required />
        </div>
        <div>
          <label style={s.rotulo} htmlFor="cal-validade">Válido até</label>
          <input id="cal-validade" type="date" style={s.campo} value={venceEm} onChange={(e) => setVenceEm(e.target.value)} required />
        </div>
      </div>
      <p style={S.nota}>
        A calibração anterior deste instrumento passa a histórico. Nada é apagado — é ela que
        prova o que valia quando a medição foi feita.
      </p>
      {erro && <div style={S.erro}>{erro}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="submit" style={s.botaoPrimario} disabled={salvando}>
          {salvando ? 'Registrando…' : 'Registrar calibração'}
        </button>
        <button type="button" style={s.botao} onClick={aoFechar}>Cancelar</button>
      </div>
    </form>
  );
}

/** Data de hoje pelo relógio LOCAL. `toISOString()` daria o dia seguinte depois das 21h daqui. */
function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Um ano é o intervalo usual de calibração (MJ-CAL-01 §7). É sugestão: o campo abre editável. */
function emUmAno(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const S: Record<string, React.CSSProperties> = {
  titulo: { fontSize: 15, fontWeight: 600, color: c.tinta, marginBottom: 14 },
  grade: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 },
  nota: { fontSize: 12.5, color: c.suave, margin: '14px 0 0', maxWidth: '62ch' },
  erro: {
    marginTop: 14, padding: '10px 12px', borderRadius: 3,
    background: c.criticoFraco, border: `1px solid ${c.critico}`, color: c.critico,
    fontSize: 13.5, fontFamily: fonte.texto,
  },
};
