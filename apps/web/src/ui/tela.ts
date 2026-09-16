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
    const aoMudar = (e: MediaQueryListEvent) => setEstreita(e.matches);
    setEstreita(mq.matches);
    mq.addEventListener('change', aoMudar);
    return () => mq.removeEventListener('change', aoMudar);
  }, [consulta]);

  return estreita;
}

/** O respiro lateral do conteúdo. No celular o espaço é caro. */
export function margemLateral(celular: boolean): number {
  return celular ? 16 : 28;
}
