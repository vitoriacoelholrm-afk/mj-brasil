// Largura da tela, para as decisões de layout que estilo inline não resolve sozinho.
//
// O app é todo em estilo inline, e estilo inline não faz media query. Onde basta o CSS —
// `grid-template-columns: repeat(auto-fit, minmax(...))`, container com rolagem — o inline
// resolve. Onde a estrutura muda de verdade (o cabeçalho que vira duas linhas, o padding que
// encolhe), é preciso saber a largura, e é isso que este gancho dá.
import { useEffect, useState } from 'react';

/** Abaixo disto é celular. É o mesmo corte do base.css, de propósito. */
export const CORTE_CELULAR = 768;

function combina(consulta: string): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.(consulta).matches === true;
}

/** Verdadeiro em tela estreita. Reage ao girar o celular e ao redimensionar a janela. */
export function useEhCelular(corte = CORTE_CELULAR): boolean {
  const consulta = `(max-width: ${corte - 1}px)`;
  const [estreita, setEstreita] = useState(() => combina(consulta));

  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const aoMudar = (e: MediaQueryListEvent | MediaQueryList) => setEstreita(e.matches);
    setEstreita(mq.matches);

    // Safari só passou a aceitar addEventListener em MediaQueryList na versão 14. Em Mac ou
    // iPad mais antigo, sem este desvio, a tela abriria certa e depois não reagiria ao girar.
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', aoMudar);
      return () => mq.removeEventListener('change', aoMudar);
    }
    mq.addListener(aoMudar);
    return () => mq.removeListener(aoMudar);
  }, [consulta]);

  return estreita;
}

/** Verdadeiro em aparelho que se toca com o dedo — celular e tablet.
 *
 *  Serve para decidir se faz sentido oferecer a câmera. Ponteiro grosso é melhor que
 *  largura de tela para isso: tablet deitado é largo e tem câmera atrás; monitor de mesa é
 *  largo e muitas vezes não tem câmera nenhuma. Oferecer "tirar foto" a quem não tem
 *  câmera abre o seletor de arquivos com outro nome, e a pessoa fica procurando o que o
 *  botão prometeu. */
export function useEhToque(): boolean {
  const consulta = '(pointer: coarse)';
  const [toque, setToque] = useState(() => combina(consulta));

  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const aoMudar = (e: MediaQueryListEvent | MediaQueryList) => setToque(e.matches);
    setToque(mq.matches);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', aoMudar);
      return () => mq.removeEventListener('change', aoMudar);
    }
    mq.addListener(aoMudar);
    return () => mq.removeListener(aoMudar);
  }, [consulta]);

  return toque;
}

/** O respiro lateral do conteúdo. No celular o espaço é caro. */
export function margemLateral(celular: boolean): number {
  return celular ? 16 : 28;
}
