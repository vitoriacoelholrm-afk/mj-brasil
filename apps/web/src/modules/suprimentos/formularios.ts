// SUPRIMENTOS — o que se pede, o que chega e o que sai.
//
// Os três momentos são um caminho só, e é por isso que moram juntos: o pedido comunica o requisito
// ao fornecedor (8.4.3), o recebimento verifica se o que chegou atende (8.4.3 de novo), a avaliação
// mede o fornecedor ao longo do tempo (8.4.1) e o romaneio prova a entrega (8.5.4).
//
// UMA AUSÊNCIA DE PROPÓSITO: não há campo de preço em lugar nenhum.
//
// O que a 8.4 manda controlar é o REQUISITO — o que se pede, a aprovação de produto e método, a
// competência exigida, o desempenho do fornecedor. Preço é dado comercial, e dado comercial dentro
// do sistema da qualidade faz duas coisas ruins: obriga a restringir o acesso de quem precisa
// auditar o processo, e transforma um registro da qualidade em documento de negociação. A mesma
// régua que manteve o faturamento em reais fora dos indicadores vale aqui.
import type { FormularioDef } from '@/plataforma/formularios';

/** O pedido de compra — a 8.4.3 manda comunicar o requisito ANTES, e assegurar a suficiência dele. */
export const PEDIDO_COMPRA: FormularioDef = {
  papel: 'pedido_compra',
  setor: 'suprimentos',
  titulo: 'Pedido de Compra',
  clausula: '8.4',
  explicacao:
    'O que se compra e com qual requisito. A norma não se interessa pelo preço: interessa-se por o requisito ter sido comunicado ao fornecedor antes, e por ele ser suficiente para quem vai receber conferir.',
  campos: [
    { chave: 'numero', rotulo: 'Número do pedido', tipo: 'texto', obrigatorio: true },
    { chave: 'fornecedor', rotulo: 'Fornecedor', tipo: 'texto', obrigatorio: true },
    { chave: 'qualificado', rotulo: 'Fornecedor qualificado?', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Sim', 'Não — compra emergencial', 'Não — fornecedor novo em avaliação'],
      ajuda: 'A 8.4.1 manda aplicar critério de seleção. Comprar de quem não passou pelo critério é possível; o que não pode é acontecer sem ninguém saber.' },
    { chave: 'justificativa', rotulo: 'Justificativa', tipo: 'texto_longo', obrigatorio: true,
      dependeDe: { campo: 'qualificado', valor: ['Não — compra emergencial', 'Não — fornecedor novo em avaliação'] },
      ajuda: 'Por que se comprou assim mesmo, e o que se fez para garantir a conformidade do que chegou.' },

    { chave: 'tipo', rotulo: 'Tipo', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Tinta e insumo de pintura', 'Abrasivo', 'EPI', 'Ferramenta e equipamento', 'Serviço terceirizado', 'Calibração', 'Material de consumo', 'Outro'] },
    { chave: 'itens', rotulo: 'Itens', tipo: 'texto_longo', obrigatorio: true,
      ajuda: 'Descrição, quantidade e unidade. É contra isto que o recebimento vai conferir.' },
    { chave: 'requisitos', rotulo: 'Requisitos comunicados ao fornecedor', tipo: 'texto_longo', obrigatorio: true,
      ajuda: 'Norma técnica, ficha técnica, validade mínima, certificado que deve vir junto. A 8.4.3 pede exatamente isto — e "conforme pedido" não é requisito.' },
    { chave: 'exigeCertificado', rotulo: 'Exige certificado ou laudo?', tipo: 'sim_nao', obrigatorio: true,
      ajuda: 'Tinta, abrasivo e serviço de calibração normalmente exigem. Sem o documento, o recebimento não tem contra o que conferir.' },
    { chave: 'qualCertificado', rotulo: 'Qual certificado', tipo: 'texto', obrigatorio: true,
      dependeDe: { campo: 'exigeCertificado', valor: 'Sim' } },
    { chave: 'exigeCompetencia', rotulo: 'Exige competência ou qualificação de pessoa?', tipo: 'sim_nao', obrigatorio: true,
      ajuda: 'Serviço terceirizado costuma exigir. A 8.4.3 lista a competência entre os requisitos a comunicar.' },
    { chave: 'qualCompetencia', rotulo: 'Qual qualificação', tipo: 'texto', obrigatorio: true,
      dependeDe: { campo: 'exigeCompetencia', valor: 'Sim' } },

    { chave: 'prazo', rotulo: 'Prazo de entrega combinado', tipo: 'data', obrigatorio: true,
      ajuda: 'É contra ele que o atraso do fornecedor se mede na avaliação.' },
    { chave: 'solicitadoEm', rotulo: 'Solicitado em', tipo: 'data', obrigatorio: true, preenchidoCom: 'hoje' },
    { chave: 'solicitadoPor', rotulo: 'Solicitado por', tipo: 'pessoa', obrigatorio: true, preenchidoCom: 'quem_registra' },
    { chave: 'aprovadoPor', rotulo: 'Aprovado por', tipo: 'pessoa', obrigatorio: true,
      ajuda: 'Quem autorizou a compra. Pedido sem aprovação registrada é o achado mais fácil de encontrar numa auditoria de compras.' },
    { chave: 'observacoes', rotulo: 'Observações', tipo: 'texto_longo' },
  ],
  anexos: {
    titulo: 'Pedido enviado, proposta técnica e ficha do produto',
    vazio: 'Sem anexo. O pedido enviado ao fornecedor é a prova de que o requisito foi comunicado antes, e não depois.',
  },
};

/** O recebimento — conferir o que chegou contra o que foi pedido, e decidir o que fazer com o que
 *  não confere. O veredito é CALCULADO pela decisão, não marcado num quadradinho de "conforme". */
export const RECEBIMENTO: FormularioDef = {
  papel: 'recebimento',
  setor: 'suprimentos',
  titulo: 'Recebimento e Inspeção de Entrada',
  clausula: '8.4.3',
  explicacao:
    'O que chegou, conferido contra o que foi pedido. A norma pede a verificação — e pede saber o que se fez quando o material não atendeu, porque é aí que a não conformidade nasce.',
  campos: [
    { chave: 'pedido', rotulo: 'Pedido de compra', tipo: 'texto', obrigatorio: true,
      ajuda: 'O número do pedido. É o que liga o que chegou ao requisito que foi comunicado.' },
    { chave: 'fornecedor', rotulo: 'Fornecedor', tipo: 'texto', obrigatorio: true },
    { chave: 'notaFiscal', rotulo: 'Nota fiscal', tipo: 'texto', obrigatorio: true },
    { chave: 'recebidoEm', rotulo: 'Recebido em', tipo: 'data', obrigatorio: true, preenchidoCom: 'hoje' },
    { chave: 'hora', rotulo: 'Hora', tipo: 'hora', preenchidoCom: 'agora' },

    { chave: 'itens', rotulo: 'O que chegou', tipo: 'texto_longo', obrigatorio: true,
      ajuda: 'Descrição e quantidade recebida. Divergência de quantidade também é não conformidade de fornecimento.' },
    { chave: 'lote', rotulo: 'Lote / validade', tipo: 'texto',
      ajuda: 'Tinta e abrasivo têm lote e validade, e é por eles que a rastreabilidade da 8.5.2 fecha lá na frente.' },

    { chave: 'noPrazo', rotulo: 'Chegou no prazo combinado?', tipo: 'sim_nao', obrigatorio: true },
    { chave: 'quantidadeConfere', rotulo: 'A quantidade confere com o pedido?', tipo: 'sim_nao', obrigatorio: true },
    { chave: 'documentacaoOk', rotulo: 'Veio a documentação exigida?', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Sim', 'Não', 'Não era exigida'],
      ajuda: 'Certificado, laudo, ficha técnica — o que o pedido exigiu.' },
    { chave: 'estadoFisico', rotulo: 'Estado físico do material', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Íntegro', 'Embalagem danificada', 'Material danificado', 'Fora da validade'] },

    { chave: 'decisao', rotulo: 'Decisão', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Aceito', 'Aceito sob concessão', 'Devolvido', 'Segregado para análise'],
      ajuda: 'É esta decisão, e não um campo de "conforme", que diz se o material entrou. "Aceito sob concessão" exige quem autorizou.' },
    { chave: 'quemAutorizou', rotulo: 'Quem autorizou a concessão', tipo: 'pessoa', obrigatorio: true,
      dependeDe: { campo: 'decisao', valor: 'Aceito sob concessão' },
      ajuda: 'A 8.7 manda identificar a autoridade que decide aceitar o que não atende. Sem nome, a concessão não tem dono.' },
    { chave: 'oQueNaoAtendeu', rotulo: 'O que não atendeu', tipo: 'texto_longo', obrigatorio: true,
      dependeDe: { campo: 'decisao', valor: ['Aceito sob concessão', 'Devolvido', 'Segregado para análise'] } },
    { chave: 'abriuNc', rotulo: 'Abriu RNC?', tipo: 'texto',
      dependeDe: { campo: 'decisao', valor: ['Aceito sob concessão', 'Devolvido', 'Segregado para análise'] },
      ajuda: 'O número do RNC. Fornecimento que falha e não vira registro some da avaliação do fornecedor.' },

    { chave: 'recebidoPor', rotulo: 'Recebido por', tipo: 'pessoa', obrigatorio: true, preenchidoCom: 'quem_registra' },
    { chave: 'observacoes', rotulo: 'Observações', tipo: 'texto_longo' },
  ],
  anexos: {
    titulo: 'Nota fiscal, certificado e fotos do material',
    vazio: 'Sem anexo. Material devolvido ou aceito sob concessão pede foto: é o que prova o estado em que chegou.',
  },
};

/** A avaliação do fornecedor — 8.4.1 manda avaliar, selecionar, monitorar o desempenho e reavaliar.
 *  São quatro verbos, e o terceiro é o que costuma faltar: avalia-se na entrada e nunca mais. */
export const AVALIACAO_FORNECEDOR: FormularioDef = {
  papel: 'avaliacao_fornecedor',
  setor: 'suprimentos',
  titulo: 'Avaliação de Fornecedor',
  clausula: '8.4',
  explicacao:
    'Como o fornecedor se comportou no período. A norma manda avaliar, selecionar, monitorar o desempenho e reavaliar — e é o monitoramento que quase sempre falta: avalia-se na entrada e nunca mais.',
  campos: [
    { chave: 'fornecedor', rotulo: 'Fornecedor', tipo: 'texto', obrigatorio: true },
    { chave: 'fornece', rotulo: 'O que fornece', tipo: 'texto', obrigatorio: true },
    { chave: 'momento', rotulo: 'Momento da avaliação', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Qualificação inicial', 'Reavaliação periódica', 'Reavaliação por ocorrência'],
      ajuda: 'A reavaliação por ocorrência é a que se faz quando algo deu errado, sem esperar o período fechar.' },
    { chave: 'periodo', rotulo: 'Período avaliado', tipo: 'texto', obrigatorio: true,
      ajuda: 'Ex.: 1º semestre/2026. Na qualificação inicial, o histórico que se conseguiu levantar.' },

    { chave: 'qualidade', rotulo: 'Qualidade do fornecimento', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Ótimo', 'Bom', 'Regular', 'Ruim'] },
    { chave: 'prazo', rotulo: 'Cumprimento de prazo', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Ótimo', 'Bom', 'Regular', 'Ruim'] },
    { chave: 'documentacao', rotulo: 'Documentação e certificados', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Ótimo', 'Bom', 'Regular', 'Ruim'] },
    { chave: 'atendimento', rotulo: 'Atendimento e resposta a problema', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Ótimo', 'Bom', 'Regular', 'Ruim'] },
    { chave: 'ocorrencias', rotulo: 'Ocorrências no período', tipo: 'texto_longo',
      ajuda: 'Devoluções, concessões, atrasos, RNC abertos. É o que sustenta a nota — nota sem fato é impressão.' },

    { chave: 'situacao', rotulo: 'Situação', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Aprovado', 'Aprovado com restrição', 'Em observação', 'Reprovado'],
      ajuda: 'É esta decisão que diz se o fornecedor continua podendo receber pedido, e é ela que o pedido de compra consulta.' },
    { chave: 'restricao', rotulo: 'Qual restrição', tipo: 'texto_longo', obrigatorio: true,
      dependeDe: { campo: 'situacao', valor: ['Aprovado com restrição', 'Em observação'] },
      ajuda: 'Ex.: só para material de consumo; só com inspeção de entrada reforçada.' },
    { chave: 'acaoCombinada', rotulo: 'O que foi combinado com o fornecedor', tipo: 'texto_longo', obrigatorio: true,
      dependeDe: { campo: 'situacao', valor: ['Aprovado com restrição', 'Em observação', 'Reprovado'] },
      ajuda: 'A 8.4.1 manda monitorar o desempenho. Reprovar sem falar com o fornecedor é perder o fornecedor sem melhorar nada.' },
    { chave: 'proximaAvaliacao', rotulo: 'Próxima avaliação', tipo: 'data', obrigatorio: true,
      ajuda: 'Sem data, a reavaliação periódica não acontece — e é dela que a norma fala.' },

    { chave: 'avaliadoEm', rotulo: 'Avaliado em', tipo: 'data', obrigatorio: true, preenchidoCom: 'hoje' },
    { chave: 'avaliadoPor', rotulo: 'Avaliado por', tipo: 'pessoa', obrigatorio: true, preenchidoCom: 'quem_registra' },
  ],
  anexos: {
    titulo: 'Evidências do período',
    vazio: 'Sem anexo. Certificado de qualidade do fornecedor, e-mail de tratativa de ocorrência, relatório de desempenho.',
  },
};

/** O romaneio — a 8.5.4 pede preservar até a entrega, e o romaneio é a prova de que o que saiu
 *  saiu inteiro, identificado e para quem devia. */
export const ROMANEIO: FormularioDef = {
  papel: 'romaneio',
  setor: 'suprimentos',
  titulo: 'Romaneio de Expedição',
  clausula: '8.5.4',
  explicacao:
    'O que saiu, para quem, como foi protegido e quem recebeu. É a prova de que a preservação que a norma pede foi até a entrega, e não até a porta do galpão.',
  campos: [
    { chave: 'numero', rotulo: 'Número do romaneio', tipo: 'texto', obrigatorio: true },
    { chave: 'cliente', rotulo: 'Cliente', tipo: 'texto', obrigatorio: true },
    { chave: 'os', rotulo: 'Ordem de serviço', tipo: 'texto', obrigatorio: true,
      ajuda: 'A OS de onde as peças saíram. É o que liga a entrega ao que foi medido e liberado.' },
    { chave: 'notaFiscal', rotulo: 'Nota fiscal', tipo: 'texto' },

    { chave: 'itens', rotulo: 'Peças expedidas', tipo: 'texto_longo', obrigatorio: true,
      ajuda: 'Descrição, identificação e quantidade. Sem identificação, a rastreabilidade da 8.5.2 morre na saída.' },
    { chave: 'volumes', rotulo: 'Volumes', tipo: 'texto', obrigatorio: true },
    { chave: 'liberadoPor', rotulo: 'Liberado pela inspeção?', tipo: 'sim_nao', obrigatorio: true,
      ajuda: 'A 8.6 proíbe a liberação antes de os arranjos planejados estarem concluídos. "Não" precisa da autorização de quem decidiu liberar assim mesmo.' },
    { chave: 'autorizadoPor', rotulo: 'Quem autorizou a saída sem liberação', tipo: 'pessoa', obrigatorio: true,
      dependeDe: { campo: 'liberadoPor', valor: 'Não' },
      ajuda: 'A 8.6 pede a rastreabilidade à pessoa que autoriza. Este campo existe para a exceção ter dono, não para facilitá-la.' },

    { chave: 'protecao', rotulo: 'Proteção aplicada', tipo: 'escolha', obrigatorio: true,
      opcoes: ['Filme plástico', 'Papelão / manta', 'Engradado de madeira', 'Pallet com cinta', 'Sem proteção adicional'],
      ajuda: 'A 8.5.4 manda preservar durante o transporte. Peça pintada que chega arranhada volta como reclamação.' },
    { chave: 'transportadora', rotulo: 'Transportadora', tipo: 'texto', obrigatorio: true },
    { chave: 'motorista', rotulo: 'Motorista', tipo: 'texto' },
    { chave: 'placa', rotulo: 'Placa', tipo: 'texto' },

    { chave: 'expedidoEm', rotulo: 'Expedido em', tipo: 'data', obrigatorio: true, preenchidoCom: 'hoje' },
    { chave: 'hora', rotulo: 'Hora', tipo: 'hora', preenchidoCom: 'agora' },
    { chave: 'expedidoPor', rotulo: 'Expedido por', tipo: 'pessoa', obrigatorio: true, preenchidoCom: 'quem_registra' },
    { chave: 'recebidoNoCliente', rotulo: 'Quem recebeu no cliente', tipo: 'texto',
      ajuda: 'Preenchido quando o canhoto volta. É o que fecha a entrega — sem isto, a empresa sabe que despachou, não que entregou.' },
    { chave: 'observacoes', rotulo: 'Observações', tipo: 'texto_longo' },
  ],
  anexos: {
    titulo: 'Canhoto assinado e fotos da carga',
    vazio: 'Sem anexo. A foto da carga protegida antes de sair é o que responde à reclamação de peça avariada no transporte.',
  },
};
