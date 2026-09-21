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
} from '@/modules/sgq-documentos/listaMestra';
import { empresaAtiva } from '@/plataforma/empresa';
import {
  EXIGENCIA_ROTULO, cobertura, faltasDeNorma, percentualCoberto, type DocumentoPadrao,
} from '@/modules/sgq-documentos/catalogoPadrao';
import {
  PROPOSTA_ROTULO, planoDeUnificacao, resumoDoPlano, type PlanoDeUnificacao, type Proposta,
} from '@/modules/sgq-documentos/unificacao';
import { c, dataBR, diasAte, fonte, pastilha, s } from '@/ui/estilo';
import { Cabecalho } from '@/ui/Cabecalho';

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
  const cob = useMemo(() => cobertura(LISTA_MESTRA, empresa.modulos), [empresa.id]);
  const plano = useMemo(() => planoDeUnificacao(empresa.documentacao, empresa.modulos), [empresa.id]);
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

      <Cobertura cob={cob} />

      <Unificacao plano={plano} />

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
        <div className="rolagem-lateral" style={{ maxWidth: '100%' }}>
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
        Importado da planilha de lista mestra da empresa: os documentos com tipo, categoria, responsável,
        cláusula da ISO 9001:2015, local de armazenamento e nível de acesso. Mais o que circula sem
        entrada própria.
      </div>
    </div>
  );
}

/** De duplicidade para decisão. Cada linha diz o que sai, o que fica e por quê — com código
 *  concreto, para a conversa com o cliente não ficar em "isso está duplicado". */
function Unificacao({ plano }: { plano: PlanoDeUnificacao }) {
  const r = resumoDoPlano(plano);
  if (r.total === 0 && r.agrupados === 0) return null;

  const porTipo = (['renumerar', 'cadastrar', 'fundir', 'aposentar_codigo', 'conciliar_revisao'] as const)
    .map((tipo) => [tipo, plano.propostas.filter((p) => p.tipo === tipo)] as const)
    .filter(([, lista]) => lista.length > 0);

  return (
    <div style={{ ...s.cartao, overflow: 'hidden' }}>
      <div style={S.faixa}>
        <span>Plano de unificação</span>
        <span style={pastilha(r.graves ? 'critico' : r.total ? 'alerta' : 'ok')}>
          {r.total === 0 ? 'nada a unificar' : `${r.total} decisõe${r.total > 1 ? 's' : ''}`}
        </span>
      </div>

      {porTipo.map(([tipo, lista]) => (
        <div key={tipo}>
          <div style={S.subFaixa}>{PROPOSTA_ROTULO[tipo]} — {lista.length}</div>
          {lista.map((p, i) => <LinhaProposta key={`${tipo}-${i}`} p={p} />)}
        </div>
      ))}

      {plano.agrupados.length > 0 && (
        <div style={S.extras}>
          <div style={S.tituloBloco}>Mais de um documento no mesmo padrão — {plano.agrupados.length}</div>
          <div style={{ ...S.nota, ...s.prosa }}>
            Isto <strong>não</strong> é duplicidade e não entrou no plano. O procedimento diz como se
            faz, o formulário é o registro, a instrução é o passo a passo na máquina — e duas demãos
            diferentes são dois procedimentos legítimos. Fundir às cegas perderia informação.
          </div>
          {plano.agrupados.map((g) => (
            <div key={g.padrao.chave} style={S.grupo}>
              <span style={S.grupoTitulo}>{g.padrao.titulo}</span>
              <span style={S.grupoDocs}>
                {g.documentos.map((d) => (
                  <span key={d.codigo} style={S.item} title={d.titulo}>
                    {d.codigo.startsWith(SEM_CODIGO) ? 'sem código' : d.codigo}
                    <span style={{ color: c.suave }}> · {NATUREZA_ROTULO[d.natureza].toLowerCase()}</span>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LinhaProposta({ p }: { p: Proposta }) {
  return (
    <div style={{ ...S.conflito, borderLeftColor: p.gravidade === 'alta' ? c.critico : c.alerta }}>
      <div style={S.conflitoTopo}>
        <span style={S.de}>{p.de}</span>
        <span style={{ color: c.suave }}>→</span>
        <span style={S.para}>{p.para}</span>
        <span style={{ fontSize: 13, color: c.tinta2 }}>{p.titulo}</span>
      </div>
      <div style={{ ...S.conflitoDetalhe, ...s.prosa }}>{p.porque}</div>
    </div>
  );
}

/** A empresa medida contra o catálogo padrão. É o diagnóstico que a consultoria entrega, e o
 *  cálculo é o mesmo para qualquer cliente — só o dado muda. */
function Cobertura({ cob }: { cob: ReturnType<typeof cobertura> }) {
  const pct = percentualCoberto(cob);
  const exigidas = faltasDeNorma(cob);
  const praticas = cob.faltando.filter((f) => f.exigencia === 'pratica');

  return (
    <div style={{ ...s.cartao, overflow: 'hidden' }}>
      <div style={S.faixa}>
        <span>Cobertura do catálogo padrão</span>
        <span style={pastilha(exigidas.length ? 'critico' : 'ok')}>
          {pct === null ? '—' : `${Math.round(pct * 100)}% coberto`}
        </span>
      </div>

      <div style={S.contadores}>
        <Contador n={cob.atendidos.length} rot="atendidos" cor={c.ok} />
        <Contador n={exigidas.length} rot="faltam · a norma exige" cor={c.critico} />
        <Contador n={praticas.length} rot="faltam · prática" cor={c.alerta} />
        <Contador n={cob.extras.length} rot="fora do padrão" cor={c.suave} fim />
      </div>

      {exigidas.length > 0 && (
        <div>
          <div style={S.subFaixa}>Falta, e a norma exige — vira não conformidade em auditoria</div>
          {exigidas.map((f) => <LinhaPadrao key={f.chave} p={f} grave />)}
        </div>
      )}

      {praticas.length > 0 && (
        <div>
          <div style={S.subFaixa}>Falta, mas é prática — a norma não exige, e é escolha da empresa</div>
          {praticas.map((f) => <LinhaPadrao key={f.chave} p={f} />)}
        </div>
      )}

      {cob.extras.length > 0 && (
        <div style={S.extras}>
          <div style={S.tituloBloco}>Fora do padrão — {cob.extras.length} documentos</div>
          <div style={S.nota}>
            Não é defeito por si: pode ser requisito legal, do cliente ou de outra norma. Mas cada um
            precisa ser olhado, porque é assim que também nasce documento que ninguém usa.
          </div>
          <div style={S.itens}>
            {cob.extras.map((d) => (
              <span key={d.codigo} style={S.item} title={d.titulo}>{d.codigo}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LinhaPadrao({ p, grave }: { p: DocumentoPadrao; grave?: boolean }) {
  return (
    <div style={{ ...S.conflito, borderLeftColor: grave ? c.critico : c.alerta }}>
      <div style={S.conflitoTopo}>
        <span style={{ fontFamily: fonte.mono, fontSize: 12.5, color: c.suave }}>
          {p.clausulas.join(', ')}
        </span>
        <span style={{ fontSize: 13.5, color: c.tinta, fontWeight: 600 }}>{p.titulo}</span>
        <span style={{ fontFamily: fonte.mono, fontSize: 11.5, color: c.acento }}>
          sugerido: {p.codigoSugerido}
        </span>
        <span style={{ fontSize: 11, color: c.suave }}>{EXIGENCIA_ROTULO[p.exigencia]}</span>
        <span style={pastilha(p.retencao === 'reter' ? 'alerta' : 'neutro')}>
          {p.retencao === 'reter' ? 'registro' : 'documento'}
        </span>
      </div>
      {p.comoAtender && (
        <div style={{ ...S.comoAtender, ...s.prosa }}>
          <strong style={{ color: c.tinta }}>Como atender: </strong>{p.comoAtender}
        </div>
      )}
      {p.nota && <div style={{ ...S.conflitoDetalhe, ...s.prosa }}>{p.nota}</div>}
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
      <div style={{ ...S.conflitoDetalhe, ...s.prosa }}>{conflito.detalhe}</div>
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
        {d.nota && <div style={{ ...S.nota, ...s.prosa }}>{d.nota}</div>}
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
  subFaixa: {
    padding: '8px 18px', background: c.superficie2, borderTop: `1px solid ${c.linha}`,
    borderBottom: `1px solid ${c.linha}`,
    fontSize: 11.5, fontWeight: 600, color: c.tinta2,
  },
  extras: { padding: '14px 18px', borderTop: `1px solid ${c.linhaForte}`, background: c.superficie2 },
  comoAtender: {
    fontSize: 13, color: c.tinta2, marginTop: 7, lineHeight: 1.55,
    padding: '8px 12px', borderRadius: 3, background: c.acentoFraco, border: `1px solid ${c.acentoMarca}`,
  },
  de: { fontFamily: fonte.mono, fontSize: 12.5, color: c.critico, textDecoration: 'line-through' },
  para: { fontFamily: fonte.mono, fontSize: 13, color: c.ok, fontWeight: 700 },
  grupo: { display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginTop: 10 },
  grupoTitulo: { fontSize: 13, color: c.tinta, fontWeight: 600, minWidth: 200 },
  grupoDocs: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  tituloBloco: {
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
    color: c.suave, marginBottom: 8,
  },
  itens: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  item: {
    fontFamily: fonte.mono, fontSize: 12, padding: '3px 8px', borderRadius: 3,
    border: `1px solid ${c.linhaForte}`, background: c.superficie, color: c.tinta2,
  },
  subLinha: { fontSize: 11.5, color: c.suave, marginTop: 3 },
  categorias: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  categoria: {
    fontSize: 13, padding: '5px 11px', borderRadius: 3,
    border: `1px solid ${c.linhaForte}`, background: c.superficie, color: c.tinta2,
  },
  rodape: { fontFamily: fonte.mono, fontSize: 11.5, color: c.suave, lineHeight: 1.6 },
};
