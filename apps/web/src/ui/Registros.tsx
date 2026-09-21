// A tela de QUALQUER formulário declarado por qualquer módulo.
//
// Não é a tela da propriedade do cliente nem a do controle de mudanças: é a tela de QUALQUER um
// deles. Acrescentar um formulário novo passa a ser acrescentar uma definição — e é assim que os
// onze da lista mestra vão entrando, um a um, sem escrever onze telas.
//
// Vale a mesma regra de acesso do resto: quem confere não preenche.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  campoVisivel, faltaFoto, pendencias, resumoDoRegistro, valoresIniciais,
  type CampoDef, type FormularioDef, type Registro, type Valores,
} from '@/plataforma/formularios';
import type { Anexo } from '@/plataforma/anexos';
import { Anexos } from '@/ui/Anexos';
import { carimboDoPapel } from '@/modules/sgq-documentos/listaMestra';
import { abrirFormularioEmJanela } from '@/ui/folhaImpressa';
import { motivoDoBloqueio, podeEditar } from '@/plataforma/acesso';
import { EQUIPE, papelAtual, pessoaAtual } from '@/lib/session';
import { conteudoDoAnexo, criarRegistro, listarRegistros } from '@/lib/registrosApi';
import { usarDados } from '@/lib/usarDados';
import { c, dataBR, fonte, pastilha, s } from '@/ui/estilo';
import { useEhCelular } from '@/ui/tela';
import { Cabecalho } from '@/ui/Cabecalho';

export function Registros({ def, painel }: {
  def: FormularioDef;
  /** O que o setor tem de próprio, calculado sobre os registros já feitos. A portaria soma o
   *  pátio; outro setor somará outra coisa. A tela não precisa saber qual — por isso recebe a
   *  função em vez de conhecer o setor. */
  painel?: (registros: Registro[]) => ReactNode;
}) {
  const lista = usarDados<Registro[]>(() => listarRegistros(def.papel), [def.papel]);
  const registros = lista.dados ?? [];
  const [rascunho, setRascunho] = useState<Valores | null>(null);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [aberto, setAberto] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroAoSalvar, setErroAoSalvar] = useState<string | null>(null);

  const papel = papelAtual();
  // Quem pode preencher depende do SETOR do formulário, não da ordem de serviço: a ficha de
  // treinamento é do RH, e quem toca a OS não entra nela.
  const editavel = podeEditar(papel, def.setor);
  const bloqueio = motivoDoBloqueio(papel, def.setor);
  const selo = carimboDoPapel(def.papel);
  const celular = useEhCelular();

  const faltando = useMemo(
    () => (rascunho ? pendencias(def, rascunho) : []),
    [def, rascunho],
  );
  // Foto que falta trava igual a campo que falta: há fato que texto nenhum prova.
  const semFoto = rascunho ? faltaFoto(def, anexos) : null;
  const travado = faltando.length > 0 || semFoto !== null;

  async function salvar() {
    if (!rascunho || travado || salvando) return;
    setSalvando(true);
    setErroAoSalvar(null);
    try {
      await criarRegistro(def.papel, rascunho, anexos, pessoaAtual()?.nome ?? null);
      // Só limpa a tela depois que o banco confirmou. Limpar antes daria a impressão de gravado
      // e perderia o que a pessoa digitou — no portão, com o caminhão esperando, isso não se
      // recupera de memória.
      setRascunho(null);
      setAnexos([]);
      lista.recarregar();
    } catch (e) {
      setErroAoSalvar((e as Error)?.message ?? 'não foi possível gravar');
    } finally {
      setSalvando(false);
    }
  }

  const emAberto = registros.find((r) => r.id === aberto) ?? null;

  /** O registro novo já vem com o que o sistema sabe — data, hora, quem está registrando. */
  function abrirRascunho() {
    setRascunho(valoresIniciais(def, pessoaAtual()?.nome ?? null));
    setAnexos([]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Cabecalho
        titulo={def.titulo}
        sub={`${selo ? `${selo} · ` : ''}ISO 9001:2015 §${def.clausula} — ${def.explicacao}`}
        acao={editavel && !rascunho && !emAberto
          ? <button style={s.botaoPrimario} onClick={abrirRascunho}>Novo registro</button>
          : undefined}
      />

      {!selo && (
        <div style={S.aviso}>
          Esta empresa ainda não tem este formulário cadastrado na lista mestra. O registro funciona,
          mas sai sem código — e documento sem código não é pedido nem retido. Cadastre-o no perfil
          dela.
        </div>
      )}

      {bloqueio && (
        <div style={S.aviso}>
          <span style={pastilha('neutro')}>consulta</span>{' '}
          <span style={s.prosa}>{bloqueio}</span>
        </div>
      )}

      {lista.erro && (
        <div style={{ ...S.aviso, borderColor: c.critico, color: c.critico }}>
          Não foi possível carregar os registros: {lista.erro}
        </div>
      )}

      {rascunho && (
        <Formulario
          def={def} valores={rascunho} faltando={faltando} celular={celular}
          semFoto={semFoto} travado={travado} salvando={salvando} erro={erroAoSalvar}
          anexos={def.anexos ? anexos : null} porQuem={pessoaAtual()?.nome ?? null}
          aoMudar={(chave, valor) => setRascunho((v) => ({ ...v, [chave]: valor }))}
          aoAnexar={(novos) => setAnexos((v) => [...v, ...novos])}
          aoAlterarAnexo={(id, campo, valor) =>
            setAnexos((v) => v.map((a) => (a.id === id ? { ...a, [campo]: valor } : a)))}
          aoRemoverAnexo={(id) => setAnexos((v) => v.filter((a) => a.id !== id))}
          aoSalvar={salvar}
          aoCancelar={() => { setRascunho(null); setAnexos([]); }}
        />
      )}

      {emAberto && (
        <Visualizacao def={def} registro={emAberto} celular={celular} aoVoltar={() => setAberto(null)} />
      )}

      {!rascunho && !emAberto && lista.carregando && lista.dados === null && (
        <div style={{ ...s.cartao, padding: '22px', ...S.vazio }}>Carregando os registros…</div>
      )}

      {!rascunho && !emAberto && lista.dados !== null && (
        <>
          {painel?.(registros)}
          <Lista def={def} registros={registros} aoAbrir={setAberto} editavel={editavel} celular={celular} />
        </>
      )}
    </div>
  );
}

/* ── A lista ──────────────────────────────────────────────────────────────────────────────── */

function Lista({
  def, registros, aoAbrir, editavel, celular,
}: {
  def: FormularioDef; registros: Registro[]; aoAbrir: (id: string) => void; editavel: boolean;
  celular: boolean;
}) {
  if (registros.length === 0) {
    return (
      <div style={{ ...s.cartao, padding: '28px 22px' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: c.tinta, marginBottom: 8 }}>
          Nenhum registro ainda
        </div>
        <div style={{ ...S.vazio, ...s.prosa }}>
          {editavel
            ? 'Quando acontecer, é aqui que fica. Um registro em branco não é problema — problema é o fato acontecer e não ter onde registrar, que era o caso até agora.'
            : 'Quando quem responde pelo setor registrar uma ocorrência, ela aparece aqui.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...s.cartao, overflow: 'hidden' }}>
      {registros.map((r, i) => (
        <button
          key={r.id}
          onClick={() => aoAbrir(r.id)}
          style={{
            ...S.linha,
            borderTop: i === 0 ? 'none' : `1px solid ${c.linha}`,
            // No celular a linha vira duas: data e autor em cima, o resumo embaixo ocupando a
            // largura toda. Em três colunas num aparelho de 375px sobra uma coluna do meio de
            // dois dedos, e "Entrada · Peça de cliente · Cliente tal" desce em quatro linhas.
            ...(celular ? { display: 'grid', gridTemplateColumns: 'auto 1fr auto', rowGap: 3 } : null),
          }}
        >
          <span style={S.linhaData}>{dataBR(r.criadoEm)}</span>
          {celular
            ? <>
                <span style={{ ...S.linhaAutor, textAlign: 'right' }}>{r.criadoPor}</span>
                <span style={S.seta} aria-hidden>›</span>
                <span style={{ ...S.linhaResumo, gridColumn: '1 / -1' }}>
                  {resumoDoRegistro(def, r.valores)}
                </span>
              </>
            : <>
                <span style={S.linhaResumo}>{resumoDoRegistro(def, r.valores)}</span>
                <span style={S.linhaAutor}>{r.criadoPor}</span>
                <span style={S.seta} aria-hidden>›</span>
              </>}
        </button>
      ))}
    </div>
  );
}

/* ── O formulário ─────────────────────────────────────────────────────────────────────────── */

function Formulario({
  def, valores, faltando, celular, semFoto, travado, salvando, erro, anexos, porQuem,
  aoMudar, aoAnexar, aoAlterarAnexo, aoRemoverAnexo, aoSalvar, aoCancelar,
}: {
  def: FormularioDef;
  valores: Valores;
  faltando: CampoDef[];
  celular: boolean;
  semFoto: string | null;
  travado: boolean;
  salvando: boolean;
  /** O que o banco respondeu quando recusou. Fica na tela com o rascunho intacto. */
  erro: string | null;
  /** Null quando a definição não pede anexo — o bloco simplesmente não aparece. */
  anexos: Anexo[] | null;
  porQuem: string | null;
  aoMudar: (chave: string, valor: string) => void;
  aoAnexar: (novos: Anexo[]) => void;
  aoAlterarAnexo: (id: string, campo: 'legenda' | 'comentario', valor: string) => void;
  aoRemoverAnexo: (id: string) => void;
  aoSalvar: () => void;
  aoCancelar: () => void;
}) {
  const visiveis = def.campos.filter((campo) => campoVisivel(campo, valores));

  return (
    <div style={{ ...s.cartao, overflow: 'hidden' }}>
      <div style={S.faixa}>Novo registro</div>

      <div style={{ ...S.grade, gridTemplateColumns: celular ? '1fr' : 'repeat(auto-fit,minmax(260px,1fr))' }}>
        {visiveis.map((campo) => (
          <Campo
            key={campo.chave}
            campo={campo}
            valor={valores[campo.chave] ?? ''}
            faltando={faltando.includes(campo)}
            largo={campo.tipo === 'texto_longo'}
            aoMudar={(v) => aoMudar(campo.chave, v)}
          />
        ))}
      </div>

      {anexos && def.anexos && (
        <Anexos
          anexos={anexos} podeAnexar titulo={def.anexos.titulo} vazio={def.anexos.vazio}
          porQuem={porQuem}
          aoAdicionar={aoAnexar} aoAlterar={aoAlterarAnexo} aoRemover={aoRemoverAnexo}
        />
      )}

      <div style={S.acoes}>
        <button
          style={travado || salvando ? { ...s.botao, opacity: 0.55, cursor: 'not-allowed' } : s.botaoPrimario}
          onClick={aoSalvar}
          disabled={travado || salvando}
        >
          {salvando ? 'Gravando…' : 'Salvar registro'}
        </button>
        <button style={s.botao} onClick={aoCancelar} disabled={salvando}>Cancelar</button>
        {(faltando.length > 0 || semFoto) && (
          <span style={S.faltando}>
            {faltando.length > 0 && (
              <>
                Falta preencher: {faltando.map((f) => f.rotulo).join(', ')}.
                {' '}São os campos exigidos pela ISO 9001:2015 §{def.clausula}.
              </>
            )}
            {faltando.length > 0 && semFoto ? ' ' : ''}
            {semFoto}
          </span>
        )}
        {erro && (
          <span style={{ ...S.faltando, color: c.critico }}>
            Não gravou: {erro}. O que você preencheu continua aí — tente de novo.
          </span>
        )}
      </div>
    </div>
  );
}

function Campo({
  campo, valor, faltando, largo, aoMudar,
}: {
  campo: CampoDef; valor: string; faltando: boolean; largo: boolean; aoMudar: (v: string) => void;
}) {
  const borda = faltando ? c.alerta : c.linhaForte;

  return (
    <div style={largo ? { gridColumn: '1 / -1' } : undefined}>
      <label style={S.rotulo}>
        {campo.rotulo}
        {campo.obrigatorio && <span style={{ color: c.critico }}> *</span>}
      </label>

      {campo.tipo === 'texto_longo' ? (
        <textarea
          style={{ ...s.campo, borderColor: borda, minHeight: 72, resize: 'vertical' }}
          value={valor} onChange={(e) => aoMudar(e.target.value)}
        />
      ) : campo.tipo === 'escolha' || campo.tipo === 'sim_nao' ? (
        <select
          style={{ ...s.campo, borderColor: borda }}
          value={valor} onChange={(e) => aoMudar(e.target.value)}
        >
          <option value="">—</option>
          {(campo.tipo === 'sim_nao' ? ['Sim', 'Não'] : campo.opcoes ?? []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : campo.tipo === 'pessoa' ? (
        <select
          style={{ ...s.campo, borderColor: borda }}
          value={valor} onChange={(e) => aoMudar(e.target.value)}
        >
          <option value="">—</option>
          {EQUIPE.map((p) => <option key={p.id} value={p.nome}>{p.nome} — {p.cargo}</option>)}
        </select>
      ) : (
        // `time` em vez de texto livre: no celular abre o relógio do aparelho, e o valor sai
        // sempre no mesmo formato. Hora digitada à mão vinha como 7h40, 07:40 e 0740 — três
        // grafias do mesmo instante, e nenhuma delas ordena.
        <input
          type={campo.tipo === 'data' ? 'date' : campo.tipo === 'hora' ? 'time' : 'text'}
          style={{ ...s.campo, borderColor: borda }}
          value={valor} onChange={(e) => aoMudar(e.target.value)}
        />
      )}

      {campo.ajuda && <div style={S.ajuda}>{campo.ajuda}</div>}
    </div>
  );
}

/* ── Um registro aberto ───────────────────────────────────────────────────────────────────── */

function Visualizacao({
  def, registro, celular, aoVoltar,
}: {
  def: FormularioDef; registro: Registro; celular: boolean; aoVoltar: () => void;
}) {
  const preenchidos = def.campos.filter((campo) => registro.valores[campo.chave]?.trim());
  const temAnexo = registro.anexos.length > 0;

  // A lista traz a ficha dos anexos, não os bytes. É aqui — quando alguém abre UM registro — que
  // as imagens vêm. Enquanto não chegam, o bloco já aparece com nome, legenda e observação; o que
  // falta é só a miniatura.
  const [comImagem, setComImagem] = useState<Anexo[]>(registro.anexos);
  const [bloqueado, setBloqueado] = useState(false);
  useEffect(() => {
    let vivo = true;
    setComImagem(registro.anexos);
    void (async () => {
      const cheios = await Promise.all(registro.anexos.map(async (a) => (
        a.url ? a : { ...a, url: await conteudoDoAnexo(a.id).catch(() => null) }
      )));
      if (vivo) setComImagem(cheios);
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registro.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={aoVoltar} style={S.voltar}>← Todos os registros</button>

      <div style={{ ...s.cartao, overflow: 'hidden' }}>
        <div style={S.faixa}>
          <span>Registro de {dataBR(registro.criadoEm)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: c.suave, fontWeight: 400 }}>
              por {registro.criadoPor ?? '—'}
            </span>
            {/* As fotos entram na folha quando já carregaram — por isso `comImagem`, e não
                `registro.anexos`. Imprimir antes de chegarem sai com a lista dos anexos e sem as
                miniaturas, que é melhor do que travar o botão esperando. */}
            <button
              style={S.imprimir}
              title="Abre este registro numa janela própria, pronto para imprimir ou salvar em PDF"
              onClick={() => setBloqueado(!abrirFormularioEmJanela(def, { ...registro, anexos: comImagem }))}
            >
              Abrir em janela
            </button>
          </span>
        </div>

        {bloqueado && (
          <div style={{ ...S.bloqueado, ...s.prosa }}>
            O navegador bloqueou a janela. Libere os pop-ups para este endereço e clique de novo —
            a janela é uma página do próprio sistema, não um site de fora.
          </div>
        )}

        <div style={{ ...S.grade, gridTemplateColumns: celular ? '1fr' : 'repeat(auto-fit,minmax(240px,1fr))' }}>
          {preenchidos.map((campo) => (
            <div key={campo.chave} style={campo.tipo === 'texto_longo' ? { gridColumn: '1 / -1' } : undefined}>
              <div style={S.rotuloLeitura}>{campo.rotulo}</div>
              <div style={S.valorLeitura}>
                {campo.tipo === 'data' ? dataBR(registro.valores[campo.chave]) : registro.valores[campo.chave]}
              </div>
            </div>
          ))}
        </div>

        {temAnexo && (
          <Anexos
            anexos={comImagem} podeAnexar={false}
            titulo={def.anexos?.titulo ?? 'Evidência anexada'}
            aoAdicionar={() => {}} aoAlterar={() => {}} aoRemover={() => {}}
          />
        )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  faixa: {
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12,
    padding: '10px 18px', background: c.superficie2, borderBottom: `1px solid ${c.linhaForte}`,
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: c.tinta2,
  },
  grade: { display: 'grid', gap: 16, padding: '18px' },
  imprimir: {
    padding: '4px 10px', cursor: 'pointer',
    fontFamily: fonte.texto, fontSize: 11.5, fontWeight: 600, color: c.acento,
    textTransform: 'none', letterSpacing: 0,
    background: c.superficie, border: `1px solid ${c.linhaForte}`, borderRadius: 3,
  },
  bloqueado: {
    fontSize: 12.5, color: c.alerta, lineHeight: 1.6, margin: '12px 18px 0',
    padding: '9px 12px', borderRadius: 3,
    background: c.alertaFraco, border: `1px solid ${c.alerta}`,
    textTransform: 'none', letterSpacing: 0, fontWeight: 400,
  },
  rotulo: {
    display: 'block', fontSize: 11, letterSpacing: '.07em', textTransform: 'uppercase',
    color: c.suave, fontWeight: 600, marginBottom: 5,
  },
  ajuda: { fontSize: 11.5, color: c.suave, marginTop: 5, lineHeight: 1.5 },
  acoes: {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    padding: '14px 18px', borderTop: `1px solid ${c.linha}`, background: c.superficie2,
  },
  faltando: { fontSize: 12.5, color: c.alerta, flex: 1, minWidth: 220, lineHeight: 1.5 },
  aviso: {
    display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap',
    padding: '12px 16px', borderRadius: 3,
    background: c.superficie2, border: `1px solid ${c.linhaForte}`,
    fontSize: 13, color: c.tinta2, lineHeight: 1.55,
  },
  vazio: { fontSize: 13.5, color: c.suave, lineHeight: 1.6 },
  linha: {
    display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
    padding: '13px 18px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: fonte.texto,
  },
  linhaData: { fontFamily: fonte.mono, fontSize: 12.5, color: c.suave, flexShrink: 0 },
  linhaResumo: { fontSize: 14, color: c.tinta, flex: 1, minWidth: 0 },
  linhaAutor: { fontSize: 12, color: c.suave, flexShrink: 0 },
  seta: { color: c.suave, fontSize: 20, flexShrink: 0, lineHeight: 1 },
  voltar: {
    alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0,
    color: c.acento, fontFamily: fonte.texto, fontSize: 13.5, cursor: 'pointer',
  },
  rotuloLeitura: { fontSize: 10.5, letterSpacing: '.07em', textTransform: 'uppercase', color: c.suave, fontWeight: 600 },
  valorLeitura: { fontSize: 14, color: c.tinta, marginTop: 3, lineHeight: 1.5 },
  rodape: { fontFamily: fonte.mono, fontSize: 11.5, color: c.suave, lineHeight: 1.6 },
};
