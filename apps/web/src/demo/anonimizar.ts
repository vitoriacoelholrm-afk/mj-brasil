// Modo demonstração: o mesmo app, com os nomes trocados.
//
// Não é um fork nem uma tela diferente — é uma TROCA NO DADO, aplicada na hora em que ele é
// carregado. O código que o revisor vê rodando é exatamente o que está no repositório.
//
// Liga com `VITE_DEMO=1` no build. Sem a variável, `seDemo` devolve o valor intacto e nada disso
// entra no caminho normal.
//
// O que é trocado: nome de empresa cliente, nome de obra, nome de pessoa, lote de tinta, número
// de certificado de calibração, referência de esquema do cliente e modelo de equipamento.
// O que NÃO é trocado: marca e nome comercial de tinta (INTERSEAL, Jotun — são produtos de
// catálogo, não dizem nada sobre o cliente) e os códigos de formulário da lista mestra, que são
// justamente o que a tela de Lista Mestra existe para mostrar.

export const EH_DEMO = import.meta.env?.VITE_DEMO === '1';

/** Ordem importa: o mais específico primeiro, senão "WEIR" come "WEIR do Brasil Ltda". */
const TROCAS: [string, string][] = [
  // Empresas clientes da empresa atendida
  ['WEIR do Brasil Ltda', 'Cliente A Indústria Ltda'],
  ['WEIR do Brasil', 'Cliente A Indústria'],
  ['Consórcio Ápia - Real', 'Consórcio Cliente B'],
  ['Consórcio Ápia-Real', 'Consórcio Cliente B'],
  ['AMC Engenharia', 'Cliente C Engenharia'],
  ['AMC/CEMIG', 'CLI-C / Obra 02'],
  ['Obra Samarco', 'Obra 01'],
  ['WEIR', 'CLI-A'],
  ['AMC', 'CLI-C'],

  // A própria empresa atendida
  ['MJ Serviços Industriais Ltda', 'Indústria Alfa Ltda'],
  ['Minasjato', 'Indústria Alfa'],
  ['MJ Brasil', 'Sistema da Qualidade'],
  ['MJ-', 'IA-'],

  // Pessoas
  ['Vitória Coelho Mendes', 'Ana Ribeiro'],
  ['Leandro Santos', 'Carlos Dias'],
  ['Gustavo Moreira', 'Paulo Nunes'],
  ['Emerson William de Faria', 'Marcos Teixeira'],
  ['Edine Garcia', 'Sofia Lima'],

  // Referências de esquema e modelo de equipamento do cliente
  ['PRO.BRA.DPR.008', 'ESQ.CLI-A.004'],
  ['431572-G-CAR-IT0026', 'ESQ-CLI-B-0011'],
  ['CAR-01-2026', 'RIP-B-01-2026'],
  ['250CVX', 'MOD-250'],

  // Lotes de tinta
  ['125120112', '310420881'],
  ['126020105', '310520114'],
  ['126010062', '311010507'],
  ['405325010', '408817223'],
  ['2808676', '311720440'],
  ['2805924', '311720518'],
  ['3357681', '312080963'],
  ['3343296', '312081077'],

  // Instrumento e certificados de calibração
  ['232212', 'MED-01'],
  ['0238/2026', '0917/2026'],
  ['0181-01/26', '0455-03/26'],
  ['M008200/2026', 'C012740/2026'],
  ['M007787/2026', 'C012741/2026'],
  ['M007811/2026', 'C012742/2026'],
  ['171032', '204518'],
];

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const REGRAS: [RegExp, string][] = TROCAS.map(([de, para]) => [new RegExp(escapar(de), 'g'), para]);

/** Troca os termos num texto. Pura — dá para testar sem ligar o modo demo. */
export function texto(s: string): string {
  let saida = s;
  for (const [de, para] of REGRAS) saida = saida.replace(de, para);
  return saida;
}

/** Percorre qualquer estrutura e troca todo texto que encontrar, em qualquer profundidade.
 *  É recursivo de propósito: se amanhã alguém acrescentar um campo novo com nome de cliente
 *  dentro, ele já sai trocado sem ninguém lembrar de atualizar uma lista. */
export function fundo<T>(valor: T): T {
  if (typeof valor === 'string') return texto(valor) as T;
  if (Array.isArray(valor)) return valor.map(fundo) as T;
  if (valor && typeof valor === 'object') {
    const saida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor)) saida[k] = fundo(v);
    return saida as T;
  }
  return valor;
}

/** Aplica a troca só no build de demonstração. Fora dele, devolve o mesmo objeto. */
export function seDemo<T>(valor: T): T {
  return EH_DEMO ? fundo(valor) : valor;
}

/** Sobrou algum termo real? Serve de trava no teste e de conferência antes de publicar. */
export function vazamentos(texto: string): string[] {
  return TROCAS.map(([de]) => de).filter((de) => texto.includes(de));
}

export { TROCAS };
