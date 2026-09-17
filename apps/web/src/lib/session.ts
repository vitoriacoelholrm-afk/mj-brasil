// Sessão de desenvolvimento — a contraparte cliente do middleware em vite.config.ts.
//
// Guarda apenas o id da membership escolhida e o envia no header x-dev-membership. Não é
// autenticação: não há senha, não há token, e o servidor só aceita o header quando roda em
// `vite dev` com ALLOW_DEV_LOGIN=true. Existe para o app ser utilizável enquanto a autenticação
// de verdade (Supabase para o escritório, PIN para o galpão) não é decidida.
//
// Quando a autenticação real entrar, este arquivo sai inteiro e lib/trpc.ts volta a ler só a
// sessão do Supabase.

import type { Papel } from '@/plataforma/acesso';

const CHAVE = 'mj.dev.membership';

export interface Pessoa {
  id: string;
  nome: string;
  /** O nome que a empresa dá ao posto. Aparece na tela. */
  cargo: string;
  /** O papel que decide o acesso. Cargo é rótulo; papel é regra. */
  papel: Papel;
}

/** A equipe, conforme ela corrigiu em 17/09/2026 olhando a tela de entrada.
 *
 *  O cargo é o nome do posto e muda de empresa para empresa. O papel é a regra de acesso e
 *  é o mesmo em qualquer uma — ver `plataforma/acesso.ts`. Quando os dois divergem, quem
 *  manda no acesso é o papel. */
export const EQUIPE: Pessoa[] = [
  { id: '00000000-0000-4000-9000-000000000001', nome: 'Vitória Coelho Mendes', cargo: 'Coordenadora da Qualidade', papel: 'coordenacao_qualidade' },
  { id: '00000000-0000-4000-9000-000000000002', nome: 'Leandro Santos', cargo: 'Diretor', papel: 'direcao' },
  // PCC. Ela pediu explicitamente que ele tenha a ordem de serviço E o relatório de inspeção
  // editáveis — que é exatamente o conjunto do papel de inspeção. Era `execucao`, que edita a
  // OS e NÃO emite relatório; por isso mudou de papel, não só de cargo.
  { id: '00000000-0000-4000-9000-000000000003', nome: 'Gustavo Moreira', cargo: 'PCC', papel: 'inspecao' },
  // Gerente de Produção. Ela corrigiu o cargo em 17/09/2026 e disse que ele fica com a função
  // de produção e mantém a ordem de serviço e o RIP — o papel não muda, o nome do posto sim.
  { id: '00000000-0000-4000-9000-000000000004', nome: 'Emerson William de Faria', cargo: 'Gerente de Produção', papel: 'inspecao' },
  { id: '00000000-0000-4000-9000-000000000005', nome: 'Edine Garcia', cargo: 'Financeiro e RH', papel: 'apoio' },
];

/** O papel de quem está usando o app agora. Sem sessão, o mínimo: só consulta. */
export function papelAtual(): Papel {
  return pessoaAtual()?.papel ?? 'coordenacao_qualidade';
}

export function membershipAtual(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null; // navegador com armazenamento bloqueado
  }
}

export function pessoaAtual(): Pessoa | null {
  const id = membershipAtual();
  return id ? EQUIPE.find((p) => p.id === id) ?? null : null;
}

export function entrar(id: string) {
  try {
    localStorage.setItem(CHAVE, id);
  } catch {
    /* segue sem persistir */
  }
}

export function sair() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* nada a fazer */
  }
}
