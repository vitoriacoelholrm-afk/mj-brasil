// O MANUAL — a norma como índice navegável do sistema.
//
// Duas telas numa: a árvore das sete seções, e a cláusula aberta. Clicar numa cláusula mostra
// tudo que ela tem na empresa — documento, tela de registro, o que a norma pede e ainda falta, e
// como o diagnóstico a avaliou.
//
// É a tela que o auditor pede sem pedir: ele diz "me mostre a 8.5.3" e alguém sai abrindo pasta.
// Aqui a resposta é um clique, e é calculada do que já existe — o manual não guarda nada próprio,
// porque guardar seria criar um quinto lugar para divergir dos outros quatro.
import { useCallback, useEffect, useState } from 'react';
import type { ContextoDeTela } from '@/plataforma/modulo';
import { AVALIACAO_ROTULO, type Avaliacao } from '@/modules/sgq-documentos/diagnostico/vocabulario';
import { NATUREZA_ROTULO } from '@/plataforma/documentos';
import { exclusoesAtivas } from '@/plataforma/empresa';
import { exclusaoDe, seAplica } from '@/plataforma/aplicabilidade';
import { podeAnexarEmDocumento } from '@/plataforma/acesso';
import { empresaAtiva } from '@/plataforma/empresa';
import { papelAtual, pessoaAtual } from '@/lib/session';
import { listarArquivos, type ArquivoDeDocumento } from '@/modules/sgq-documentos/arquivos';
import { ArquivosDoDocumento } from './ArquivosDoDocumento';
import { CLAUSULAS, SECOES, clausulasDaSecao } from '../norma';
import { quantosEspecificos, relacionadosDa } from '../relacionados';
import { clausulasEscritas, manualDaEmpresa } from '../texto';
import { TextoDaClausula, resumoDoManual } from './TextoDaClausula';
import { ModelosDeFormulario } from './ModeloDeFormulario';
import { Cabecalho } from '@/ui/Cabecalho';
import { c, dataBR, fonte, pastilha, s } from '@/ui/estilo';
import { useEhCelular } from '@/ui/tela';

const TOM_DA_AVALIACAO: Record<Avaliacao, 'ok' | 'alerta' | 'critico' | 'neutro'> = {
  atende: 'ok',
  atende_parcial: 'alerta',
  nao_atende: 'critico',
  nao_aplicavel: 'neutro',
};

export function Manual({ irPara, modulos, instalados }: ContextoDeTela) {
  const [aberta, setAberta] = useState<string | null>(null);
  const celular = useEhCelular();

  if (aberta) {
    return (
      <Clausula
        ref_={aberta} modulos={modulos} instalados={instalados}
        irPara={irPara} aoVoltar={() => setAberta(null)}
      />
    );
  }

  // A norma é a mesma para todo cliente; o ESCOPO não é. O que a empresa declarou não aplicável
  // (§4.3) sai das contagens — cobrar documento próprio de um requisito que ela já excluiu por
  // escrito é inventar uma pendência. Da TELA ele não sai: a exclusão é informação documentada, e
  // é justamente o que o auditor pede para ler.
  const exclusoes = exclusoesAtivas();
  const doEscopo = CLAUSULAS.filter((x) => seAplica(x.ref, exclusoes));
  const soNoManual = doEscopo.filter((x) => quantosEspecificos(x.ref, modulos) === 0).length;
  const manual = manualDaEmpresa();
  const escritas = new Set(clausulasEscritas());
  const semTexto = CLAUSULAS.filter((x) => !escritas.has(x.ref)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Cabecalho
        titulo="Manual"
        sub="A ISO 9001:2015 inteira, cláusula por cláusula. Clique numa delas para ler o que a empresa escreveu no manual e ver o que responde por ela: documento, onde se registra, e o que a norma ainda pede."
      />

      <div style={S.resumo}>
        {manual && (
          <span style={pastilha(semTexto ? 'alerta' : 'ok')}>
            {semTexto
              ? `${CLAUSULAS.length - semTexto} de ${CLAUSULAS.length} descritas no ${manual.codigo}`
              : `as ${CLAUSULAS.length} cláusulas descritas no ${manual.codigo}`}
          </span>
        )}
        <span style={pastilha(soNoManual ? 'alerta' : 'ok')}>
          {soNoManual
            ? `${soNoManual} sem documento próprio`
            : 'todas com documento próprio'}
        </span>
        {exclusoes.length > 0 && (
          <span style={pastilha('neutro')}>
            {exclusoes.length === 1
              ? `${exclusoes[0].clausula} não se aplica`
              : `${exclusoes.length} cláusulas não se aplicam`}
          </span>
        )}
        <span style={{ ...s.prosa, fontSize: 13, color: c.suave }}>
          São duas perguntas diferentes, e o auditor faz as duas. A primeira é o que a empresa DIZ
          que faz — está no manual, e agora se lê aqui, em cada cláusula. A segunda é QUAL
          procedimento, QUAL formulário, QUAL registro sustenta o que o manual diz. Nas marcadas
          com "sem documento próprio", a segunda resposta ainda é o manual de novo.
        </span>
        {exclusoes.length > 0 && (
          <span style={{ ...s.prosa, fontSize: 13, color: c.suave }}>
            {exclusoes.length === 1 ? 'Uma cláusula está' : `${exclusoes.length} cláusulas estão`} fora
            do escopo por decisão da empresa, com justificativa declarada — a não aplicabilidade da
            §4.3. {exclusoes.length === 1 ? 'Ela continua' : 'Elas continuam'} na lista, porque é
            documentado que se apresenta ao auditor, mas {exclusoes.length === 1 ? 'não entra' : 'não entram'} nas
            contagens acima. As contas são sobre as {doEscopo.length} que a empresa precisa atender.
          </span>
        )}
      </div>

      {SECOES.map((secao) => (
        <div key={secao.numero} style={{ ...s.cartao, overflow: 'hidden' }}>
          <div style={S.faixa}>
            <span style={S.faixaNumero}>{secao.numero}</span>
            <span>{secao.titulo}</span>
          </div>
          <div style={{ ...S.resumoSecao, ...s.prosa }}>{secao.resumo}</div>
          <div>
            {clausulasDaSecao(secao.numero).map((x, i) => {
              const quantos = quantosEspecificos(x.ref, modulos);
              const excluida = exclusaoDe(x.ref, exclusoes);
              return (
                <button
                  key={x.ref}
                  onClick={() => setAberta(x.ref)}
                  style={{
                    ...S.linha,
                    borderTop: `1px solid ${c.linha}`,
                    gridTemplateColumns: celular ? 'auto 1fr' : 'auto 1fr auto auto',
                    ...(i === 0 ? {} : {}),
                  }}
                >
                  <span style={S.ref}>{x.ref}</span>
                  <span style={S.titulo}>
                    {x.titulo}
                    {/* O resumo do que o manual diz, na própria lista: quem procura a cláusula
                        reconhece o texto antes de abrir. */}
                    {manual && (
                      <span style={S.resumoClausula}>
                        {escritas.has(x.ref)
                          ? resumoDoManual(x.ref, celular ? 80 : 150)
                          : `sem texto no ${manual.codigo}`}
                      </span>
                    )}
                  </span>
                  {!celular && (
                    excluida
                      ? <span style={pastilha('neutro')}>não se aplica</span>
                      : (
                        <span style={quantos ? pastilha('neutro') : pastilha('alerta')}>
                          {quantos === 0 ? 'só pelo manual' : `${quantos} ${quantos === 1 ? 'documento' : 'documentos'}`}
                        </span>
                      )
                  )}
                  {!celular && <span style={S.seta} aria-hidden>›</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── A cláusula aberta ────────────────────────────────────────────────────────────────────── */

function Clausula({ ref_, modulos, instalados, irPara, aoVoltar }: {
  ref_: string; modulos: ContextoDeTela['modulos']; instalados: ContextoDeTela['instalados'];
  irPara: ContextoDeTela['irPara']; aoVoltar: () => void;
}) {
  const r = relacionadosDa(ref_, modulos, instalados);
  const excluida = exclusaoDe(ref_, exclusoesAtivas());
  const empresa = empresaAtiva();
  const podeAnexar = podeAnexarEmDocumento(papelAtual(), empresa.modo);

  // O acervo vem de uma vez para a cláusula inteira, e não um pedido por documento: uma cláusula
  // chega a listar meia dúzia deles, e seis idas ao servidor para desenhar seis linhas é o tipo
  // de coisa que só aparece quando o acervo cresce.
  const [arquivos, setArquivos] = useState<Map<string, ArquivoDeDocumento[]>>(new Map());
  const [recarga, setRecarga] = useState(0);
  const recarregar = useCallback(() => setRecarga((n) => n + 1), []);

  useEffect(() => {
    let vivo = true;
    listarArquivos(empresa.id)
      .then((m) => { if (vivo) setArquivos(m); })
      // Falhar aqui não pode derrubar a cláusula: o acervo é acréscimo, e o que ela responde
      // primeiro — o texto do manual e quais documentos declaram a cláusula — não depende dele.
      .catch(() => { if (vivo) setArquivos(new Map()); });
    return () => { vivo = false; };
  }, [empresa.id, recarga]);

  if (!r) return <div style={S.vazio}>Cláusula não encontrada.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={aoVoltar} style={S.voltar}>← Todas as cláusulas</button>

      <Cabecalho
        titulo={`${r.clausula.ref} — ${r.clausula.titulo}`}
        sub={`ISO 9001:2015 · seção ${r.clausula.secao}${r.modulos.length ? ` · atendida por ${r.modulos.map((m) => m.nome).join(', ')}` : ''}`}
        acao={excluida
          ? <span style={pastilha('neutro')}>não se aplica</span>
          : r.avaliacao
            ? <span style={pastilha(TOM_DA_AVALIACAO[r.avaliacao])}>{AVALIACAO_ROTULO[r.avaliacao]}</span>
            : <span style={pastilha('neutro')}>não avaliada</span>}
      />

      {/* Antes de tudo, quando é o caso: esta cláusula não é requisito desta empresa. Sem isto, a
          tela mostraria "nenhum documento declara esta cláusula" e pareceria falta — quando é
          decisão de escopo, tomada e assinada. */}
      {excluida && (
        <div style={{ ...s.cartao, overflow: 'hidden' }}>
          <div style={S.faixa}>Requisito não aplicável a esta empresa</div>
          <div style={S.exclusao}>
            <span style={{ ...s.prosa, fontSize: 14, color: c.tinta }}>{excluida.justificativa}</span>
            <span style={S.itemNota}>
              Declarada em {excluida.declaradaEm}
              {excluida.desde ? ` · desde ${dataBR(excluida.desde)}` : ''} · ISO 9001:2015 §4.3
            </span>
            <span style={{ ...S.itemNota, ...s.prosa }}>
              A cláusula continua à vista de propósito: a norma admite não aplicar um requisito, mas
              exige que a decisão esteja documentada e justificada — é este texto que o auditor pede
              para ler. O que ela deixa de ser é cobrança: não entra na conta das que precisam de
              documento próprio, e o sistema não pede registro por ela.
            </span>
          </div>
        </div>
      )}

      {/* Primeiro o que a empresa DIZ que faz — é a pergunta que o auditor faz antes de qualquer
          outra. A lista de documentos vem depois, que é a prova. */}
      <TextoDaClausula ref_={r.clausula.ref} />

      {/* Numa cláusula excluída, os blocos vazios só aparecem se tiverem o que mostrar. O texto de
          "nenhum documento declara" e "ainda não tem tela" descreve uma falta — e aqui não há
          falta nenhuma: há um requisito que a empresa não precisa atender. */}
      <Bloco
        titulo="Documentos da empresa"
        vazio="Nenhum documento da lista mestra declara esta cláusula. Pode haver um que a atenda sem dizer — e, para a auditoria, documento que não declara a cláusula não conta."
        ocultarSeVazio={!!excluida}
      >
        {r.documentos.map((d) => (
          <div key={d.codigo} style={S.item}>
            <span style={S.codigo}>{d.codigo}</span>
            <span style={S.itemCorpo}>
              <span style={S.itemTitulo}>{d.titulo}</span>
              <span style={S.itemNota}>
                {NATUREZA_ROTULO[d.natureza]}
                {d.revisao ? ` · rev. ${d.revisao}` : ' · sem revisão'}
                {d.emissao ? ` · ${dataBR(d.emissao)}` : ''}
                {d.responsavel ? ` · ${d.responsavel}` : ''}
              </span>
              <ArquivosDoDocumento
                perfil={empresa.id}
                codigo={d.codigo}
                revisaoNaLista={d.revisao}
                arquivos={arquivos.get(d.codigo) ?? []}
                podeAnexar={podeAnexar}
                quem={pessoaAtual()?.nome ?? null}
                aoMudar={recarregar}
              />
            </span>
          </div>
        ))}
      </Bloco>

      {/* O modelo em branco antes das telas: o auditor pede para VER o formulário muito mais vezes
          do que pede para abrir um registro preenchido. */}
      <ModelosDeFormulario defs={r.formularios} />

      <Bloco
        titulo="Onde se registra"
        vazio="Esta cláusula ainda não tem tela no sistema. O que ela pede, se acontece, é registrado fora daqui."
        ocultarSeVazio={!!excluida}
      >
        {r.telas.map(({ tela, modulo }) => (
          <button key={tela.rota} style={{ ...S.item, ...S.itemClicavel }} onClick={() => irPara(tela.rota)}>
            <span style={S.codigo}>{modulo.nome}</span>
            <span style={S.itemCorpo}>
              <span style={S.itemTitulo}>{tela.rotulo}</span>
              <span style={S.itemNota}>abrir a tela</span>
            </span>
            <span style={S.seta} aria-hidden>›</span>
          </button>
        ))}
      </Bloco>

      {!excluida && r.faltando.length > 0 && (
        <div style={{ ...s.cartao, borderColor: c.alerta, background: c.alertaFraco, overflow: 'hidden' }}>
          <div style={{ ...S.faixa, background: 'transparent', color: c.alerta, borderBottom: `1px solid ${c.alerta}` }}>
            O que a norma pede e ainda não existe
          </div>
          <div style={{ padding: '4px 18px 16px' }}>
            {r.faltando.map((f) => (
              <div key={f.chave} style={S.item}>
                <span style={S.codigo}>{f.codigoSugerido}</span>
                <span style={S.itemCorpo}>
                  <span style={S.itemTitulo}>{f.titulo}</span>
                  {f.comoAtender && <span style={{ ...S.itemNota, ...s.prosa }}>{f.comoAtender}</span>}
                </span>
                <span style={pastilha(f.retencao === 'reter' ? 'critico' : 'neutro')}>
                  {f.retencao === 'reter' ? 'reter' : 'manter'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Bloco({ titulo, vazio, children, ocultarSeVazio }: {
  titulo: string; vazio: string; children: React.ReactNode; ocultarSeVazio?: boolean;
}) {
  const temAlgo = Array.isArray(children) ? children.length > 0 : !!children;
  if (!temAlgo && ocultarSeVazio) return null;
  return (
    <div style={{ ...s.cartao, overflow: 'hidden' }}>
      <div style={S.faixa}>{titulo}</div>
      {temAlgo
        ? <div style={{ padding: '4px 18px 14px' }}>{children}</div>
        : <div style={{ ...S.vazio, ...s.prosa }}>{vazio}</div>}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  resumo: {
    display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap',
    padding: '12px 16px', borderRadius: 3,
    background: c.superficie2, border: `1px solid ${c.linhaForte}`,
  },
  faixa: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 18px', background: c.superficie2, borderBottom: `1px solid ${c.linhaForte}`,
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: c.tinta2,
  },
  faixaNumero: {
    fontFamily: fonte.mono, fontSize: 13, fontWeight: 700, color: c.acento,
    background: c.acentoFraco, border: `1px solid ${c.acentoMarca}`,
    borderRadius: 3, padding: '1px 7px', letterSpacing: 0,
  },
  resumoSecao: { fontSize: 13, color: c.suave, lineHeight: 1.6, padding: '12px 18px 12px' },
  linha: {
    display: 'grid', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
    padding: '11px 18px', border: 'none', background: 'none', cursor: 'pointer',
    fontFamily: fonte.texto,
  },
  ref: { fontFamily: fonte.mono, fontSize: 12.5, fontWeight: 700, color: c.tinta2, minWidth: 42 },
  titulo: { fontSize: 14, color: c.tinta, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 },
  resumoClausula: {
    fontSize: 12, color: c.suave, lineHeight: 1.5,
    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
  } as React.CSSProperties,
  seta: { color: c.suave, fontSize: 20, lineHeight: 1 },
  vazio: { fontSize: 13.5, color: c.suave, lineHeight: 1.6, padding: '16px 18px' },
  exclusao: { display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 18px 16px' },
  item: {
    display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%', textAlign: 'left',
    padding: '10px 0', borderBottom: `1px solid ${c.linha}`,
    background: 'none', border: 'none', borderBottomStyle: 'solid', fontFamily: fonte.texto,
  },
  itemClicavel: { cursor: 'pointer' },
  codigo: { fontFamily: fonte.mono, fontSize: 12, fontWeight: 700, color: c.tinta2, minWidth: 80, flexShrink: 0, paddingTop: 2 },
  itemCorpo: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 },
  itemTitulo: { fontSize: 14, color: c.tinta },
  itemNota: { fontSize: 12, color: c.suave, lineHeight: 1.5 },
  voltar: {
    alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0,
    color: c.acento, fontFamily: fonte.texto, fontSize: 13.5, cursor: 'pointer',
  },
};
