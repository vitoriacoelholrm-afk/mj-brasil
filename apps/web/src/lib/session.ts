// Sessão de desenvolvimento — a contraparte cliente do middleware em vite.config.ts.
//
// Guarda apenas o id da membership escolhida e o envia no header x-dev-membership. Não é
// autenticação: não há senha, não há token, e o servidor só aceita o header quando roda em
// `vite dev` com ALLOW_DEV_LOGIN=true. Existe para o app ser utilizável enquanto a autenticação
// de verdade (Supabase para o escritório, PIN para o galpão) não é decidida.
//
// Quando a autenticação real entrar, este arquivo sai inteiro e lib/trpc.ts volta a ler só a
// sessão do Supabase.

const CHAVE = 'mj.dev.membership';

export interface Pessoa {
  id: string;
  nome: string;
  papel: string;
}

/** A equipe conforme as assinaturas dos procedimentos e o questionário RINA. */
export const EQUIPE: Pessoa[] = [
  { id: '00000000-0000-4000-9000-000000000001', nome: 'Vitória Coelho Mendes', papel: 'Coordenadora da Qualidade' },
  { id: '00000000-0000-4000-9000-000000000002', nome: 'Leandro Santos', papel: 'Diretor' },
  { id: '00000000-0000-4000-9000-000000000003', nome: 'Gustavo Moreira', papel: 'Verificação' },
  { id: '00000000-0000-4000-9000-000000000004', nome: 'Emerson William de Faria', papel: 'Inspetor de Pintura N1' },
  { id: '00000000-0000-4000-9000-000000000005', nome: 'Edine Garcia', papel: 'Financeiro' },
];

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
