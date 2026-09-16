// Lista Mestra — a página onde o código de documento é decidido, e o único lugar onde ele muda.
//
// Toda tela que carimba um código o pede aqui (`doc`, `carimbo`). Trocar FM-001 por outra coisa
// é trocar uma linha em listaMestra.ts, e o carimbo muda em todas as telas junto. É isso que
// impede o app de emitir um documento com um código que o auditor não acha na Lista Mestra.
import { useMemo, useState } from 'react';
import {
  CONFLITO_ROTULO, NATUREZA_ROTULO, SEM_CODIGO,
  conflitos, listaMestra, listaMestraMeta, porCategoria, significadoDoPrefixo,
  type Conflito, type DocumentoMestre, type TipoConflito,
} from '@/documentos/listaMestra';
import { empresaAtiva } from '@/plataforma/empresa';
import { c, dataBR, diasAte, fonte, pastilha, s } from '@/ui/estilo';
import { Cabecalho } from './Vencimentos';

const ORDEM_CONFLITO: TipoConflito[] = [
  'codigo_duplicado', 'prefixo_desconhecido', 'revisao_divergente', 'fora_da_lista',
  'revisao_vencida', 'sem_aprovacao', 'codigo_paralelo',
];

export function ListaMestra() {
  const [filtro, setFiltro] = useState<'todos' | 'formulario' | 'problema'>('todos');
  const empresa = empresaAtiva();
  const LISTA_MESTRA = listaMestra();
  const LISTA_MESTRA_META = listaMestraMeta();
  const cs = useMemo(() => conflitos(), [empresa.id]);
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
        sub={`A autoridade sobre código de ${empresa.identidade.nome}. Toda alteração de identificação se faz aqui, e as telas acompanham.`}
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
        <Campo rot="Norma" val={LISTA_MESTRA_META.norma} />
        <Campo rot="Catalogados" val={`${LISTA_MESTRA_META.totalCatalogado} documentos`} />
        <Campo rot="Elaborado por" val={LISTA_MESTRA_META.elaboradoPor} />
        <Campo rot="Aprovado por" val={LISTA_MESTRA_META.aprovadoPor} />
      </div>

      <div style={S.contadores}>
        <Contador n={cs.filter((x) => x.gravidade === 'alta').length} rot="conflitos graves" cor={c.critico} />
        <Contador n={cs.filter((x) => x.tipo === 'codigo_duplicado').length} rot="códigos disputados" cor={c.critico} />
        <Contador n={cs.filter((x) => x.tipo === 'fora_da_lista').length} rot="fora da lista" cor={c.alerta} />
        <Contador n={cs.filter((x) => x.tipo === 'codigo_paralelo').length} rot="com código paralelo" cor={c.alerta} fim />
      </div>

      <div style={S.categorias}>
        {porCategoria().map(({ categoria, total }) => (
          <span key={categoria} style={S.categoria}>
            <strong style={{ fontFamily: fonte.mono }}>{total}</strong> {categoria}
          </span>
        ))}
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
                <th style={{ ...s.th, width: 120 }}>Código</th>
                <th style={s.th}>Documento</th>
                <th style={{ ...s.th, width: 130 }}>Categoria</th>
                <th style={{ ...s.th, width: 130 }}>Responsável</th>
                <th style={{ ...s.th, width: 110 }}>Cláusula ISO</th>
                <th style={{ ...s.th, width: 100 }}>Acesso</th>
                <th style={{ ...s.th, width: 170 }}>No arquivo real</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => <LinhaDoc key={`${d.codigo}-${i}`} d={d} />)}
            </tbody>
          </table>
        </div>
      </div>

      <div style={S.rodape}>
        Importado da planilha LM-SGQ-001 rev. 3: os 47 documentos com tipo, categoria, responsável,
        cláusula da ISO 9001:2015, local de armazenamento e nível de acesso. Mais o que circula sem
        entrada própria.
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
  const prefixoConhecido = semCodigo || Boolean(significadoDoPrefixo(d.codigo));
  return (
    <tr>
      <td style={{ ...s.td, ...s.mono, whiteSpace: 'nowrap' }}>
        {semCodigo
          ? <span style={{ color: c.critico, fontStyle: 'italic' }}>sem código</span>
          : <span style={{ color: prefixoConhecido ? c.tinta : c.critico }}>{d.codigo}</span>}
        {d.revisao && <div style={{ color: c.suave, fontSize: 11 }}>rev. {d.revisao}</div>}
        {d.revisaoNoArquivo && (
          <div style={{ color: c.critico, fontSize: 11 }}>arquivo: rev. {d.revisaoNoArquivo.revisao}</div>
        )}
      </td>
      <td style={{ ...s.td, color: c.tinta }}>
        {d.titulo}
        {d.foraDaLista && <span style={{ ...pastilha('critico'), marginLeft: 8 }}>fora da lista</span>}
        {d.tela && <span style={{ ...pastilha('ok'), marginLeft: 8 }}>vira tela</span>}
        <div style={S.subLinha}>
          {NATUREZA_ROTULO[d.natureza]}{d.local ? ` · ${d.local}` : ''}
        </div>
        {d.nota && <div style={S.nota}>{d.nota}</div>}
      </td>
      <td style={s.td}>{d.categoria}</td>
      <td style={{ ...s.td, color: d.responsavel ? c.tinta2 : c.suave }}>{d.responsavel ?? '—'}</td>
      <td style={{ ...s.td, ...s.mono, fontSize: 12 }}>{d.clausulas.join(', ') || '—'}</td>
      <td style={s.td}>
        <span style={pastilha(d.acesso === 'irrestrito' ? 'neutro' : 'alerta')}>{d.acesso}</span>
      </td>
      <td style={{ ...s.td, ...s.mono, color: d.codigosParalelos?.length ? c.critico : c.suave }}>
        {d.codigosParalelos?.join(' · ') ?? '—'}
      </td>
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
  subLinha: { fontSize: 11.5, color: c.suave, marginTop: 3 },
  categorias: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  categoria: {
    fontSize: 13, padding: '5px 11px', borderRadius: 3,
    border: `1px solid ${c.linhaForte}`, background: c.superficie, color: c.tinta2,
  },
  rodape: { fontFamily: fonte.mono, fontSize: 11.5, color: c.suave, lineHeight: 1.6 },
};
