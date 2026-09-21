// Plano de Serviço — a OS. Um formulário só, do qual sai o RIP.
//
// Cada linha é ESPECIFICADO | ENCONTRADO | DATA | RESPONSÁVEL PROCESSO | RESPONSÁVEL INSPEÇÃO,
// como no papel. A diferença é que o sistema compara os dois primeiros e diz se está conforme.
import { useMemo, useState } from 'react';
import { avaliarMedicao, resumirOs, type EtapaPreenchida } from '../regras';
import { ETAPA_ROTULO, GRANDEZA_POR_CHAVE } from '../vocabulario';
import { compararComRelatorio, type Anexo, type Divergencia, type OrdemServico, type Relatorio } from '../documentos';
 import { ordensDaEmpresa } from '../ordens';
import { carimboDoPapel } from '@/modules/sgq-documentos/listaMestra';
import { PainelRelatorio } from './Relatorio';
import { motivoDaLeituraApenas, pode, somenteLeitura, type Papel } from '@/plataforma/acesso';
import { papelAtual } from '@/lib/session';
import { c, dataBR, fonte, pastilha, s } from '@/ui/estilo';
import { Cabecalho } from '@/ui/Cabecalho';

export function PlanoServico() {
  const [ordens, setOrdens] = useState<OrdemServico[]>(ordensDaEmpresa);
  const [aberta, setAberta] = useState<string | null>(null);
  const papel = papelAtual();
  const os = aberta ? ordens.find((o) => o.id === aberta) ?? null : null;

  function mexerNaOs(mudar: (o: OrdemServico) => OrdemServico) {
    setOrdens((todas) => todas.map((o) => (o.id === aberta ? mudar(o) : o)));
  }

  return os
    ? <Detalhe os={os} papel={papel} aoVoltar={() => setAberta(null)} mexerNaOs={mexerNaOs} />
    : <Lista ordens={ordens} aoAbrir={setAberta} />;
}

/* ── A ordem aberta ───────────────────────────────────────────────────────────────────────── */

function Detalhe({ os, papel, aoVoltar, mexerNaOs }: {
  os: OrdemServico;
  papel: Papel;
  aoVoltar: () => void;
  mexerNaOs: (mudar: (o: OrdemServico) => OrdemServico) => void;
}) {
  const etapas = os.etapas;
  const resumo = useMemo(() => resumirOs(etapas), [etapas]);
  const divergencias = useMemo(() => compararComRelatorio(os), [os]);
  const anexos = os.anexos ?? [];
  const podeEditar = pode(papel, 'os.editar');

  function editar(etapaIdx: number, medIdx: number, campo: 'especificado' | 'encontrado', valor: string) {
    mexerNaOs((o) => ({
      ...o,
      etapas: o.etapas.map((e, i) => i !== etapaIdx ? e : {
        ...e,
        medicoes: e.medicoes.map((m, j) => j !== medIdx ? m : { ...m, [campo]: valor }),
      }),
    }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button onClick={aoVoltar} style={S.voltar}>← Todas as ordens de serviço</button>

      <Cabecalho
        titulo={`Ordem de serviço ${os.folio}`}
        sub={carimboDoPapel('ordem_servico')
          ? `${carimboDoPapel('ordem_servico')} — ${os.cliente} · ${os.equipamento}`
          : `${os.cliente} · ${os.equipamento}`}
      />

      {somenteLeitura(papel) && (
        <div style={S.avisoLeitura}>
          <span style={pastilha('neutro')}>consulta</span>
          <span style={{ ...s.prosa, lineHeight: 1.55 }}>{motivoDaLeituraApenas(papel)}</span>
        </div>
      )}

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
          <ul style={{ ...S.obsLista, ...s.prosa }}>
            {os.observacoes.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </div>
      )}

      <div style={S.contadores}>
        <div style={S.contador}><div style={{ ...S.num, color: c.ok }}>{resumo.conformes}</div><div style={S.rot}>conformes</div></div>
        <div style={S.contador}><div style={{ ...S.num, color: resumo.naoConformes ? c.critico : c.tinta }}>{resumo.naoConformes}</div><div style={S.rot}>não conformes</div></div>
        <div style={S.contador}><div style={{ ...S.num, color: c.suave }}>{resumo.pendentes}</div><div style={S.rot}>pendentes</div></div>
        <div style={S.contador}><div style={{ ...S.num, color: resumo.problemas.length ? c.alerta : c.tinta }}>{resumo.problemas.length}</div><div style={S.rot}>evidências faltando</div></div>
        <div style={S.contador}><div style={{ ...S.num, color: divergencias.length ? c.critico : c.tinta }}>{os.relatorio ? divergencias.length : '—'}</div><div style={S.rot}>contra o relatório</div></div>
        <div style={{ ...S.contador, borderRight: 'none' }}>
          <div style={{ marginTop: 4 }}>
            <span style={pastilha(resumo.liberavel ? 'ok' : 'alerta')}>
              {resumo.liberavel ? 'liberável' : 'não liberável'}
            </span>
          </div>
          <div style={S.rot}>situação</div>
        </div>
      </div>

      {os.relatorio && <Confronto rel={os.relatorio} divergencias={divergencias} />}

      <PainelRelatorio
        os={os}
        papel={papel}
        anexos={anexos}
        aoAdicionar={(novos) => mexerNaOs((o) => ({ ...o, anexos: [...(o.anexos ?? []), ...novos] }))}
        aoAlterar={(id, campo, valor) => mexerNaOs((o) => ({
          ...o, anexos: (o.anexos ?? []).map((a) => (a.id === id ? { ...a, [campo]: valor } : a)),
        }))}
        aoRemover={(id) => mexerNaOs((o) => ({ ...o, anexos: (o.anexos ?? []).filter((a) => a.id !== id) }))}
      />

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
              {e.ausenteNoPapel && <span style={{ ...pastilha('alerta'), marginLeft: 10 }}>não constava no papel</span>}
              {e.condicoes && (
                <span style={S.condicoes}>
                  aplicada {dataBR(e.dataAplicacao)} · {e.condicoes.tempAmbiente}°C · {e.condicoes.umidadeRelativa}% · substrato {e.condicoes.tempSubstrato}°C
                </span>
              )}
            </div>

            {tinta && (
              <div style={S.tinta}>
                <Campo rot="Tinta" val={tinta.especificada} />
                <Campo rot="Fabricante" val={tinta.fabricante} />
                <Campo rot="Cor" val={tinta.cor} />
                <Campo rot="Aplicação" val={tinta.metodoAplicacao} />
                <Campo rot="Lote A" val={tinta.loteA && `${tinta.loteA} · val. ${tinta.validadeA}`} mono />
                <Campo rot="Lote B" val={tinta.loteB && `${tinta.loteB} · val. ${tinta.validadeB}`} mono />
              </div>
            )}

            <div className="rolagem-lateral" style={{ maxWidth: '100%' }}>
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
                          {podeEditar
                            ? <input style={S.campo} value={m.especificado ?? ''} onChange={(ev) => editar(ei, mi, 'especificado', ev.target.value)} />
                            : <span style={S.valorFixo}>{m.especificado ?? '—'}</span>}
                          {m.noPapel?.especificado && <div style={S.noPapel}>no papel: {m.noPapel.especificado}</div>}
                        </td>
                        <td style={s.td}>
                          {podeEditar
                            ? <input
                                style={{ ...S.campo, borderColor: r.resultado === 'nao_conforme' ? c.critico : c.linhaForte, color: r.resultado === 'nao_conforme' ? c.critico : c.tinta, fontWeight: r.resultado === 'nao_conforme' ? 700 : 400 }}
                                value={m.encontrado ?? ''} onChange={(ev) => editar(ei, mi, 'encontrado', ev.target.value)}
                              />
                            : <span style={{ ...S.valorFixo, color: r.resultado === 'nao_conforme' ? c.critico : c.tinta, fontWeight: r.resultado === 'nao_conforme' ? 700 : 400 }}>{m.encontrado ?? '—'}</span>}
                          {m.noPapel?.encontrado && <div style={S.noPapel}>no papel: {m.noPapel.encontrado}</div>}
                        </td>
                        <td style={{ ...s.td, ...s.mono, whiteSpace: 'nowrap' }}>
                          {dataBR(m.dataInspecao)}
                          {m.noPapel?.dataInspecao && <div style={S.noPapel}>no papel: {dataBR(m.noPapel.dataInspecao)}</div>}
                        </td>
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
        Unificado com o relatório do cliente. Sem banco ainda — o que mudar aqui vive só nesta sessão.
      </div>
    </div>
  );
}

/* ── A lista ──────────────────────────────────────────────────────────────────────────────── */

/** A entrada da tela: uma linha por ordem de serviço, com o estado dela à vista. Abas serviam
 *  para quatro; para cinquenta, não. Cada linha abre o detalhe inteiro. */
function Lista({ ordens, aoAbrir }: { ordens: OrdemServico[]; aoAbrir: (id: string) => void }) {
  const linhas = ordens.map((o) => {
    const r = resumirOs(o.etapas);
    return { os: o, resumo: r, contra: compararComRelatorio(o).length };
  });

  const liberaveis = linhas.filter((l) => l.resumo.liberavel).length;
  const comProblema = linhas.filter((l) => l.resumo.naoConformes > 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Cabecalho
        titulo="Ordens de Serviço"
        sub={carimboDoPapel('ordem_servico')
          ? `${carimboDoPapel('ordem_servico')} — o código vem da Lista Mestra desta empresa. Abra uma ordem para ver a especificação, as medições e o relatório.`
          : 'Esta empresa ainda não tem um formulário de ordem de serviço cadastrado na Lista Mestra.'}
      />

      <div style={S.contadores}>
        <div style={S.contador}><div style={S.num}>{linhas.length}</div><div style={S.rot}>ordens</div></div>
        <div style={S.contador}><div style={{ ...S.num, color: c.ok }}>{liberaveis}</div><div style={S.rot}>liberáveis</div></div>
        <div style={{ ...S.contador, borderRight: 'none' }}>
          <div style={{ ...S.num, color: comProblema ? c.critico : c.tinta }}>{comProblema}</div>
          <div style={S.rot}>com não conformidade</div>
        </div>
      </div>

      <div style={{ ...s.cartao, overflow: 'hidden' }}>
        {linhas.map(({ os, resumo, contra }, i) => (
          <button
            key={os.id}
            onClick={() => aoAbrir(os.id)}
            style={{ ...S.linha, borderTop: i === 0 ? 'none' : `1px solid ${c.linha}` }}
          >
            <span style={S.linhaFolio}>{os.folio}</span>

            <span style={S.linhaMeio}>
              <span style={S.linhaCliente}>{os.cliente}</span>
              <span style={S.linhaSub}>
                {os.equipamento}
                {os.obra ? ` · ${os.obra}` : ''}
              </span>
            </span>

            <span style={S.linhaSelos}>
              <span style={pastilha(resumo.naoConformes ? 'critico' : resumo.liberavel ? 'ok' : 'alerta')}>
                {resumo.naoConformes
                  ? `${resumo.naoConformes} não conforme${resumo.naoConformes > 1 ? 's' : ''}`
                  : resumo.liberavel ? 'liberável'
                  : `${resumo.pendentes} pendente${resumo.pendentes > 1 ? 's' : ''}`}
              </span>
              {contra > 0 && <span style={pastilha('critico')}>{contra} × RIP</span>}
              {os.ripNumero && <span style={S.linhaRip}>{os.ripNumero}</span>}
            </span>

            <span style={S.seta} aria-hidden>›</span>
          </button>
        ))}
      </div>

      <div style={S.rodape}>
        {linhas.length === 1 ? '1 ordem de serviço' : `${linhas.length} ordens de serviço`}. Clique numa linha para abrir.
      </div>
    </div>
  );
}

/* ── O confronto ──────────────────────────────────────────────────────────────────────────── */

/** O confronto entre a OS e o relatório que saiu dela. É a conferência que hoje depende de
 *  alguém pôr um papel ao lado do outro — aqui ela é do sistema. */
function Confronto({ rel, divergencias }: { rel: Relatorio; divergencias: Divergencia[] }) {
  const graves = divergencias.filter((d) => d.gravidade === 'alta').length;

  return (
    <div style={{ ...s.cartao, overflow: 'hidden' }}>
      <div style={S.faixaConfronto}>
        <span>Confronto com o relatório {rel.numero}</span>
        <span style={pastilha(divergencias.length === 0 ? 'ok' : graves ? 'critico' : 'alerta')}>
          {divergencias.length === 0
            ? 'os dois documentos batem'
            : `${divergencias.length} diferença${divergencias.length > 1 ? 's' : ''}`}
        </span>
      </div>

      <div style={S.relIdent}>
        <Campo rot="Relatório" val={`${rel.numero} · folha ${rel.folha}`} mono />
        <Campo rot="OS que ele declara" val={rel.osReferida} mono />
        <Campo rot="Emitido em" val={dataBR(rel.dataEmissao)} mono />
        <Campo rot="Demãos" val={`${rel.demaos.length}`} />
        <Campo rot="Instrumentos" val={rel.instrumentos.join(' · ')} mono />
        <Campo rot="Resultado" val={rel.resultado === 'aprovado' ? 'Aprovado' : 'Reprovado'} />
      </div>

      {divergencias.length > 0 && (
        <div className="rolagem-lateral" style={{ maxWidth: '100%' }}>
          <table style={s.tabela}>
            <thead>
              <tr>
                <th style={s.th}>Onde</th>
                <th style={{ ...s.th, width: 200 }}>Na ordem de serviço</th>
                <th style={{ ...s.th, width: 200 }}>No relatório do cliente</th>
              </tr>
            </thead>
            <tbody>
              {divergencias.map((d, i) => (
                <tr key={i}>
                  <td style={{ ...s.td, color: c.tinta, fontWeight: 500 }}>
                    {d.onde}
                    {d.nota && <div style={S.notaDiv}>{d.nota}</div>}
                  </td>
                  <td style={{ ...s.td, ...s.mono, color: d.naOs === null ? c.suave : c.tinta }}>
                    {d.naOs === null ? 'em branco' : formatar(d.naOs)}
                  </td>
                  <td style={{ ...s.td, ...s.mono, color: d.gravidade === 'alta' ? c.critico : c.tinta2, fontWeight: d.gravidade === 'alta' ? 700 : 400 }}>
                    {d.noRelatorio === null ? 'em branco' : formatar(d.noRelatorio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={S.soNoRelatorio}>
        <div style={S.tituloBloco}>O que só existe no relatório</div>
        <div className="rolagem-lateral" style={{ maxWidth: '100%' }}>
          <table style={s.tabela}>
            <thead>
              <tr>
                <th style={s.th}>Demão</th>
                <th style={s.th}>Tinta</th>
                <th style={s.th}>Lote A · B</th>
                <th style={s.th}>Ambiente</th>
                <th style={s.th}>Aderência</th>
              </tr>
            </thead>
            <tbody>
              {rel.demaos.map((d) => (
                <tr key={d.ordem}>
                  <td style={{ ...s.td, color: c.tinta, fontWeight: 500 }}>{d.ordem}ª · {dataBR(d.data)}</td>
                  <td style={s.td}>{d.tinta}<div style={S.respSec}>{d.cor} · {d.fabricante}</div></td>
                  <td style={{ ...s.td, ...s.mono, fontSize: 12 }}>
                    {d.loteA} <span style={{ color: c.suave }}>({d.validadeA})</span>
                    <div>{d.loteB} <span style={{ color: c.suave }}>({d.validadeB})</span></div>
                  </td>
                  <td style={{ ...s.td, ...s.mono, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {d.tempAmbiente}°C · {d.umidadeRelativa}%<div style={{ color: c.suave }}>substrato {d.tempSubstrato}°C</div>
                  </td>
                  <td style={s.td}>{d.aderencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={S.normas}>
          {rel.normas.join(' · ')}
          {rel.ressalvas.map((r) => <div key={r} style={{ marginTop: 4 }}>{r}</div>)}
        </div>
      </div>
    </div>
  );
}

/** Data ISO vira data brasileira; o resto passa como está. */
function formatar(v: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? dataBR(v) : v;
}

function Campo({ rot, val, mono }: { rot: string; val: string | null | undefined; mono?: boolean }) {
  const vazio = !val;
  return (
    <div>
      <div style={S.campoRot}>{rot}</div>
      <div style={{ fontSize: 13.5, color: vazio ? c.suave : c.tinta, fontStyle: vazio ? 'italic' : 'normal', fontFamily: mono && !vazio ? fonte.mono : fonte.texto, marginTop: 2 }}>
        {val || 'em branco no papel'}
      </div>
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
  abas: {
    display: 'flex', gap: 6, borderBottom: `1px solid ${c.linha}`, marginBottom: -1,
    maxWidth: '100%', paddingBottom: 1,
  },
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
  voltar: {
    alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0,
    color: c.acento, fontFamily: fonte.texto, fontSize: 13.5, cursor: 'pointer',
  },
  avisoLeitura: {
    display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap',
    padding: '12px 16px', borderRadius: 3,
    background: c.superficie2, border: `1px solid ${c.linhaForte}`,
    fontSize: 13, color: c.tinta2,
  },
  valorFixo: { fontFamily: fonte.mono, fontSize: 13, color: c.tinta, display: 'inline-block', padding: '6px 0' },
  linha: {
    display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
    padding: '14px 18px', border: 'none', background: 'none', cursor: 'pointer',
    fontFamily: fonte.texto,
  },
  linhaFolio: {
    fontFamily: fonte.mono, fontSize: 15, fontWeight: 700, color: c.tinta,
    minWidth: 54, flexShrink: 0,
  },
  linhaMeio: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  linhaCliente: { fontSize: 14, fontWeight: 600, color: c.tinta },
  linhaSub: { fontSize: 12.5, color: c.suave },
  linhaSelos: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  linhaRip: { fontFamily: fonte.mono, fontSize: 11.5, color: c.suave },
  seta: { color: c.suave, fontSize: 20, flexShrink: 0, lineHeight: 1 },
  noPapel: { fontFamily: fonte.mono, fontSize: 10.5, color: c.alerta, marginTop: 4, whiteSpace: 'nowrap' },
  condicoes: {
    marginLeft: 12, fontFamily: fonte.mono, fontSize: 10.5, color: c.suave,
    textTransform: 'none', letterSpacing: 0, fontWeight: 400,
  },
  faixaConfronto: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: '10px 18px', background: c.superficie2, borderBottom: `1px solid ${c.linhaForte}`,
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: c.tinta2,
  },
  relIdent: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14,
    padding: '14px 18px', borderBottom: `1px solid ${c.linha}`,
  },
  notaDiv: { fontSize: 11.5, color: c.suave, marginTop: 4, lineHeight: 1.4, fontWeight: 400 },
  soNoRelatorio: { padding: '16px 18px 14px', borderTop: `1px solid ${c.linhaForte}`, background: c.superficie2 },
  normas: { fontFamily: fonte.mono, fontSize: 11.5, color: c.suave, marginTop: 10, lineHeight: 1.6 },
};
