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
  // editáveis — o conjunto do papel de inspeção, que desde 21/09/2026 é o papel de quem executa
  // E confere: os dois eram separados e ela os uniu, porque aqui é a mesma gente.
  { id: '00000000-0000-4000-9000-000000000003', nome: 'Gustavo Moreira', cargo: 'PCC', papel: 'inspecao' },
  // Gerente de Produção. Ela corrigiu o cargo em 17/09/2026 e disse que ele fica com a função
  // de produção e mantém a ordem de serviço e o RIP — o papel não muda, o nome do posto sim.
  { id: '00000000-0000-4000-9000-000000000004', nome: 'Emerson William de Faria', cargo: 'Gerente de Produção', papel: 'inspecao' },
  { id: '00000000-0000-4000-9000-000000000005', nome: 'Edine Garcia', cargo: 'Financeiro e RH', papel: 'apoio' },
  // Portaria. Um posto só, uma tela só: entrada e saída de cargas.
  { id: '00000000-0000-4000-9000-000000000006', nome: 'Roberta Patrocínio', cargo: 'Portaria', papel: 'portaria' },
  // Quem faz a migração do banco, pela BraMex. Não é da empresa atendida — entra aqui porque a
  // entrada de desenvolvimento é esta lista, e sai daqui junto com ela quando a autenticação de
  // verdade chegar.
  //
  // Papel de COORDENAÇÃO DA QUALIDADE, que é o assento da consultoria: é o que enxerga mais sem
  // escrever em registro de cliente nenhum. Não existe papel que abra tudo, e isso é de projeto:
  // registros de pessoas são só do RH e suprimentos só do apoio, por decisão dela — e cada uma
  // dessas exclusividades tem teste. Para ver esses dois setores, ele entra como Edine Garcia; a
  // senha é a mesma para todo mundo enquanto não há banco.
  { id: '00000000-0000-4000-9000-000000000007', nome: 'Adrian Bazbaz', cargo: 'Suporte técnico — BraMex', papel: 'coordenacao_qualidade' },
];

/* ── Entrada por usuário e senha ───────────────────────────────────────────────────────────── */

/** A senha, igual para todos, ATÉ O BANCO ENTRAR.
 *
 *  Está aqui à vista e é para estar: senha em código é senha pública, e escondê-la num arquivo de
 *  ambiente daria a impressão de segredo onde não há nenhum. O que protege este app hoje não é
 *  esta constante — é o middleware do `vite dev`, que só aceita a sessão com ALLOW_DEV_LOGIN=true
 *  e na própria máquina.
 *
 *  Quando a autenticação real entrar, é `autenticar` que muda, e só ela: a tela pede usuário e
 *  senha do mesmo jeito, e o resto do app não sabe a diferença. */
export const SENHA_PROVISORIA = '123456';

/** Sem acento, sem caixa e sem espaço sobrando. Quem digita "vitoria" às pressas entra. */
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Quem é esta pessoa, ou null quando usuário e senha não fecham.
 *
 *  Devolve NULL nos dois casos — usuário inexistente e senha errada. Dizer qual dos dois falhou
 *  transforma a tela de entrada numa lista de quem trabalha na empresa, que é justamente o que
 *  ela não deve ser. */
export function autenticar(usuario: string, senha: string): Pessoa | null {
  if (senha !== SENHA_PROVISORIA) return null;

  const alvo = normalizar(usuario);
  if (!alvo) return null;

  const porNomeInteiro = EQUIPE.find((p) => normalizar(p.nome) === alvo);
  if (porNomeInteiro) return porNomeInteiro;

  // O primeiro nome serve quando não há dúvida. Havendo duas Marias, nenhuma entra por "maria" —
  // entrar como a pessoa errada é pior do que não entrar.
  const porPrimeiroNome = EQUIPE.filter((p) => normalizar(p.nome).split(' ')[0] === alvo);
  return porPrimeiroNome.length === 1 ? porPrimeiroNome[0] : null;
}

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
