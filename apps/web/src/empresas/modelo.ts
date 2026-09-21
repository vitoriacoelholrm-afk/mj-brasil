// MODELO EM BRANCO — o ponto de partida do próximo cliente da consultoria.
//
// Não é empresa nenhuma. E, diferente de antes, a lista mestra dela não é digitada à mão: é
// GERADA do catálogo padrão. Abrir um cliente novo passa a ser escolher os módulos e dar nome à
// empresa — a documentação já vem cadastrada, codificada e ligada às cláusulas da norma.
//
// É também a prova de que o motor não sabe de quem é o dado: se o app funciona com este perfil
// ativo, é porque nada de nenhum cliente vazou para dentro das regras.
import { registrar, type PerfilDaEmpresa } from '@/plataforma/empresa';
import type { DocumentoMestre, ListaMestraMeta } from '@/plataforma/documentos';
import { LEGENDA_PADRAO, catalogoPara } from '@/modules/sgq-documentos/catalogoPadrao';

const MODULOS = ['tratamento-superficie'];
const EMISSAO = '2026-09-01';
const PROXIMA = '2027-09-01';

/** O catálogo padrão vira a lista mestra da empresa: cada documento padrão recebe o código
 *  sugerido, e guarda a chave que o liga de volta ao padrão. É a chave — não o código — que
 *  permite comparar esta empresa com qualquer outra. */
const DOCUMENTOS: DocumentoMestre[] = catalogoPara(MODULOS).map((padrao) => ({
  codigo: padrao.codigoSugerido,
  titulo: padrao.titulo,
  natureza: padrao.natureza,
  categoria: padrao.categoria,
  clausulas: padrao.clausulas,
  padroes: [padrao.chave],
  revisao: '00',
  emissao: EMISSAO,
  proximaRevisao: PROXIMA,
  situacao: 'vigente',
  acesso: 'irrestrito',
  responsavel: 'A definir',
  local: 'Servidor / Pasta SGQ',
  nota: padrao.exigencia === 'norma' ? undefined : 'Prática consolidada — a norma não exige.',
}));

/** Os formulários que viram tela, tirados do próprio catálogo: cada documento padrão que declara
 *  um papel entrega o código que a empresa deu a ele. Ninguém digita este mapa. */
const FORMULARIOS = Object.fromEntries(
  catalogoPara(MODULOS)
    .filter((p) => p.papel)
    .map((p) => [p.papel!, p.codigoSugerido]),
) as PerfilDaEmpresa['formularios'];

const META: ListaMestraMeta = {
  codigo: 'LM-001',
  revisao: '1',
  emissao: EMISSAO,
  proximaRevisao: PROXIMA,
  totalCatalogado: DOCUMENTOS.length,
  norma: 'ISO 9001:2015',
  aprovadoPor: 'A definir',
  elaboradoPor: 'A definir',
  codigosParalelos: [],
};

export const MODELO: PerfilDaEmpresa = registrar({
  id: 'modelo',
  identidade: {
    nome: 'Empresa modelo',
    subtitulo: 'Gerada do catálogo padrão',
    acento: '#3A5A80',
    acentoFraco: '#E4EBF3',
  },
  // Outra tolerância de propósito: aqui a camada grossa é mais cara, e o teto é mais baixo.
  tolerancia: { abaixo: 0.05, acima: 0.15 },
  documentacao: { meta: META, legenda: LEGENDA_PADRAO, documentos: DOCUMENTOS },
  formularios: FORMULARIOS,
  modulos: MODULOS,
  // A norma INTEIRA se aplica, porque ninguém declarou o contrário ainda. É o estado certo de um
  // cliente novo: as 37 cláusulas são cobradas até a empresa determinar, por escrito e com
  // justificativa, qual requisito não cabe no negócio dela. Quando couber uma exclusão, ela entra
  // aqui — `{ clausula, justificativa, declaradaEm }` — e some das cobranças sem sumir da tela.
  exclusoes: [],
  modelo: true,
});

export { DOCUMENTOS, META };
