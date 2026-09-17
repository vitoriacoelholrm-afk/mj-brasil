// O PORTÃO COMO LIVRO, E NÃO COMO DUAS PILHAS DE PAPEL.
//
// Registrar entrada e registrar saída, cada uma por si, dá dois montes de linhas e nenhuma
// resposta. A pergunta que a portaria existe para responder é outra, e é a da norma: o que é do
// cliente e está aqui dentro agora?
//
// A §8.5.3 manda cuidar da propriedade do cliente enquanto ela estiver sob o controle da
// organização. "Enquanto" é um intervalo — começa numa entrada e termina numa saída. Se o
// sistema não fecha esse par, ninguém sabe dizer, num dia qualquer, de quem é o que está no
// pátio. E quem responde de cabeça erra: some uma peça pequena e a falta só aparece quando o
// cliente cobra.
//
// Nada aqui se pergunta a quem está no portão. É tudo calculado dos registros que ele já fez —
// mesma regra do resto do sistema: veredito que se conta é veredito que se discute.
import type { Registro, Valores } from './formularios';

/** Os tipos de carga que são propriedade do cliente. A norma não fala de peça: fala de
 *  propriedade — que chega tanto como estrutura quanto como lata de tinta. */
export const TIPOS_DO_CLIENTE = [
  'Peça de cliente',
  'Matéria-prima ou insumo do cliente',
  'Peças e insumos do cliente',
];

export const ehDoCliente = (v: Valores) => TIPOS_DO_CLIENTE.includes(v.tipo ?? '');

/** A ordem de serviço, normalizada, ou null quando não foi informada.
 *
 *  É a única chave que liga a entrada à saída: a mesma peça entra como peça de cliente e sai
 *  como produto acabado, com nota diferente, veículo diferente e às vezes semanas depois. O que
 *  não muda é a OS. */
export function chaveDaOs(v: Valores): string | null {
  const bruto = (v.os ?? '').trim().toUpperCase().replace(/\s+/g, ' ');
  return bruto === '' ? null : bruto;
}

/** Data e hora num só texto ordenável. Registro sem hora vai para o começo do dia. */
export const momento = (v: Valores) => `${v.data ?? ''}T${v.hora ?? '00:00'}`;

const ehEntrada = (r: Registro) => r.valores.sentido === 'Entrada';
const ehSaida = (r: Registro) => r.valores.sentido === 'Saída';
const porMomento = (a: Registro, b: Registro) => momento(a.valores).localeCompare(momento(b.valores));

/** O que é do cliente, entrou e ainda não saiu — o pátio, em ordem de chegada.
 *
 *  O pareamento é por OS e por contagem: uma obra que entrou em três viagens e saiu em duas tem
 *  uma viagem dentro. Cada saída fecha a entrada aberta mais antiga daquela OS que seja anterior
 *  a ela; saída que chega antes de qualquer entrada não fecha nada, porque fechar seria inventar
 *  um par que não existiu.
 *
 *  Entrada sem OS não entra na conta — não há como pareá-la. Ela aparece em `semRastro`, que é
 *  um problema diferente e se resolve de outro jeito. */
export function noPatio(registros: Registro[]): Registro[] {
  const entradas = registros
    .filter((r) => ehEntrada(r) && ehDoCliente(r.valores) && chaveDaOs(r.valores))
    .sort(porMomento);
  const saidas = registros.filter(ehSaida).sort(porMomento);

  const fechadas = new Set<string>();
  for (const saida of saidas) {
    const os = chaveDaOs(saida.valores);
    if (!os) continue;
    const parceira = entradas.find(
      (e) => !fechadas.has(e.id)
        && chaveDaOs(e.valores) === os
        && momento(e.valores) <= momento(saida.valores),
    );
    if (parceira) fechadas.add(parceira.id);
  }

  return entradas.filter((e) => !fechadas.has(e.id));
}

/** Entrou propriedade do cliente e ninguém anotou a OS.
 *
 *  Não é falta de campo obrigatório: no portão a OS às vezes não existe ainda. É uma ponta solta
 *  — essa carga nunca vai fechar par, e daqui a três meses é a que ninguém explica. */
export function semRastro(registros: Registro[]): Registro[] {
  return registros
    .filter((r) => ehEntrada(r) && ehDoCliente(r.valores) && !chaveDaOs(r.valores))
    .sort(porMomento);
}

/** Avaria vista no portão. O portão não inspeciona — ele viu primeiro, e o que viu abre uma
 *  ocorrência de propriedade do cliente (§8.5.3), que é de outro setor. Aqui fica a lista do que
 *  está esperando essa ocorrência. */
export function avariasVistas(registros: Registro[]): Registro[] {
  return registros
    .filter((r) => r.valores.estado === 'Avaria aparente')
    .sort(porMomento);
}

/** As passagens de um dia, na ordem em que aconteceram. É o que a portaria confere no fim do
 *  turno, e o que se compara com a guarita. */
export function movimentoDoDia(registros: Registro[], dia: string) {
  const doDia = registros.filter((r) => r.valores.data === dia).sort(porMomento);
  return {
    entradas: doDia.filter(ehEntrada),
    saidas: doDia.filter(ehSaida),
  };
}

/** Há quantos dias esta carga está no pátio. Null quando a data não dá para ler. */
export function diasNoPatio(r: Registro, hoje: string): number | null {
  const entrada = Date.parse(`${r.valores.data}T00:00:00`);
  const agora = Date.parse(`${hoje}T00:00:00`);
  if (Number.isNaN(entrada) || Number.isNaN(agora)) return null;
  return Math.max(0, Math.round((agora - entrada) / 86400000));
}
