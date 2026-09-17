// O PAINEL DA PORTARIA — o que o livro de entrada e saída responde depois de somado.
//
// A tela de registros é a mesma de todos os outros formulários, e continua sendo. O que a
// portaria tem de próprio é isto: a pergunta da §8.5.3 — o que é do cliente e está aqui dentro
// agora — respondida pela conta sobre o que já foi registrado, e não por mais um campo para
// alguém preencher.
//
// Três blocos, e a ordem é a da urgência de quem olha:
//
//   · O PÁTIO — quem entrou e não saiu. É a custódia, e é o que se confere no fim do turno.
//   · A PONTA SOLTA — propriedade do cliente que entrou sem OS. Nunca vai fechar par.
//   · A AVARIA — o que o portão viu chegar machucado, esperando a ocorrência de outro setor.
//
// Os dois últimos só aparecem quando existem. Bloco de problema vazio todo dia ensina a não ler
// bloco de problema.
import type { Registro } from '@/plataforma/formularios';
import { hojeLocal } from '@/plataforma/formularios';
import { avariasVistas, diasNoPatio, movimentoDoDia, noPatio, semRastro } from '@/plataforma/portaria';
import { c, dataBR, fonte, pastilha, s } from '@/ui/estilo';

export function PainelDaPortaria({ registros }: { registros: Registro[] }) {
  if (registros.length === 0) return null;

  const hoje = hojeLocal();
  const dentro = noPatio(registros);
  const soltas = semRastro(registros);
  const avarias = avariasVistas(registros);
  const { entradas, saidas } = movimentoDoDia(registros, hoje);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ ...s.cartao, overflow: 'hidden' }}>
        <div style={S.faixa}>
          <span>No pátio agora</span>
          <span style={S.turno}>
            Hoje: {entradas.length} {entradas.length === 1 ? 'entrada' : 'entradas'}
            {' e '}{saidas.length} {saidas.length === 1 ? 'saída' : 'saídas'}
          </span>
        </div>

        {dentro.length === 0 ? (
          <div style={S.vazio}>
            Nada do cliente em custódia: toda propriedade de cliente que entrou já tem saída
            registrada com a mesma ordem de serviço.
          </div>
        ) : (
          <>
            <div style={S.contagem}>
              <span style={S.numero}>{dentro.length}</span>
              <span style={S.numeroTexto}>
                {dentro.length === 1 ? 'carga de cliente' : 'cargas de cliente'} sob custódia da
                empresa — entraram e não saíram.
              </span>
            </div>
            <div>
              {dentro.map((r) => {
                const dias = diasNoPatio(r, hoje);
                return (
                  <div key={r.id} style={S.linha}>
                    <span style={S.os}>{r.valores.os}</span>
                    <span style={S.corpo}>
                      <span style={S.parte}>{r.valores.parte}</span>
                      <span style={S.detalhe}>
                        {r.valores.tipo}
                        {r.valores.volumes ? ` · ${r.valores.volumes}` : ''}
                        {' · entrou em '}{dataBR(r.valores.data)} às {r.valores.hora}
                      </span>
                    </span>
                    {dias !== null && (
                      <span style={pastilha(dias >= 30 ? 'alerta' : 'neutro')}>
                        {dias === 0 ? 'hoje' : dias === 1 ? '1 dia' : `${dias} dias`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {soltas.length > 0 && (
        <Pendencia
          tom="alerta"
          titulo={`${soltas.length} ${soltas.length === 1 ? 'entrada de cliente sem ordem de serviço' : 'entradas de cliente sem ordem de serviço'}`}
          explicacao="Sem a OS não há como ligar a entrada à saída: estas cargas não entram na conta do pátio e nunca vão fechar par. Quando a OS sair, é ela que fecha o rastro."
          registros={soltas}
        />
      )}

      {avarias.length > 0 && (
        <Pendencia
          tom="critico"
          titulo={`${avarias.length} ${avarias.length === 1 ? 'avaria vista no portão' : 'avarias vistas no portão'}`}
          explicacao="O portão não inspeciona — viu primeiro. Avaria em propriedade do cliente abre uma ocorrência de §8.5.3, que é de quem responde pela ordem de serviço: comunicar ao cliente e reter o registro. Enquanto não abrir, a foto do portão é a única prova de que a peça já chegou assim."
          registros={avarias}
        />
      )}
    </div>
  );
}

function Pendencia({
  tom, titulo, explicacao, registros,
}: {
  tom: 'alerta' | 'critico'; titulo: string; explicacao: string; registros: Registro[];
}) {
  const borda = tom === 'critico' ? c.critico : c.alerta;
  const fundo = tom === 'critico' ? c.criticoFraco : c.alertaFraco;

  return (
    <div style={{ ...s.cartao, borderColor: borda, background: fundo, overflow: 'hidden' }}>
      <div style={{ ...S.faixa, background: 'transparent', borderBottom: `1px solid ${borda}`, color: borda }}>
        {titulo}
      </div>
      <div style={{ ...S.vazio, ...s.prosa, paddingBottom: 4 }}>{explicacao}</div>
      <div style={{ padding: '0 18px 14px' }}>
        {registros.map((r) => (
          <div key={r.id} style={S.pendenciaLinha}>
            <span style={S.data}>{dataBR(r.valores.data)} {r.valores.hora}</span>
            <span style={S.corpo}>
              <span style={S.parte}>{r.valores.parte}</span>
              <span style={S.detalhe}>
                {r.valores.tipo}
                {r.valores.placa ? ` · placa ${r.valores.placa}` : ''}
                {r.valores.descricaoAvaria ? ` · ${r.valores.descricaoAvaria}` : ''}
                {r.valores.avisou ? ` · avisou ${r.valores.avisou}` : ''}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  faixa: {
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12,
    flexWrap: 'wrap',
    padding: '10px 18px', background: c.superficie2, borderBottom: `1px solid ${c.linhaForte}`,
    fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: c.tinta2,
  },
  turno: { fontFamily: fonte.mono, fontSize: 11.5, fontWeight: 400, letterSpacing: 0, textTransform: 'none', color: c.suave },
  vazio: { fontSize: 13.5, color: c.suave, lineHeight: 1.6, padding: '16px 18px' },
  contagem: { display: 'flex', alignItems: 'baseline', gap: 12, padding: '16px 18px 14px', flexWrap: 'wrap' },
  numero: { fontFamily: fonte.mono, fontSize: 34, fontWeight: 700, color: c.tinta, lineHeight: 1 },
  numeroTexto: { fontSize: 13.5, color: c.tinta2, lineHeight: 1.5, flex: 1, minWidth: 200 },
  linha: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '11px 18px', flexWrap: 'wrap',
    borderTop: `1px solid ${c.linha}`,
  },
  pendenciaLinha: { display: 'flex', alignItems: 'baseline', gap: 14, padding: '7px 0', flexWrap: 'wrap' },
  os: { fontFamily: fonte.mono, fontSize: 12.5, fontWeight: 700, color: c.tinta2, flexShrink: 0 },
  data: { fontFamily: fonte.mono, fontSize: 12, color: c.suave, flexShrink: 0 },
  corpo: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 200 },
  parte: { fontSize: 14, color: c.tinta },
  detalhe: { fontSize: 12, color: c.suave, lineHeight: 1.5 },
};
