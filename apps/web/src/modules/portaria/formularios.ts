// O formulário da portaria — a definição do livro de entrada e saída de cargas.
//
// Mora aqui, e não na plataforma, porque nem toda empresa certificada tem portão. A plataforma
// sabe DESENHAR qualquer formulário; quais existem é o módulo que diz.
import type { FormularioDef } from '@/plataforma/formularios';
/* ══ Portaria — entrada e saída de cargas ════════════════════════════════════════════════════
   A norma não exige um livro de portaria. Exige duas coisas que passam por ele:

     · 8.5.3 — peça de cliente que chega avariada tem de ser relatada e registrada;
     · 8.5.4 — o que sai tem de sair preservado, e dá para provar quando saiu e com quem.

   Por isso este registro NÃO substitui o controle de recebimento nem o romaneio: aqueles
   inspecionam a carga, este registra o veículo passando pelo portão. São fatos diferentes, e
   juntá-los faria a portaria assinar uma inspeção que ela não fez.

   O campo de estado aparente existe pelo mesmo motivo: a portaria não inspeciona, mas é a
   primeira pessoa a ver a peça. Avaria vista no portão e não registrada vira discussão sobre
   quem amassou.                                                                                */

export const CONTROLE_CARGAS: FormularioDef = {
  papel: 'controle_cargas',
  setor: 'portaria',
  titulo: 'Entrada e Saída de Cargas',
  clausula: '8.5.3 e 8.5.4',
  explicacao:
    'O que passou pelo portão: em que sentido, quando, em que veículo e com quem. É o registro da portaria, não a inspeção da carga — quem confere o que chegou é o recebimento.',
  campos: [
    {
      chave: 'sentido', rotulo: 'Sentido', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Entrada', 'Saída'],
    },
    { chave: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true, preenchidoCom: 'hoje' },
    { chave: 'hora', rotulo: 'Hora', tipo: 'hora', obrigatorio: true, preenchidoCom: 'agora', ajuda: 'Vem do relógio ao abrir o registro. Corrija se estiver lançando uma passagem de antes.' },
    {
      chave: 'tipo', rotulo: 'O que é a carga', tipo: 'escolha', obrigatorio: true,
      opcoes: [
        // As três do cliente vêm juntas e primeiro: é o caso que a norma cobra, e o caminhão
        // costuma trazer peça e tinta do cliente na mesma viagem.
        'Peça de cliente', 'Matéria-prima ou insumo do cliente', 'Peças e insumos do cliente',
        'Matéria-prima ou insumo da empresa', 'Produto acabado', 'Resíduo', 'Equipamento', 'Outro',
      ],
      ajuda: 'De quem é a carga importa tanto quanto o que ela é: o que pertence ao cliente entra na 8.5.3, venha como peça ou como lata de tinta.',
    },
    { chave: 'parte', rotulo: 'Cliente, fornecedor ou destinatário', tipo: 'texto', obrigatorio: true },
    { chave: 'documento', rotulo: 'Documento', tipo: 'texto', ajuda: 'Nota fiscal, romaneio ou ordem de coleta que acompanha a carga.' },
    { chave: 'os', rotulo: 'Ordem de serviço', tipo: 'texto', ajuda: 'Quando a carga é peça de cliente, é o que liga o portão ao serviço.' },
    { chave: 'volumes', rotulo: 'Volumes', tipo: 'texto', ajuda: 'Quantidade e tipo: 12 tubos, 3 paletes, 1 caçamba.' },

    { chave: 'transportadora', rotulo: 'Transportadora', tipo: 'texto' },
    { chave: 'placa', rotulo: 'Placa do veículo', tipo: 'texto', obrigatorio: true },
    { chave: 'motorista', rotulo: 'Motorista', tipo: 'texto', obrigatorio: true },

    {
      chave: 'estado', rotulo: 'Estado aparente', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Íntegra', 'Avaria aparente'],
      dependeDe: { campo: 'tipo', valor: [
        'Peça de cliente', 'Matéria-prima ou insumo do cliente', 'Peças e insumos do cliente',
      ] },
      ajuda: 'Vale para tudo que é do cliente, peça ou insumo. A portaria não inspeciona, mas é quem vê primeiro — avaria aparente aqui abre uma ocorrência de propriedade do cliente (§8.5.3).',
    },
    { chave: 'descricaoAvaria', rotulo: 'O que se viu', tipo: 'texto_longo', obrigatorio: true, dependeDe: { campo: 'estado', valor: 'Avaria aparente' }, ajuda: 'Onde e como. Sem isto, daqui a uma semana ninguém sabe se a avaria veio de fora ou aconteceu dentro.' },
    { chave: 'avisou', rotulo: 'Avisou quem', tipo: 'texto', obrigatorio: true, dependeDe: { campo: 'estado', valor: 'Avaria aparente' }, ajuda: 'A quem da empresa a portaria comunicou na hora.' },

    { chave: 'registradoPor', rotulo: 'Registrado por', tipo: 'pessoa', obrigatorio: true, preenchidoCom: 'quem_registra' },
    { chave: 'observacoes', rotulo: 'Observações', tipo: 'texto_longo' },
  ],
  anexos: {
    titulo: 'Fotos da carga',
    vazio: 'A foto do que entrou ou saiu. É o que nenhum campo de texto prova: como a carga estava, quantos volumes eram, o estado da peça ao passar pelo portão. A legenda diz o que a foto mostra; a observação fica no registro interno.',
    minimoDeFotos: 1,
  },
};
