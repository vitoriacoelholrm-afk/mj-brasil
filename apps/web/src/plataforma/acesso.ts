// QUEM PODE O QUÊ. Motor de permissão — não sabe de empresa nenhuma nem de pessoa nenhuma.
//
// A regra que manda aqui não é de software, é da norma: quem confere não é quem preenche. Um
// registro da qualidade é evidência de que a EMPRESA fez o trabalho. Se quem audita preenche o
// registro, ele deixa de ser evidência da empresa e vira evidência de quem auditou — e a
// independência da conferência (ISO 9001 §9.2) some junto.
//
// Por isso a coordenação da qualidade, que é onde a consultoria entra, VÊ TUDO e não escreve
// nada. Preencher é de quem executa e de quem inspeciona, dentro da empresa.

/** O papel de alguém dentro da empresa atendida. É o que decide o acesso.
 *  Não confundir com o CARGO, que é o nome que a empresa dá — "Gerente de Produção" é cargo,
 *  `inspecao` é papel. Duas empresas com cargos diferentes usam os mesmos papéis. */
export type Papel =
  | 'coordenacao_qualidade'
  | 'direcao'
  | 'execucao'
  | 'inspecao'
  | 'apoio';

export const PAPEL_ROTULO: Record<Papel, string> = {
  coordenacao_qualidade: 'Coordenação da Qualidade',
  direcao: 'Direção',
  execucao: 'Execução',
  inspecao: 'Inspeção',
  apoio: 'Apoio',
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
  | 'rh.editar';

/** Um conjunto de telas que anda junto em matéria de acesso.
 *
 *  Existe porque acesso não é uma régua só. Quem preenche a ordem de serviço não é quem preenche
 *  a ficha de treinamento, e nenhum dos dois precisa do que é do outro. Sem setor, a única saída
 *  seria dar tudo a todo mundo ou inventar um papel novo a cada tela. */
export type Setor = 'os' | 'rh';

export const SETOR_ROTULO: Record<Setor, string> = {
  os: 'ordem de serviço',
  rh: 'registros de pessoas',
};

const DO_SETOR: Record<Setor, { ver: Permissao; editar: Permissao }> = {
  os: { ver: 'os.ver', editar: 'os.editar' },
  rh: { ver: 'rh.ver', editar: 'rh.editar' },
};

const TUDO_NA_OS: Permissao[] = ['os.ver', 'os.editar', 'os.anexar', 'relatorio.emitir'];

const ACESSO: Record<Papel, Permissao[]> = {
  // A consultoria. Vê tudo — inclusive o que está errado — e não escreve nada.
  coordenacao_qualidade: ['os.ver'],
  // Direção acompanha e decide; não é quem preenche formulário de chão de fábrica.
  direcao: ['os.ver'],
  // Quem faz o serviço registra o que fez, e não assina o documento que vai ao cliente.
  execucao: ['os.ver', 'os.editar', 'os.anexar'],
  // Quem registra a medição e assina o relatório que vai ao cliente. Pode ser mais de uma
  // pessoa, e com cargos diferentes: quem planeja e quem gerencia a produção costumam assinar
  // tanto quanto quem inspeciona. O papel é um só; os cargos ficam no perfil da empresa.
  inspecao: TUDO_NA_OS,
  // Administrativo. A ordem de serviço não é assunto dele; os registros de pessoas são — e são
  // só dele. Decisão dela: o RH preenche, e ninguém mais entra nesse setor.
  apoio: ['rh.ver', 'rh.editar'],
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

export { ACESSO };
