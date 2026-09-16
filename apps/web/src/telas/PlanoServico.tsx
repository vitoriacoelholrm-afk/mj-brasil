// Plano de Serviço — a OS. Um formulário só, do qual sai o RIP.
//
// Cada linha é ESPECIFICADO | ENCONTRADO | DATA | RESPONSÁVEL PROCESSO | RESPONSÁVEL INSPEÇÃO,
// como no papel. A diferença é que o sistema compara os dois primeiros e diz se está conforme.
import { useMemo, useState } from 'react';
import { avaliarMedicao, resumirOs, type EtapaPreenchida } from '@/os/regras';
import { ETAPA_ROTULO, GRANDEZA_POR_CHAVE } from '@/os/vocabulario';
import { ETAPAS_748, ITENS_748, OS_748, TINTAS_748 } from '@/os/os748';
import { c, dataBR, fonte, pastilha, s } from '@/ui/estilo';
import { Cabecalho } from './Vencimentos';

export function PlanoServico() {
  const [etapas, setEtapas] = useState<EtapaPreenchida[]>(ETAPAS_748);
  const resumo = useMemo(() => resumirOs(etapas), [etapas]);

  function editar(etapaIdx: number, medIdx: number, campo: 'especificado' | 'encontrado', valor: string) {
    setEtapas((atual) => atual.map((e, i) => i !== etapaIdx ? e : {
      ...e,
      medicoes: e.medicoes.map((m, j) => j !== medIdx ? m : { ...m, [campo]: valor }),
    }));
  }

  const divergeRip = OS_748.ripOsDeclarada !== OS_748.folio;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Cabecalho
        titulo={`Plano de Serviço · OS ${OS_748.folio}`}
        sub={`${OS_748.cliente} — ${OS_748.obraProjeto} · ${OS_748.equipamento} · pintura ${OS_748.pintura}`}
      />

      {divergeRip && (
        <div style={S.alertaCrit}>
          <strong>O RIP {OS_748.ripNumero} declara a OS {OS_748.ripOsDeclarada}, mas esta é a {OS_748.folio}.</strong>{' '}
          Dígitos trocados na transcrição — o relatório que foi ao cliente aponta para uma OS que
          não existe. Com o RIP saindo desta tela, isso deixa de ser possível.
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
        <span style={S.esquemaVal}>{OS_748.esquemaPintura}</span>
      </div>

      {etapas.map((e, ei) => {
        if (!e.ativa) {
          return (
            <div key={e.etapa} style={S.inativa}>
              {ETAPA_ROTULO[e.etapa]} — não faz parte do esquema deste cliente
            </div>
          );
        }
        const tinta = TINTAS_748[e.etapa];
        return (
          <div key={e.etapa} style={{ ...s.cartao, overflow: 'hidden' }}>
            <div style={S.faixaEtapa}>{ETAPA_ROTULO[e.etapa]}</div>

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
          {ITENS_748.map((i) => (
            <span key={i.descricao} style={S.item}>
              <strong>{i.quantidade}{i.unidade}</strong> {i.descricao}
            </span>
          ))}
        </div>
      </div>

      <div style={S.rodape}>
        Emitido por {OS_748.emitidoPor} · verificado por {OS_748.verificadoPor}.
        Sem banco ainda — o que mudar aqui vive só nesta aba.
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
  alertaCrit: {
    padding: '12px 16px', borderRadius: 3, background: c.criticoFraco,
    border: `1px solid ${c.critico}`, color: c.critico, fontSize: 13.5, lineHeight: 1.55,
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
