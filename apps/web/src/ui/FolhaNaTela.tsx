// A FOLHA DESENHADA DENTRO DO SISTEMA — o plano B de quando a janela não abre.
//
// A janela própria é melhor: dá para abrir várias e comparar, e o Ctrl+P sai limpo. Mas ela
// depende de o navegador deixar abrir pop-up, e há três casos em que não deixa — o painel do
// Claude, o celular, e o Chrome de quem bloqueou pop-ups um dia e esqueceu.
//
// Nesses casos a folha aparece por cima da tela, num iframe. É o MESMO desenho: a folha não sabe
// onde está sendo mostrada. Imprimir chama o print do próprio iframe, que é o que faz sair só a
// folha — sem menu, sem cabeçalho do sistema, sem a barra desta sobreposição.
import { useEffect, useRef } from 'react';
import { c, fonte, s } from '@/ui/estilo';

export function FolhaNaTela({ html, aoFechar }: { html: string; aoFechar: () => void }) {
  const quadro = useRef<HTMLIFrameElement>(null);

  // Esc fecha. Numa sobreposição que cobre a tela inteira, é o primeiro que a pessoa tenta.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar(); };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  function imprimir() {
    const janela = quadro.current?.contentWindow;
    if (!janela) return;
    janela.focus();
    janela.print();
  }

  return (
    <div style={S.fundo} role="dialog" aria-label="Folha para impressão">
      <div style={S.barra}>
        <span style={S.aviso}>
          A janela separada foi bloqueada pelo navegador — a folha está aqui. É a mesma, e imprime
          igual.
        </span>
        <button style={s.botaoPrimario} onClick={imprimir}>Imprimir ou salvar em PDF</button>
        <button style={s.botao} onClick={aoFechar}>Fechar</button>
      </div>
      <iframe ref={quadro} srcDoc={html} title="Folha" style={S.quadro} />
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  fundo: {
    position: 'fixed', inset: 0, zIndex: 900,
    display: 'flex', flexDirection: 'column', background: 'rgba(20,20,20,.55)',
  },
  barra: {
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    padding: '10px 14px', background: c.superficie, borderBottom: `1px solid ${c.linhaForte}`,
  },
  aviso: { flex: 1, minWidth: 200, fontSize: 12.5, color: c.suave, lineHeight: 1.5, fontFamily: fonte.texto },
  quadro: { flex: 1, width: '100%', border: 'none', background: '#fff' },
};
