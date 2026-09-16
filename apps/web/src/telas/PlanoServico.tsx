// Plano de Serviço — a OS. Um formulário só, do qual sai o RIP.
//
// Cada linha é ESPECIFICADO | ENCONTRADO | DATA | RESPONSÁVEL PROCESSO | RESPONSÁVEL INSPEÇÃO,
// como no papel. A diferença é que o sistema compara os dois primeiros e diz se está conforme.
import { useMemo, useState } from 'react';
import { avaliarMedicao, resumirOs, type EtapaPreenchida } from '@/os/regras';
import { ETAPA_ROTULO, GRANDEZA_POR_CHAVE } from '@/os/vocabulario';
import { ORDENS, type OrdemServico } from '@/os/exemplos';
import { c, dataBR, fonte, pastilha, s } from '@/ui/estilo';
import { Cabecalho } from './Vencimentos';

export function PlanoServico() {
  const [ordens, setOrdens] = useState<OrdemServico[]>(ORDENS);
  const [ativa, setAtiva] = useState(0);
  const os = ordens[ativa];
  const etapas = os.etapas;
  const resumo = useMemo(() => resumirOs(etapas), [etapas]);

  function editar(etapaIdx: number, medIdx: number, campo: 'especificado' | 'encontrado', valor: string) {
    setOrdens((todas) => todas.map((o, oi) => oi !== ativa ? o : {
      ...o,
      etapas: o.etapas.map((e, i) => i !== etapaIdx ? e : {
        ...e,
        medicoes: e.medicoes.map((m, j) => j !== medIdx ? m : { ...m, [campo]: valor }),
      }),
    }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Cabecalho
        titulo="Ordens de Serviço"
        sub="Cada OS tem o esquema do seu cliente. O sistema compara especificado e encontrado."
      />

      <div style={S.abas}>
        {ordens.map((o, i) => {
          const r = resumirOs(o.etapas);
          const sel = i === ativa;
          return (
            <button key={o.id} onClick={() => setAtiva(i)} style={{
              ...S.aba,
              background: sel ? c.superficie : 'transparent',
              borderColor: sel ? c.acentoMarca : c.linha,
              borderBottomColor: sel ? c.superficie : c.linha,
            }}>
              <span style={{ fontWeight: sel ? 700 : 500, fontSize: 14 }}>{o.folio}</span>
              <span style={S.abaSub}>{o.cliente} · {o.equipamento}</span>
              <span style={pastilha(r.liberavel ? 'ok' : r.naoConformes ? 'critico' : 'alerta')}>
                {r.liberavel ? 'liberável' : r.naoConformes ? `${r.naoConformes} divergência${r.naoConformes > 1 ? 's' : ''}` : `${r.pendentes} pendente${r.pendentes > 1 ? 's' : ''}`}
              </span>
            </button>
          );
        })}
      </div>

      <div style={S.ident}>
        <Campo rot="Cliente" val={os.cliente} />
        <Campo rot="Obra" val={os.obra ?? '— não consta'} />
        <Campo rot="Equipamento" val={os.equipamento} />
        <Campo rot="Pintura" val={os.pintura} />
        <Campo rot="Emitido por" val={os.emitidoPor} />
        <Campo rot="Verificado por" val={os.verificadoPor} />
        {os.ripNumero && <Campo rot="RIP" val={`${os.ripNumero} · folha ${os.ripFolha}`} mono />}
      </div>

      {os.observacoes.length > 0 && (
        <div style={S.obs}>
          <div style={S.obsTit}>O que o documento de origem não permite afirmar</div>
          <ul style={S.obsLista}>
            {os.observacoes.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </div>
      )}

      <div style={S.contadores}>
        <div style={S.contador}><div style={{ ...S.num, color: c.ok }}>{resumo.conformes}</div><div style={S.rot}>conformes</div></div>
        <div style={S.contador}><div style={{ ...S.num, color: resumo.naoConformes ? c.critico : c.tinta }}>{resumo.naoConformes}</div><div style={S.rot}>não conformes</div></div>
        <div style={S.contador}><div style={{ ...S.num, color: c.suave }}>{resumo.pendentes}</div><div style={S.rot}>pendentes</div></div>
        <div style={S.contador}><div style={{ ...S.num, color: resumo.problemas.length ? c.alerta : c.tinta }}>{resumo.problemas.length}</div><div style={S.rot}>evidências faltando</div></div>
        <div style={{ ...S.contador, borderRight: 'none' }}>
          <div style={{ marginTop: 4 }}>
            <span style={pastilha(resumo.liberavel ? 'ok' : 'alerta')}>
              {resumo.liberavel ? 'liberável' : 'não liberável'}
            </span>
          </div>
          <div style={S.rot}>situação</div>
        </div>
      </div>

      <div style={S.esquema}>
        <span style={S.esquemaRot}>Esquema de pintura do cliente</span>
        <span style={S.esquemaVal}>{os.esquemaPintura}</span>
      </div>

      {etapas.map((e, ei) => {
        if (!e.ativa) {
          return (
            <div key={`${e.etapa}-inativa`} style={S.inativa}>
              {ETAPA_ROTULO[e.etapa]} — não faz parte do esquema deste cliente
            </div>
          );
        }
        const tinta = os.tintas[e.etapa];
        return (
          <div key={`${e.etapa}-${e.escopo ?? ''}`} style={{ ...s.cartao, overflow: 'hidden' }}>
            <div style={S.faixaEtapa}>
              {ETAPA_ROTULO[e.etapa]}
              {e.escopo && <span style={S.escopo}>{e.escopo}</span>}
            </div>

            {tinta && (
              <div style={S.tinta}>
                <Campo rot="Tinta" val={tinta.especificada} />
                <Campo rot="Fabricante" val={tinta.fabricante} />
                <Campo rot="Cor" val={tinta.cor} />
                <Campo rot="Aplicação" val={tinta.metodoAplicacao} />
                <Campo rot="Lote A" val={`${tinta.loteA} · val. ${tinta.validadeA}`} mono />
                <Campo rot="Lote B" val={`${tinta.loteB} · val. ${tinta.validadeB}`} mono />
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={s.tabela}>
                <thead>
                  <tr>
                    <th style={s.th}>Grandeza</th>
                    <th style={{ ...s.th, width: 120 }}>Especificado</th>
                    <th style={{ ...s.th, width: 120 }}>Encontrado</th>
                    <th style={{ ...s.th, width: 96 }}>Inspeção</th>
                    <th style={s.th}>Responsáveis</th>
                    <th style={{ ...s.th, width: 150 }}>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {e.medicoes.map((m, mi) => {
                    const g = GRANDEZA_POR_CHAVE.get(m.grandeza);
                    const r = avaliarMedicao(m);
                    const tom = r.resultado === 'conforme' ? 'ok' : r.resultado === 'nao_conforme' ? 'critico' : 'neutro';
                    return (
                      <tr key={m.grandeza}>
                        <td style={{ ...s.td, color: c.tinta, fontWeight: 500 }}>
                          {g?.rotulo ?? m.grandeza}
                          {g?.unidade && <span style={S.un}>{g.unidade}</span>}
                        </td>
                        <td style={s.td}>
                          <input style={S.campo} value={m.especificado ?? ''} onChange={(ev) => editar(ei, mi, 'especificado', ev.target.value)} />
                        </td>
                        <td style={s.td}>
                          <input
                            style={{ ...S.campo, borderColor: r.resultado === 'nao_conforme' ? c.critico : c.linhaForte, color: r.resultado === 'nao_conforme' ? c.critico : c.tinta, fontWeight: r.resultado === 'nao_conforme' ? 700 : 400 }}
                            value={m.encontrado ?? ''} onChange={(ev) => editar(ei, mi, 'encontrado', ev.target.value)}
                          />
                        </td>
                        <td style={{ ...s.td, ...s.mono, whiteSpace: 'nowrap' }}>{dataBR(m.dataInspecao)}</td>
                        <td style={s.td}>
                          <div style={S.resp}>{m.responsavelProcesso}</div>
                          <div style={S.respSec}>insp. {m.responsavelInspecao}</div>
                          {m.instrumentoCodigo && <div style={S.instr}>{m.instrumentoCodigo}</div>}
                        </td>
                        <td style={s.td}>
                          <span style={pastilha(tom)}>
                            {r.resultado === 'conforme' ? 'conforme' : r.resultado === 'nao_conforme' ? 'não conforme' : 'pendente'}
                          </span>
                          {r.motivo && <div style={S.motivo}>{r.motivo}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div style={{ ...s.cartao, padding: '16px 20px' }}>
        <div style={S.tituloBloco}>Itens</div>
        <div style={S.itens}>
          {os.itens.map((i) => (
            <span key={i.descricao} style={S.item}>
              <strong>{i.quantidade}{i.unidade}</strong> {i.descricao}
            </span>
          ))}
        </div>
      </div>

      <div style={S.rodape}>
        Transcrito dos documentos originais. Sem banco ainda — o que mudar aqui vive só nesta aba.
      </div>
    </div>
  );
}

function Campo({ rot, val, mono }: { rot: string; val: string; mono?: boolean }) {
  return (
    <div>
      <div style={S.campoRot}>{rot}</div>
      <div style={{ fontSize: 13.5, color: c.tinta, fontFamily: mono ? fonte.mono : fonte.texto, marginTop: 2 }}>{val}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  obs: {
    padding: '14px 18px', borderRadius: 3, background: c.superficie2,
    border: `1px solid ${c.linhaForte}`, borderLeft: `3px solid ${c.alerta}`,
  },
  obsTit: {
    fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
    color: c.alerta, marginBottom: 8,
  },
  obsLista: { margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: c.tinta2 },
  abas: { display: 'flex', gap: 6, borderBottom: `1px solid ${c.linha}`, marginBottom: -1 },
  aba: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
    border: '1px solid', borderRadius: '3px 3px 0 0', cursor: 'pointer',
    fontFamily: fonte.texto, color: c.tinta,
  },
  abaSub: { fontSize: 12, color: c.suave },
  ident: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14,
    padding: '16px 20px', background: c.superficie, border: `1px solid ${c.linhaForte}`, borderRadius: 3,
  },
  escopo: {
    marginLeft: 10, padding: '2px 8px', borderRadius: 2, background: c.acentoFraco,
    border: `1px solid ${c.acentoMarca}`, color: c.acento, fontSize: 10.5, letterSpacing: '.05em',
  },
  contadores: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
    border: `1px solid ${c.linhaForte}`, background: c.superficie, borderRadius: 3, overflow: 'hidden',
  },
  contador: { padding: '15px 18px', borderRight: `1px solid ${c.linha}` },
  num: { fontSize: 27, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
  rot: { fontSize: 11.5, color: c.suave, marginTop: 7 },
  esquema: {
    display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap',
    padding: '11px 16px', borderRadius: 3, background: c.acentoFraco, border: `1px solid ${c.acentoMarca}`,
  },
  esquemaRot: { fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: c.acento, fontWeight: 700 },
  esquemaVal: { fontFamily: fonte.mono, fontSize: 13, color: c.acento },
  faixaEtapa: {
    padding: '10px 18px', background: c.superficie2, borderBottom: `1px solid ${c.linhaForte}`,
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: c.tinta2,
  },
  tinta: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14,
    padding: '14px 18px', borderBottom: `1px solid ${c.linha}`,
  },
  campoRot: { fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: c.suave, fontWeight: 600 },
  campo: {
    fontFamily: fonte.mono, fontSize: 13, padding: '6px 9px', borderRadius: 3,
    border: `1px solid ${c.linhaForte}`, background: c.superficie, width: '100%',
  },
  un: { marginLeft: 6, fontFamily: fonte.mono, fontSize: 11, color: c.suave },
  resp: { fontSize: 13, color: c.tinta2 },
  respSec: { fontSize: 11.5, color: c.suave, marginTop: 1 },
  instr: { fontFamily: fonte.mono, fontSize: 11, color: c.acento, marginTop: 3 },
  motivo: { fontSize: 11.5, color: c.critico, marginTop: 4, lineHeight: 1.4 },
  inativa: {
    padding: '11px 18px', borderRadius: 3, border: `1px dashed ${c.linhaForte}`,
    color: c.suave, fontSize: 13.5, background: c.superficie2,
  },
  tituloBloco: { fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: c.suave, marginBottom: 10 },
  itens: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  item: {
    fontSize: 13.5, padding: '5px 11px', borderRadius: 3,
    border: `1px solid ${c.linhaForte}`, background: c.superficie2, color: c.tinta2,
  },
  rodape: { fontFamily: fonte.mono, fontSize: 11.5, color: c.suave, lineHeight: 1.6 },
};
