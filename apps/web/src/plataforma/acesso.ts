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
  | 'apoio'
  | 'portaria';

export const PAPEL_ROTULO: Record<Papel, string> = {
  coordenacao_qualidade: 'Coordenação da Qualidade',
  direcao: 'Direção',
  execucao: 'Execução',
  inspecao: 'Inspeção',
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
  | 'modelo.editar';

/** Um conjunto de telas que anda junto em matéria de acesso.
 *
 *  Existe porque acesso não é uma régua só. Quem preenche a ordem de serviço não é quem preenche
 *  a ficha de treinamento, e nenhum dos dois precisa do que é do outro. Sem setor, a única saída
 *  seria dar tudo a todo mundo ou inventar um papel novo a cada tela. */
export type Setor = 'os' | 'rh' | 'portaria' | 'sgq';

export const SETOR_ROTULO: Record<Setor, string> = {
  os: 'ordem de serviço',
  rh: 'registros de pessoas',
  portaria: 'entrada e saída de cargas',
  sgq: 'gestão do sistema da qualidade',
};

const DO_SETOR: Record<Setor, { ver: Permissao; editar: Permissao }> = {
  os: { ver: 'os.ver', editar: 'os.editar' },
  rh: { ver: 'rh.ver', editar: 'rh.editar' },
  portaria: { ver: 'portaria.ver', editar: 'portaria.editar' },
  sgq: { ver: 'sgq.ver', editar: 'sgq.editar' },
};

const TUDO_NA_OS: Permissao[] = ['sgq.ver', 'os.ver', 'os.editar', 'os.anexar', 'relatorio.emitir'];

const ACESSO: Record<Papel, Permissao[]> = {
  // A consultoria. Vê tudo — inclusive o que está errado — e não escreve nada.
  coordenacao_qualidade: ['sgq.ver', 'os.ver', 'portaria.ver', 'modelo.editar'],
  // Direção acompanha e decide; não é quem preenche formulário de chão de fábrica. Mas o que a
  // NORMA manda a organização determinar sobre o próprio sistema é dela: a 7.4 pede determinar o
  // que se comunica e por quem, e determinar é ato de liderança (§5.1, §5.3).
  direcao: ['sgq.ver', 'os.ver', 'sgq.editar'],
  // Quem faz o serviço registra o que fez, e não assina o documento que vai ao cliente.
  execucao: ['sgq.ver', 'os.ver', 'os.editar', 'os.anexar'],
  // Quem registra a medição e assina o relatório que vai ao cliente. Pode ser mais de uma
  // pessoa, e com cargos diferentes: quem planeja e quem gerencia a produção costumam assinar
  // tanto quanto quem inspeciona. O papel é um só; os cargos ficam no perfil da empresa.
  inspecao: TUDO_NA_OS,
  // Administrativo. A ordem de serviço não é assunto dele; os registros de pessoas são — e são
  // só dele. Decisão dela: o RH preenche, e ninguém mais entra nesse setor.
  apoio: ['sgq.ver', 'rh.ver', 'rh.editar'],
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

export { ACESSO };
