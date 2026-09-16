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
 *  Não confundir com o CARGO, que é o nome que a empresa dá — "Inspetor de Pintura N1" é cargo,
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
  | 'relatorio.emitir';

const TODAS: Permissao[] = ['os.ver', 'os.editar', 'os.anexar', 'relatorio.emitir'];

const ACESSO: Record<Papel, Permissao[]> = {
  // A consultoria. Vê tudo — inclusive o que está errado — e não escreve nada.
  coordenacao_qualidade: ['os.ver'],
  // Direção acompanha e decide; não é quem preenche formulário de chão de fábrica.
  direcao: ['os.ver'],
  // Quem faz o serviço registra o que fez.
  execucao: ['os.ver', 'os.editar', 'os.anexar'],
  // Quem inspeciona registra a medição e emite o relatório.
  inspecao: TODAS,
  // Administrativo: a ordem de serviço não é assunto dele.
  apoio: [],
};

export function pode(papel: Papel, permissao: Permissao): boolean {
  return ACESSO[papel].includes(permissao);
}

/** Verdadeiro quando o papel só observa. Serve para a tela se apresentar como consulta. */
export function somenteLeitura(papel: Papel): boolean {
  return pode(papel, 'os.ver') && !pode(papel, 'os.editar');
}

/** A frase que a tela mostra para explicar por que os campos não abrem. Sem isto o usuário
 *  acha que está com defeito. */
export function motivoDaLeituraApenas(papel: Papel): string {
  return papel === 'coordenacao_qualidade'
    ? 'Você está como Coordenação da Qualidade: vê tudo e não altera nada. Quem preenche a ordem de serviço é quem executa e quem inspeciona — é o que mantém o registro sendo evidência da empresa, e a conferência, independente.'
    : `Seu papel (${PAPEL_ROTULO[papel]}) tem acesso de consulta. Alterar a ordem de serviço é de quem executa e de quem inspeciona.`;
}

export { ACESSO };
