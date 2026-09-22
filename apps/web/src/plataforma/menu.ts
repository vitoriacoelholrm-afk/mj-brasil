import type { Papel } from './acesso';
import type { Modulo, Rota } from './modulo';

export interface PortaDeMenu {
  rota: Rota;
  rotulo: string;
  sub: string;
  telas: Rota[];
}

export interface FeitioDeMenu {
  fora?: Rota[];
  portas?: PortaDeMenu[];
  ordem?: string[];
}

export const FEITIO: Partial<Record<Papel, FeitioDeMenu>> = {
  inspecao: {
    fora: ['comunicacao', 'satisfacao', 'indicadores'],
    portas: [{
      rota: 'documentos',
      rotulo: 'Documentos',
      sub: 'O manual do sistema e a lista mestra — o que consultar quando precisar achar um procedimento.',
      telas: ['manual', 'lista-mestra'],
    }],
    ordem: ['Ordens de Serviço', 'Registros', 'Monitoramento', 'Cadastros'],
  },

  coordenacao_qualidade: {
    fora: ['nao-conformidade', 'propriedade-cliente', 'mudanca-producao', 'comunicacao',
      'pos-entrega', 'plano-acao', 'vencimentos', 'instrumentos', 'lista-mestra', 'manual'],
    portas: [
      {
        rota: 'registros-empresa',
        rotulo: 'Registros da empresa',
        sub: 'O que você confere — não conformidades, propriedade do cliente, mudanças, comunicação, pós-entrega e planos de ação.',
        telas: ['nao-conformidade', 'propriedade-cliente', 'mudanca-producao', 'comunicacao', 'pos-entrega', 'plano-acao'],
      },
      {
        rota: 'medicoes-vencimentos',
        rotulo: 'Medições e vencimentos',
        sub: 'O que você acompanha — instrumentos e suas calibrações.',
        telas: ['vencimentos', 'instrumentos'],
      },
      {
        rota: 'documentos',
        rotulo: 'Documentos',
        sub: 'O que você consulta quando precisa — manual do sistema e lista mestra.',
        telas: ['manual', 'lista-mestra'],
      },
    ],
    ordem: ['Diagnóstico', 'Monitoramento', 'Cadastros'],
  },
};

export const feitioDe = (papel: Papel): FeitioDeMenu => FEITIO[papel] ?? {};

export function foraDaColuna(papel: Papel, rota: Rota): boolean {
  const f = feitioDe(papel);
  if (f.fora?.includes(rota)) return true;
  return f.portas?.some(p => p.telas.includes(rota)) ?? false;
}

export interface GrupoDeMenu {
  rotulo: string;
  telas: Modulo['telas'];
}

export function colunaDe(modulos: Modulo[], papel: Papel): GrupoDeMenu[] {
  const ordem: string[] = [];
  const por = new Map<string, Modulo['telas']>();
  for (const m of modulos) {
    const telas = m.telas.filter((t) => !foraDaColuna(papel, t.rota));
    if (!telas.length) continue;
    if (!por.has(m.dominio)) { por.set(m.dominio, []); ordem.push(m.dominio); }
    por.get(m.dominio)!.push(...telas);
  }
  const pedida = feitioDe(papel).ordem ?? [];
  ordem.sort((a, b) => posicao(pedida, a) - posicao(pedida, b));
  return ordem.map((rotulo) => ({ rotulo, telas: por.get(rotulo)! }));
}

const posicao = (pedida: string[], dominio: string) => {
  const i = pedida.indexOf(dominio);
  return i === -1 ? pedida.length : i;
};
