// Uma tela para qualquer formulário declarado em `plataforma/formularios.ts`.
//
// Não é a tela da propriedade do cliente nem a do controle de mudanças: é a tela de QUALQUER um
// deles. Acrescentar um formulário novo passa a ser acrescentar uma definição — e é assim que os
// onze da lista mestra vão entrando, um a um, sem escrever onze telas.
//
// Vale a mesma regra de acesso do resto: quem confere não preenche.
import { useMemo, useState } from 'react';
import {
  campoVisivel, pendencias, resumoDoRegistro,
  type CampoDef, type FormularioDef, type Registro, type Valores,
} from '@/plataforma/formularios';
import { carimboDoPapel } from '@/documentos/listaMestra';
import { motivoDoBloqueio, podeEditar } from '@/plataforma/acesso';
import { EQUIPE, papelAtual, pessoaAtual } from '@/lib/session';
import { c, dataBR, fonte, pastilha, s } from '@/ui/estilo';
import { useEhCelular } from '@/ui/tela';
import { Cabecalho } from './Vencimentos';

export function Registros({ def }: { def: FormularioDef }) {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [rascunho, setRascunho] = useState<Valores | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);

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

  function salvar() {
    if (!rascunho || faltando.length > 0) return;
    setRegistros((todos) => [
      {
        id: `r-${Date.now()}`,
        papel: def.papel,
        valores: rascunho,
        criadoEm: new Date().toISOString().slice(0, 10),
        criadoPor: pessoaAtual()?.nome ?? null,
      },
      ...todos,
    ]);
    setRascunho(null);
  }

  const emAberto = registros.find((r) => r.id === aberto) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Cabecalho
        titulo={def.titulo}
        sub={`${selo ? `${selo} · ` : ''}ISO 9001:2015 §${def.clausula} — ${def.explicacao}`}
        acao={editavel && !rascunho && !emAberto
          ? <button style={s.botaoPrimario} onClick={() => setRascunho({})}>Novo registro</button>
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

      {rascunho && (
        <Formulario
          def={def} valores={rascunho} faltando={faltando} celular={celular}
          aoMudar={(chave, valor) => setRascunho((v) => ({ ...v, [chave]: valor }))}
          aoSalvar={salvar}
          aoCancelar={() => setRascunho(null)}
        />
      )}

      {emAberto && (
        <Visualizacao def={def} registro={emAberto} celular={celular} aoVoltar={() => setAberto(null)} />
      )}

      {!rascunho && !emAberto && (
        <Lista def={def} registros={registros} aoAbrir={setAberto} editavel={editavel} />
      )}

      <div style={S.rodape}>
        Sem banco ainda — o que for registrado aqui vive só nesta sessão.
      </div>
    </div>
  );
}

/* ── A lista ──────────────────────────────────────────────────────────────────────────────── */

function Lista({
  def, registros, aoAbrir, editavel,
}: {
  def: FormularioDef; registros: Registro[]; aoAbrir: (id: string) => void; editavel: boolean;
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
          style={{ ...S.linha, borderTop: i === 0 ? 'none' : `1px solid ${c.linha}` }}
        >
          <span style={S.linhaData}>{dataBR(r.criadoEm)}</span>
          <span style={S.linhaResumo}>{resumoDoRegistro(def, r.valores)}</span>
          <span style={S.linhaAutor}>{r.criadoPor}</span>
          <span style={S.seta} aria-hidden>›</span>
        </button>
      ))}
    </div>
  );
}

/* ── O formulário ─────────────────────────────────────────────────────────────────────────── */

function Formulario({
  def, valores, faltando, celular, aoMudar, aoSalvar, aoCancelar,
}: {
  def: FormularioDef;
  valores: Valores;
  faltando: CampoDef[];
  celular: boolean;
  aoMudar: (chave: string, valor: string) => void;
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

      <div style={S.acoes}>
        <button
          style={faltando.length ? { ...s.botao, opacity: 0.55, cursor: 'not-allowed' } : s.botaoPrimario}
          onClick={aoSalvar}
          disabled={faltando.length > 0}
        >
          Salvar registro
        </button>
        <button style={s.botao} onClick={aoCancelar}>Cancelar</button>
        {faltando.length > 0 && (
          <span style={S.faltando}>
            Falta preencher: {faltando.map((f) => f.rotulo).join(', ')}.
            {' '}São os campos exigidos pela ISO 9001:2015 §{def.clausula}.
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
        <input
          type={campo.tipo === 'data' ? 'date' : 'text'}
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={aoVoltar} style={S.voltar}>← Todos os registros</button>

      <div style={{ ...s.cartao, overflow: 'hidden' }}>
        <div style={S.faixa}>
          <span>Registro de {dataBR(registro.criadoEm)}</span>
          <span style={{ fontSize: 11.5, color: c.suave, fontWeight: 400 }}>
            por {registro.criadoPor ?? '—'}
          </span>
        </div>
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
