// A PORTA — um item de menu que abre uma lista de telas, em vez de uma tela.
//
// O que ela resolve: consulta ocupando espaço de rotina. Manual e lista mestra, para quem executa
// o serviço, valem uma visita por semana e custavam duas linhas da coluna todo dia.
//
// A porta NÃO É UM MENU DENTRO DO MENU. Ela é uma tela como qualquer outra, com endereço próprio,
// e o que mostra são as telas de verdade — cada uma com o nome pelo qual a pessoa a procura e uma
// linha do que há lá dentro. Quem chega aqui já sabe o que quer; o trabalho da tela é levar em um
// clique e sair da frente.
import type { Modulo, Rota } from '@/plataforma/modulo';
import type { PortaDeMenu } from '@/plataforma/menu';
import { c, s } from '@/ui/estilo';
import { Aviso, Cabecalho } from '@/ui/Cabecalho';

export function Porta({ porta, modulos, irPara }: {
  porta: PortaDeMenu;
  /** Os módulos que ESTE usuário enxerga. A porta só abre o que a permissão já liberou — ela
   *  reorganiza a coluna, não contorna o acesso. */
  modulos: Modulo[];
  irPara: (rota: Rota) => void;
}) {
  const telas = porta.telas
    .map((rota) => {
      for (const m of modulos) {
        const t = m.telas.find((x) => x.rota === rota);
        if (t) return { rotulo: t.rotulo, rota: t.rota, descricao: m.descricao };
      }
      return null;
    })
    .filter((x): x is { rotulo: string; rota: Rota; descricao: string } => x !== null);

  return (
    <div>
      <Cabecalho titulo={porta.rotulo} sub={porta.sub} />

      {/* Acontece de verdade: a empresa que não instalou o módulo não tem a tela, e a porta fica
          vazia. Dizer é melhor do que mostrar uma lista em branco. */}
      {telas.length === 0 && <Aviso texto="Nada aqui para o seu acesso." />}

      <div style={S.grade}>
        {telas.map((t) => (
          <button key={t.rota} style={S.cartao} onClick={() => irPara(t.rota)}>
            <span style={S.rotulo}>{t.rotulo}</span>
            <span style={S.descricao}>{t.descricao}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  grade: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 },
  cartao: {
    ...s.cartao,
    display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start',
    padding: '18px 20px', textAlign: 'left', cursor: 'pointer',
    font: 'inherit', color: 'inherit',
  },
  rotulo: { fontSize: 16, fontWeight: 600, color: c.tinta, letterSpacing: '-.01em' },
  descricao: { fontSize: 13.5, color: c.suave, lineHeight: 1.45 },
};
