// Lista Mestra — a página onde o código de documento é decidido, e o único lugar onde ele muda.
//
// Toda tela que carimba um código o pede aqui (`doc`, `carimbo`). Trocar FM-001 por outra coisa
// é trocar uma linha em listaMestra.ts, e o carimbo muda em todas as telas junto. É isso que
// impede o app de emitir um documento com um código que o auditor não acha na Lista Mestra.
import { useMemo, useState } from 'react';
import {
  CONFLITO_ROTULO, LISTA_MESTRA, LISTA_MESTRA_META, NATUREZA_ROTULO,
  SEM_CODIGO, conflitos, type Conflito, type DocumentoMestre, type TipoConflito,
} from '@/documentos/listaMestra';
import { c, dataBR, diasAte, fonte, pastilha, s } from '@/ui/estilo';
import { Cabecalho } from './Vencimentos';

const ORDEM_CONFLITO: TipoConflito[] = ['codigo_duplicado', 'fora_da_lista', 'revisao_vencida', 'codigo_paralelo'];

export function ListaMestra() {
  const [filtro, setFiltro] = useState<'todos' | 'formulario' | 'problema'>('todos');
  const cs = useMemo(() => conflitos(), []);
  const atraso = diasAte(LISTA_MESTRA_META.proximaRevisao);

  const comProblema = useMemo(() => new Set(cs.map((x) => x.codigo).filter(Boolean)), [cs]);
  const docs = LISTA_MESTRA.filter((d) =>
    filtro === 'todos' ? true
    : filtro === 'formulario' ? d.natureza === 'formulario'
    : comProblema.has(d.codigo) || d.foraDaLista || Boolean(d.codigosParalelos?.length));

  const porTipo = ORDEM_CONFLITO
    .map((tipo) => [tipo, cs.filter((x) => x.tipo === tipo)] as const)
    .filter(([, lista]) => lista.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Cabecalho
        titulo="Lista Mestra de Documentos"
        sub="A autoridade sobre código. Toda alteração de identificação se faz aqui, e as telas acompanham."
      />

      <div style={S.cabecalhoDoc}>
        <Campo rot="Código" val={LISTA_MESTRA_META.codigo} mono />
        <Campo rot="Revisão" val={LISTA_MESTRA_META.revisao} mono />
        <Campo rot="Emissão" val={dataBR(LISTA_MESTRA_META.emissao)} mono />
        <div>
          <div style={S.campoRot}>Próxima revisão</div>
          <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: fonte.mono, fontSize: 13.5, color: c.critico, fontWeight: 700 }}>
              {dataBR(LISTA_MESTRA_META.proximaRevisao)}
            </span>
            {atraso !== null && atraso < 0 && (
              <span style={pastilha('critico')}>vencida há {Math.abs(atraso)} dias</span>
            )}
          </div>
        </div>
        <Campo rot="Catalogados" val={`${LISTA_MESTRA_META.totalCatalogado} documentos`} />
        <Campo rot="No app" val={`${LISTA_MESTRA.length} entradas`} />
      </div>

      <div style={S.contadores}>
        <Contador n={cs.filter((x) => x.gravidade === 'alta').length} rot="conflitos graves" cor={c.critico} />
        <Contador n={cs.filter((x) => x.tipo === 'codigo_duplicado').length} rot="códigos disputados" cor={c.critico} />
        <Contador n={cs.filter((x) => x.tipo === 'fora_da_lista').length} rot="fora da lista" cor={c.alerta} />
        <Contador n={cs.filter((x) => x.tipo === 'codigo_paralelo').length} rot="com código paralelo" cor={c.alerta} fim />
      </div>

      {porTipo.map(([tipo, lista]) => (
        <div key={tipo} style={{ ...s.cartao, overflow: 'hidden' }}>
          <div style={S.faixa}>
            <span>{CONFLITO_ROTULO[tipo]}</span>
            <span style={pastilha(lista.some((x) => x.gravidade === 'alta') ? 'critico' : 'alerta')}>
              {lista.length}
            </span>
          </div>
          <div>
            {lista.map((x, i) => <LinhaConflito key={`${x.codigo ?? 'sc'}-${i}`} conflito={x} />)}
          </div>
        </div>
      ))}

      <div style={{ ...s.cartao, overflow: 'hidden' }}>
        <div style={S.faixa}>
          <span>O catálogo</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {([['todos', 'Todos'], ['formulario', 'Só formulários'], ['problema', 'Só com problema']] as const).map(([v, r]) => (
              <button
                key={v} onClick={() => setFiltro(v)}
                style={{ ...s.botao, padding: '5px 11px', fontSize: 12, textTransform: 'none', letterSpacing: 0,
                  background: filtro === v ? c.acentoFraco : c.superficie,
                  borderColor: filtro === v ? c.acentoMarca : c.linhaForte }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.tabela}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: 130 }}>Código</th>
                <th style={s.th}>Documento</th>
                <th style={{ ...s.th, width: 140 }}>Natureza</th>
                <th style={{ ...s.th, width: 200 }}>Código no arquivo real</th>
                <th style={{ ...s.th, width: 130 }}>Tela do app</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => <LinhaDoc key={`${d.codigo}-${i}`} d={d} />)}
            </tbody>
          </table>
        </div>
      </div>

      <div style={S.rodape}>
        Os 36 documentos controlados da LM-SGQ-001 — manual, procedimentos e instruções de trabalho —
        ainda não foram importados. Estão aqui os que o app toca e os que circulam sem entrada.
      </div>
    </div>
  );
}

function LinhaConflito({ conflito }: { conflito: Conflito }) {
  return (
    <div style={{ ...S.conflito, borderLeftColor: conflito.gravidade === 'alta' ? c.critico : c.alerta }}>
      <div style={S.conflitoTopo}>
        <span style={{ fontFamily: fonte.mono, fontSize: 13, fontWeight: 700, color: conflito.codigo ? c.tinta : c.critico, fontStyle: conflito.codigo ? 'normal' : 'italic' }}>
          {conflito.codigo ?? 'sem código'}
        </span>
        <span style={{ fontSize: 13.5, color: c.tinta2 }}>{conflito.titulo}</span>
      </div>
      <div style={S.conflitoDetalhe}>{conflito.detalhe}</div>
    </div>
  );
}

function LinhaDoc({ d }: { d: DocumentoMestre }) {
  const semCodigo = d.codigo.startsWith(SEM_CODIGO);
  return (
    <tr>
      <td style={{ ...s.td, ...s.mono, whiteSpace: 'nowrap' }}>
        {semCodigo ? <span style={{ color: c.critico, fontStyle: 'italic' }}>sem código</span> : d.codigo}
        {d.revisao && <div style={{ color: c.suave, fontSize: 11 }}>rev. {d.revisao}</div>}
      </td>
      <td style={{ ...s.td, color: c.tinta }}>
        {d.titulo}
        {d.foraDaLista && <span style={{ ...pastilha('critico'), marginLeft: 8 }}>fora da lista</span>}
        {d.nota && <div style={S.nota}>{d.nota}</div>}
      </td>
      <td style={s.td}>{NATUREZA_ROTULO[d.natureza]}</td>
      <td style={{ ...s.td, ...s.mono, color: d.codigosParalelos?.length ? c.critico : c.suave }}>
        {d.codigosParalelos?.join(' · ') ?? '—'}
      </td>
      <td style={{ ...s.td, ...s.mono, color: d.tela ? c.acento : c.suave }}>{d.tela ?? '—'}</td>
    </tr>
  );
}

function Contador({ n, rot, cor, fim }: { n: number; rot: string; cor: string; fim?: boolean }) {
  return (
    <div style={{ ...S.contador, borderRight: fim ? 'none' : `1px solid ${c.linha}` }}>
      <div style={{ ...S.num, color: n ? cor : c.tinta }}>{n}</div>
      <div style={S.rot}>{rot}</div>
    </div>
  );
}

function Campo({ rot, val, mono }: { rot: string; val: string | null; mono?: boolean }) {
  return (
    <div>
      <div style={S.campoRot}>{rot}</div>
      <div style={{ fontSize: 13.5, color: c.tinta, fontFamily: mono ? fonte.mono : fonte.texto, marginTop: 3 }}>
        {val ?? '—'}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  cabecalhoDoc: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14,
    padding: '16px 20px', background: c.superficie, border: `1px solid ${c.linhaForte}`, borderRadius: 3,
  },
  campoRot: { fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: c.suave, fontWeight: 600 },
  contadores: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
    border: `1px solid ${c.linhaForte}`, background: c.superficie, borderRadius: 3, overflow: 'hidden',
  },
  contador: { padding: '15px 18px' },
  num: { fontSize: 27, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
  rot: { fontSize: 11.5, color: c.suave, marginTop: 7 },
  faixa: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: '10px 18px', background: c.superficie2, borderBottom: `1px solid ${c.linhaForte}`,
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: c.tinta2,
  },
  conflito: {
    padding: '12px 18px', borderBottom: `1px solid ${c.linha}`, borderLeft: '3px solid',
  },
  conflitoTopo: { display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  conflitoDetalhe: { fontSize: 13, color: c.tinta2, marginTop: 5, lineHeight: 1.55 },
  nota: { fontSize: 11.5, color: c.suave, marginTop: 5, lineHeight: 1.5 },
  rodape: { fontFamily: fonte.mono, fontSize: 11.5, color: c.suave, lineHeight: 1.6 },
};
