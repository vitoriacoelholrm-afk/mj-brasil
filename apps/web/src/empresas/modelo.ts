// MODELO EM BRANCO — o ponto de partida do próximo cliente da consultoria.
//
// Não é empresa nenhuma: é a prova de que o motor não sabe de quem é o dado. Tudo aqui é
// diferente do perfil da Minasjato de propósito — outra codificação, outra tolerância, outra
// cor, outra norma de referência. Se o app continuar funcionando com este perfil ativo, é
// porque nada de Minasjato vazou para dentro das regras.
//
// Para abrir um cliente de verdade: copie este arquivo, troque a identidade, cadastre a lista
// mestra dele e ajuste a tolerância combinada. Nenhuma regra muda.
import { registrar, type PerfilDaEmpresa } from '@/plataforma/empresa';
import type { DocumentoMestre, Legenda, ListaMestraMeta, Natureza } from '@/plataforma/documentos';

/** Uma codificação deliberadamente diferente da Minasjato — quatro prefixos em vez de dez. */
const LEGENDA: Legenda = {
  MAN: 'Manual',
  POP: 'Procedimento Operacional Padrão',
  IT: 'Instrução de Trabalho',
  FOR: 'Formulário',
};

const META: ListaMestraMeta = {
  codigo: 'LM-001',
  revisao: '1',
  emissao: '2026-09-01',
  proximaRevisao: '2027-09-01',
  totalCatalogado: 4,
  norma: 'ISO 9001:2015',
  aprovadoPor: 'A definir',
  elaboradoPor: 'A definir',
  codigosParalelos: [],
};

function doc(
  codigo: string, titulo: string, natureza: Natureza, categoria: string,
  clausulas: string[], extra: Partial<DocumentoMestre> = {},
): DocumentoMestre {
  return {
    codigo, titulo, natureza, categoria, clausulas,
    revisao: '00', emissao: META.emissao, proximaRevisao: META.proximaRevisao,
    situacao: 'vigente', acesso: 'irrestrito', responsavel: 'A definir',
    local: 'Servidor / Pasta SGQ',
    ...extra,
  };
}

/** O esqueleto mínimo que qualquer SGQ certificado precisa ter. */
const DOCUMENTOS: DocumentoMestre[] = [
  doc('MAN-001', 'Manual da Qualidade', 'manual', 'Gestão da Qualidade', ['4', '5', '6', '7', '8', '9', '10']),
  doc('POP-001', 'Controle de Documentos e Registros', 'procedimento', 'Gestão da Qualidade', ['7.5']),
  doc('POP-002', 'Não Conformidade e Ação Corretiva', 'procedimento', 'Gestão da Qualidade', ['10.2']),
  doc('FOR-001', 'Formulário — Ordem de Serviço', 'formulario', 'Operações', ['8.5.1'], { tela: 'plano' }),
];

export const MODELO: PerfilDaEmpresa = registrar({
  id: 'modelo',
  identidade: {
    nome: 'Empresa modelo',
    subtitulo: 'Perfil em branco — ponto de partida',
    acento: '#3A5A80',
    acentoFraco: '#E4EBF3',
  },
  // Outra tolerância de propósito: aqui a camada grossa é mais cara, e o teto é mais baixo.
  tolerancia: { abaixo: 0.05, acima: 0.15 },
  documentacao: { meta: META, legenda: LEGENDA, documentos: DOCUMENTOS },
  // Só a ordem de serviço está cadastrada. O relatório de inspeção ainda não existe aqui — e a
  // tela do relatório avisa isso em vez de quebrar.
  formularios: { ordem_servico: 'FOR-001', nao_conformidade: 'POP-002' },
  modulos: ['surface-treatment'],
  modelo: true,
});
