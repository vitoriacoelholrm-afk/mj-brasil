// QUEM PODE O QUÊ. Motor de permissão — não sabe de empresa nenhuma nem de pessoa nenhuma.
//
// A regra que manda aqui não é de software, é da norma: quem confere não é quem preenche. Um
// registro da qualidade é evidência de que a EMPRESA fez o trabalho. Se quem audita preenche o
// registro, ele deixa de ser evidência da empresa e vira evidência de quem auditou — e a
// independência da conferência (ISO 9001 §9.2) some junto.
//
// Por isso a coordenação da qualidade, que é onde a consultoria entra, VÊ TUDO e não escreve
// nada. Preencher é de quem executa e de quem inspeciona, dentro da empresa.

import type { ModoDeContratacao } from './contratacao';
import { temGestao } from './contratacao';

/** O papel de alguém dentro da empresa atendida. É o que decide o acesso.
 *  Não confundir com o CARGO, que é o nome que a empresa dá — "Gerente de Produção" é cargo,
 *  `inspecao` é papel. Duas empresas com cargos diferentes usam os mesmos papéis.
 *
 *  EXECUÇÃO E INSPEÇÃO SÃO UM PAPEL SÓ, por decisão dela em 21/09/2026. Eram dois, e a única
 *  diferença era emitir o relatório que vai ao cliente. Na empresa 01 ninguém era só executante:
 *  o PCC e o gerente de produção fazem o serviço E assinam o RIP, e um papel sem ninguém dentro
 *  é 15 telas de menu que não servem a pessoa nenhuma.
 *
 *  Se um cliente futuro separar as duas funções — aplicador que não assina laudo —, volta um
 *  papel novo aqui, com `os.editar` e `os.anexar` e sem `relatorio.emitir`. Nada se perde: a
 *  distinção continua existindo como PERMISSÃO, que é onde ela sempre morou. */
export type Papel =
  | 'coordenacao_qualidade'
  | 'direcao'
  | 'inspecao'
  | 'apoio'
  | 'portaria';

export const PAPEL_ROTULO: Record<Papel, string> = {
  coordenacao_qualidade: 'Coordenação da Qualidade',
  direcao: 'Direção',
  inspecao: 'Execução e Inspeção',
  apoio: 'Apoio',
  portaria: 'Portaria',
};

export type Permissao =
  /** Abrir a ordem de serviço e ler tudo que há nela. */
  | 'os.ver'
  /** Digitar especificação e medição. */
  | 'os.editar'
  /** Juntar foto e arquivo como evidência. */
  | 'os.anexar'
  /** Emitir o relatório de inspeção que vai ao cliente. */
  | 'relatorio.emitir'
  /** Abrir os registros de pessoas — treinamento e competência. */
  | 'rh.ver'
  /** Preencher esses registros. */
  | 'rh.editar'
  /** Abrir o livro de entrada e saída de cargas. */
  | 'portaria.ver'
  /** Registrar uma passagem pelo portão. */
  | 'portaria.editar'
  /** Abrir o que a empresa compra e o que ela recebe e expede. */
  | 'suprimentos.ver'
  /** Preencher esses registros: pedido, recebimento, romaneio, avaliação de fornecedor. */
  | 'suprimentos.editar'
  /** Enxergar o sistema da qualidade: situação, lista mestra, diagnóstico, indicadores.
   *  Quem tem um posto de uso único — um terminal de portão, por exemplo — não tem. */
  | 'sgq.ver'
  /** Manter o que a DIREÇÃO determina sobre o próprio sistema: a matriz de comunicação (§7.4) e
   *  o que vier junto dela.
   *
   *  Existia um buraco aqui. Os setores até agora eram de quem EXECUTA — a ordem de serviço, os
   *  registros de pessoas, o portão. Nenhum era da gestão do sistema, e o resultado é que as
   *  cláusulas de liderança não tinham dono dentro da empresa: a coordenação da qualidade vê e
   *  não escreve, e a direção não escrevia nada.
   *
   *  A 7.4 manda a ORGANIZAÇÃO determinar o que se comunica, quando, com quem, como e por quem.
   *  Determinar é ato de liderança (§5.1, §5.3) — por isso esta permissão é da direção. */
  | 'sgq.editar'
  /** Escrever o texto dos documentos da EMPRESA MODELO — o molde que vai para o próximo cliente.
   *
   *  Isto NÃO contraria "quem confere não preenche", e a diferença é o que a regra protege. Aquela
   *  regra existe para o registro do cliente continuar sendo evidência DA EMPRESA: se quem audita
   *  preenche o RNC dela, o registro vira evidência de quem auditou e a independência da
   *  conferência (§9.2) some junto.
   *
   *  O modelo não é registro de cliente nenhum. É o produto da consultoria, escrito antes de
   *  existir cliente. Quem o escreve é quem conhece a norma — e é por isso que esta permissão é
   *  da coordenação da qualidade, e só dela. Ver `podeEditarOModelo`, que é onde a regra ganha
   *  dente: a permissão sozinha não abre nada fora do modelo. */
  | 'modelo.editar'
  /** Escrever o texto do manual DA EMPRESA, cláusula por cláusula.
   *
   *  Não contraria "quem confere não preenche", e a diferença é o objeto. Aquela regra protege o
   *  REGISTRO: a ordem de serviço, o RNC, a ficha de treinamento — a evidência de que a empresa
   *  fez o trabalho. O manual não é evidência de trabalho feito; é a declaração do que a empresa
   *  faz, e mantê-lo é justamente o ofício do Coordenador da Qualidade (MQ-001 §5.3).
   *
   *  Quem decide se ela vale é o MODO CONTRATADO, e não o papel sozinho — ver `podeEscreverOManual`.
   *  Em contrato só de auditoria ela não abre: ali quem escreve o manual é a empresa, fora daqui. */
  | 'manual.editar'
  /** Juntar o ARQUIVO de um documento da lista mestra — o .docx do procedimento, o .pdf do
   *  formulário assinado.
   *
   *  É o que falta para a tela da cláusula responder a pergunta inteira. Hoje ela diz que o
   *  PG-004 responde pela 9.2; com isto ela ABRE o PG-004. O auditor pede o documento, não o
   *  nome dele. */
  | 'documentos.anexar'
  /** Abrir o que a empresa apura SOBRE SI MESMA: o diagnóstico documental e o programa de
   *  auditoria interna.
   *
   *  Separada de `sgq.ver` em 21/09/2026, quando a matriz de acesso mostrou o furo: quem é
   *  AUDITADO estava vendo o plano e o resultado da auditoria do próprio setor. A §9.2 pede que a
   *  auditoria seja conduzida com imparcialidade; saber de antemão o que vai ser olhado é o
   *  contrário disso.
   *
   *  Fica com quem conduz (coordenação da qualidade) e com quem recebe o resultado (direção, que
   *  precisa dele como entrada da análise crítica, §9.3). Quem executa e quem inspeciona não
   *  perdem nada do trabalho deles: a não conformidade, o plano de ação e o pós-entrega continuam
   *  onde estavam. */
  | 'auditoria.ver'
  /** Escrever o PROGRAMA de auditoria interna — o plano, o escopo, o que vai ser olhado.
   *
   *  É da coordenação da qualidade, e só dela, por decisão dela em 21/09/2026. Parece contrariar
   *  "quem confere não preenche", e não contraria: aquela regra protege o REGISTRO da empresa —
   *  a ordem de serviço, o RNC, a ficha de treinamento —, que é a evidência de que a EMPRESA fez
   *  o trabalho. O plano de auditoria não é evidência de trabalho da empresa: é o produto de quem
   *  audita, escrito por quem conduz. Mesmo raciocínio que já abriu o manual (`manual.editar`).
   *
   *  O contrário é que seria o problema: plano de auditoria escrito por quem vai ser auditado é
   *  exatamente o que a §9.2 proíbe quando pede imparcialidade na condução. */
  | 'auditoria.editar'
  /** Cadastrar instrumento de medição e registrar a calibração que vence.
   *
   *  É §7.1.5 — recursos de monitoramento e medição. Fica com quem MEDE, por decisão dela em
   *  21/09/2026: o responsável pelo instrumento é quem sabe que ele voltou do laboratório e com
   *  que certificado. Quem só olha o painel de vencimentos não tem o papel na mão.
   *
   *  Antes disto não havia trava nenhuma: as telas de instrumento e de cliente deixavam QUALQUER
   *  um criar, inclusive a coordenação da qualidade e a direção. Era furo, não era regra. */
  | 'instrumentos.editar'
  /** Cadastrar e alterar o cliente da empresa atendida — quem contrata o serviço dela.
   *
   *  É §8.2, requisitos do cliente. Mesma decisão e mesma data: quem atende o cliente é quem
   *  abre a ordem de serviço para ele. */
  | 'clientes.editar';

/** Um conjunto de telas que anda junto em matéria de acesso.
 *
 *  Existe porque acesso não é uma régua só. Quem preenche a ordem de serviço não é quem preenche
 *  a ficha de treinamento, e nenhum dos dois precisa do que é do outro. Sem setor, a única saída
 *  seria dar tudo a todo mundo ou inventar um papel novo a cada tela. */
export type Setor = 'os' | 'rh' | 'portaria' | 'sgq' | 'suprimentos' | 'auditoria';

export const SETOR_ROTULO: Record<Setor, string> = {
  os: 'ordem de serviço',
  rh: 'registros de pessoas',
  portaria: 'entrada e saída de cargas',
  sgq: 'gestão do sistema da qualidade',
  suprimentos: 'compras, recebimento e expedição',
  auditoria: 'programa de auditoria interna',
};

const DO_SETOR: Record<Setor, { ver: Permissao; editar: Permissao }> = {
  os: { ver: 'os.ver', editar: 'os.editar' },
  rh: { ver: 'rh.ver', editar: 'rh.editar' },
  portaria: { ver: 'portaria.ver', editar: 'portaria.editar' },
  sgq: { ver: 'sgq.ver', editar: 'sgq.editar' },
  suprimentos: { ver: 'suprimentos.ver', editar: 'suprimentos.editar' },
  // A auditoria saiu de dentro do setor da gestão em 21/09/2026, quando ela decidiu quem preenche
  // o quê. Os dois setores já não eram a mesma coisa: quem apura indicador não é quem conduz a
  // auditoria, e agora não é mais a mesma gente. Ver `auditoria.editar`.
  auditoria: { ver: 'auditoria.ver', editar: 'auditoria.editar' },
};

const TUDO_NA_OS: Permissao[] = ['sgq.ver', 'os.ver', 'os.editar', 'os.anexar', 'relatorio.emitir'];

const ACESSO: Record<Papel, Permissao[]> = {
  // A consultoria. Vê tudo — inclusive o que está errado — e não escreve REGISTRO nenhum da
  // empresa. O que ela escreve é o que é dela: o modelo, o manual e o programa de auditoria
  // (`auditoria.editar`, decisão dela em 21/09/2026) — nenhum dos três é evidência de trabalho
  // feito pela empresa.
  coordenacao_qualidade: ['sgq.ver', 'os.ver', 'portaria.ver', 'modelo.editar', 'manual.editar', 'documentos.anexar', 'auditoria.ver', 'auditoria.editar'],
  // A DIREÇÃO NÃO PREENCHE NADA — decisão dela em 21/09/2026, e é uma régua só: acompanha,
  // decide e recebe o resultado, sem digitar registro nenhum.
  //
  // Ela tinha `sgq.editar` até então, pelo argumento de que determinar o que se comunica (§7.4) é
  // ato de liderança. A decisão passou por cima desse argumento. Os quatro registros que ficaram
  // órfãos foram redistribuídos na mesma conversa: o programa de auditoria para a coordenação da
  // qualidade, que é quem conduz; a comunicação, a satisfação do cliente e os indicadores para o
  // apoio, que é quem apura.
  direcao: ['sgq.ver', 'os.ver', 'suprimentos.ver', 'auditoria.ver'],
  // Quem faz o serviço e quem confere a medição — um papel só desde 21/09/2026. Registra o que
  // fez, junta a evidência e assina o relatório que vai ao cliente. Pode ser mais de uma pessoa,
  // e com cargos diferentes: quem planeja e quem gerencia a produção assinam tanto quanto quem
  // inspeciona. O papel é um só; os cargos ficam no perfil da empresa.
  //
  // O instrumento e o cliente entraram aqui em 21/09/2026, por decisão dela: quem mede é quem
  // responde pelo instrumento, e quem atende o cliente é quem abre a ordem de serviço dele.
  inspecao: [...TUDO_NA_OS, 'instrumentos.editar', 'clientes.editar'],
  // Administrativo. A ordem de serviço não é assunto dele; os registros de pessoas são — e são
  // só dele. Decisão dela: o RH preenche, e ninguém mais entra nesse setor.
  //
  // Suprimentos entrou em 21/09/2026, pela mesma lógica e por decisão dela: na lista mestra da
  // empresa 01, quem responde pelo pedido de compra e pela avaliação de fornecedor é a gerência
  // administrativa, que é este papel. Compras, recebimento e expedição andam juntos porque são o
  // mesmo caminho — o que se pede, o que chega e o que sai.
  //
  // A GESTÃO DO SISTEMA entrou aqui em 21/09/2026, por decisão dela: comunicação (§7.4),
  // satisfação do cliente (§9.1.2) e indicadores (§9.1.1) são apuração, e quem apura é o
  // administrativo. Eram da direção, que deixou de preencher.
  //
  // Houve um papel `suprimentos` separado por algumas horas neste mesmo dia. Ela decidiu que a
  // responsável por compras é a mesma pessoa do apoio, e papel sem gente dentro é o que acabamos
  // de tirar do sistema com a execução. O setor continua aqui, onde já estava.
  apoio: ['sgq.ver', 'rh.ver', 'rh.editar', 'suprimentos.ver', 'suprimentos.editar', 'sgq.editar'],
  // Posto de uso único: um terminal no portão. Não é console do sistema da qualidade, e por
  // isso não recebe `sgq.ver` — a tela abre já no que ele tem a fazer, e nada mais aparece.
  portaria: ['portaria.ver', 'portaria.editar'],
};

export function pode(papel: Papel, permissao: Permissao): boolean {
  return ACESSO[papel].includes(permissao);
}

export function podeVer(papel: Papel, setor: Setor): boolean {
  return pode(papel, DO_SETOR[setor].ver);
}

export function podeEditar(papel: Papel, setor: Setor): boolean {
  return pode(papel, DO_SETOR[setor].editar);
}

/** Verdadeiro quando o papel só observa a ordem de serviço. Serve para a tela se apresentar
 *  como consulta, e para a entrada marcar quem nunca escreve. */
export function somenteLeitura(papel: Papel): boolean {
  return pode(papel, 'os.ver') && !pode(papel, 'os.editar');
}

/** A frase que a tela mostra para explicar por que os campos da ordem de serviço não abrem.
 *  Sem isto o usuário acha que está com defeito. */
export function motivoDaLeituraApenas(papel: Papel): string {
  return papel === 'coordenacao_qualidade'
    ? 'Você está como Coordenação da Qualidade: vê tudo e não altera nada. Quem preenche a ordem de serviço é quem executa e quem inspeciona — é o que mantém o registro sendo evidência da empresa, e a conferência, independente.'
    : `Seu papel (${PAPEL_ROTULO[papel]}) tem acesso de consulta. Alterar a ordem de serviço é de quem executa e de quem inspeciona.`;
}

/** O cadastro que esta tela oferece — instrumento ou cliente. Não é `Setor`: o setor agrupa
 *  telas de REGISTRO, e estas duas são de cadastro, vistas por todo mundo e escritas por um só. */
export type Cadastro = 'instrumentos' | 'clientes';

const DO_CADASTRO: Record<Cadastro, { permissao: Permissao; oQue: string }> = {
  instrumentos: { permissao: 'instrumentos.editar', oQue: 'Cadastrar instrumento e registrar calibração' },
  clientes: { permissao: 'clientes.editar', oQue: 'Cadastrar e alterar cliente' },
};

export function podeCadastrar(papel: Papel, cadastro: Cadastro): boolean {
  return pode(papel, DO_CADASTRO[cadastro].permissao);
}

/** Por que o botão de cadastrar não aparece — ou null quando aparece.
 *
 *  A tela continua abrindo para todo mundo: ver o inventário e a carteira de clientes é consulta,
 *  e não tira evidência de ninguém. O que fecha é a escrita. */
export function motivoDoCadastro(papel: Papel, cadastro: Cadastro): string | null {
  if (podeCadastrar(papel, cadastro)) return null;
  return papel === 'coordenacao_qualidade'
    ? `${DO_CADASTRO[cadastro].oQue} é da empresa, não da consultoria. Você consulta — é o que mantém a conferência independente.`
    : `${DO_CADASTRO[cadastro].oQue} é de quem executa e inspeciona o serviço. Seu papel (${PAPEL_ROTULO[papel]}) consulta.`;
}

/** Por que esta tela não abre para escrever — ou null quando abre.
 *
 *  São três respostas diferentes, e trocar uma pela outra faz a pessoa achar que o sistema está
 *  com defeito: pode preencher, só consulta, ou o setor não é dela. */
export function motivoDoBloqueio(papel: Papel, setor: Setor): string | null {
  if (podeEditar(papel, setor)) return null;
  if (!podeVer(papel, setor)) {
    return `Estes são os registros de ${SETOR_ROTULO[setor]}, e não fazem parte do seu acesso. Quem preenche é quem responde pelo setor.`;
  }
  return setor === 'os'
    ? motivoDaLeituraApenas(papel)
    : `Seu papel (${PAPEL_ROTULO[papel]}) tem acesso de consulta a estes registros.`;
}

/** Verdadeiro quando este papel pode escrever o texto dos documentos DESTA empresa.
 *
 *  Duas condições, e a segunda é a que importa: ter a permissão, E a empresa ser o modelo. Sem a
 *  segunda, a permissão da coordenação viraria uma porta para dentro do sistema do cliente —
 *  exatamente o que a regra de independência proíbe.
 *
 *  Por isso a checagem mora aqui, numa função só, e não espalhada por cada tela que resolver
 *  oferecer um botão de editar. Tela esquece; função não. */
export function podeEditarOModelo(papel: Papel, empresaEhModelo: boolean): boolean {
  return empresaEhModelo && pode(papel, 'modelo.editar');
}

/** Verdadeiro quando este papel pode escrever o texto do manual desta empresa.
 *
 *  Duas portas, e são portas diferentes:
 *
 *    · na EMPRESA MODELO vale `modelo.editar` — ali se escreve o molde do produto, antes de
 *      existir cliente, e quem o escreve é quem conhece a norma;
 *    · numa empresa de verdade vale `manual.editar` E o contrato incluir gestão. Em contrato só
 *      de auditoria o manual do cliente não se escreve por aqui: o sistema apresenta o que ela
 *      emitiu, e quem confere não escreve o que vai conferir.
 *
 *  O que NÃO muda em modo nenhum é o registro. `sgq.editar`, `os.editar`, `rh.editar` continuam
 *  fora da coordenação da qualidade — manter o manual é declarar o que a empresa faz; preencher
 *  registro é afirmar que ela fez. Confundir os dois é o que a §9.2 proíbe. */
export function podeEscreverOManual(
  papel: Papel, modo: ModoDeContratacao, empresaEhModelo: boolean,
): boolean {
  return empresaEhModelo
    ? pode(papel, 'modelo.editar')
    : pode(papel, 'manual.editar') && temGestao(modo);
}

/** Verdadeiro quando este papel pode juntar o arquivo de um documento da lista mestra.
 *
 *  Segue o manual porque é o mesmo ato: colocar no sistema o documento que a empresa emitiu. Sem
 *  gestão contratada, o acervo é só apresentado — não se alimenta por aqui. */
export function podeAnexarEmDocumento(papel: Papel, modo: ModoDeContratacao): boolean {
  return pode(papel, 'documentos.anexar') && temGestao(modo);
}

export { ACESSO };
