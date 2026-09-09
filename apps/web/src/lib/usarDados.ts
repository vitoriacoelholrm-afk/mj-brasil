// Hook mínimo de carregamento. O chassis não traz react-query nas dependências do web, e as telas
// precisam de pouco: carregar, mostrar erro, recarregar. Quando react-query entrar, isto sai.
import { useCallback, useEffect, useState } from 'react';

export interface Estado<T> {
  dados: T | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
}

export function usarDados<T>(buscar: () => Promise<T>, deps: unknown[] = []): Estado<T> {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [gatilho, setGatilho] = useState(0);

  const recarregar = useCallback(() => setGatilho((n) => n + 1), []);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    setErro(null);
    buscar()
      .then((r) => { if (vivo) setDados(r); })
      .catch((e) => { if (vivo) setErro((e as Error)?.message ?? 'falha ao carregar'); })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, gatilho]);

  return { dados, carregando, erro, recarregar };
}
