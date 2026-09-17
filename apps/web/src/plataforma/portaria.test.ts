// O pátio.
//
// Estes testes guardam a pergunta que a portaria existe para responder: o que é do cliente e
// está aqui dentro agora. Quem responde é a conta sobre os registros, não a memória de ninguém —
// e uma conta errada aqui é peça de cliente dada como devolvida sem ter saído.
import { describe, it, expect } from 'vitest';
import { valoresIniciais, type Registro, type Valores } from './formularios';
import { CONTROLE_CARGAS } from './formularios';
import {
  avariasVistas, chaveDaOs, diasNoPatio, ehDoCliente, movimentoDoDia, noPatio, semRastro,
} from './portaria';

let seq = 0;
const carga = (v: Valores): Registro => ({
  id: `r-${++seq}`,
  papel: 'controle_cargas',
  valores: {
    parte: 'Cliente A', placa: 'ABC1D23', motorista: 'José da Silva',
    registradoPor: 'Beatriz Nogueira', ...v,
  },
  anexos: [],
  criadoEm: v.data ?? '2026-09-17',
  criadoPor: 'Beatriz Nogueira',
});

// `os` ausente é campo que ninguém preencheu — e não a string vazia, que já seria um valor.
const comOs = (os: string | undefined): Valores => (os === undefined ? {} : { os });

const entrou = (os: string | undefined, data: string, hora = '08:00', tipo = 'Peça de cliente') =>
  carga({ sentido: 'Entrada', tipo, data, hora, ...comOs(os) });

const saiu = (os: string | undefined, data: string, hora = '17:00', tipo = 'Produto acabado') =>
  carga({ sentido: 'Saída', tipo, data, hora, ...comOs(os) });

/* ══ 1. O par ════════════════════════════════════════════════════════════════════════════════ */

describe('entrada e saída são um par, não duas listas', () => {
  it('peça de cliente que entrou e não saiu está no pátio', () => {
    const livro = [entrou('OS-1041', '2026-09-15')];
    expect(noPatio(livro).map((r) => r.valores.os)).toEqual(['OS-1041']);
  });

  it('e some do pátio quando sai — mesmo saindo com outro tipo, que é o normal', () => {
    // Entra como peça de cliente e sai como produto acabado: é o serviço inteiro. Exigir que
    // saísse com o mesmo rótulo faria toda peça pintada ficar eternamente no pátio.
    const livro = [entrou('OS-1041', '2026-09-15'), saiu('OS-1041', '2026-09-17')];
    expect(noPatio(livro)).toEqual([]);
  });

  it('a OS é a chave, e espaço a mais ou minúscula não quebram o par', () => {
    const livro = [
      carga({ sentido: 'Entrada', tipo: 'Peça de cliente', os: ' os-1041 ', data: '2026-09-15', hora: '08:00' }),
      carga({ sentido: 'Saída', tipo: 'Produto acabado', os: 'OS-1041', data: '2026-09-17', hora: '17:00' }),
    ];
    expect(noPatio(livro)).toEqual([]);
    expect(chaveDaOs({ os: '  os-1041  ' })).toBe('OS-1041');
    expect(chaveDaOs({ os: '   ' })).toBe(null);
    expect(chaveDaOs({})).toBe(null);
  });

  it('três viagens para dentro e duas para fora deixam uma dentro', () => {
    // O pareamento é por contagem, não por existir alguma saída daquela OS. Sem isso, uma única
    // saída daria a obra inteira como devolvida.
    const livro = [
      entrou('OS-2000', '2026-09-10', '07:00'),
      entrou('OS-2000', '2026-09-11', '07:00'),
      entrou('OS-2000', '2026-09-12', '07:00'),
      saiu('OS-2000', '2026-09-16'),
      saiu('OS-2000', '2026-09-17'),
    ];
    expect(noPatio(livro)).toHaveLength(1);
    // E é a última a entrar que fica: cada saída fecha a entrada aberta mais antiga.
    expect(noPatio(livro)[0].valores.data).toBe('2026-09-12');
  });

  it('saída anterior à entrada não fecha par nenhum', () => {
    // Mesma OS, mas a saída é de antes: é outra viagem, ou é erro de digitação. Fechar aqui
    // seria dar por devolvida uma peça que está no pátio.
    const livro = [saiu('OS-3000', '2026-09-10'), entrou('OS-3000', '2026-09-15')];
    expect(noPatio(livro)).toHaveLength(1);
  });

  it('a ordem em que os registros chegam não muda a conta', () => {
    const a = entrou('OS-4000', '2026-09-10');
    const b = saiu('OS-4000', '2026-09-12');
    expect(noPatio([a, b])).toEqual(noPatio([b, a]));
  });

  it('o que é da empresa não entra na conta do pátio', () => {
    // A 8.5.3 é sobre propriedade do cliente. Lata de tinta comprada pela casa não é custódia.
    const livro = [
      entrou('OS-5000', '2026-09-15', '08:00', 'Matéria-prima ou insumo da empresa'),
      entrou('OS-5001', '2026-09-15', '09:00', 'Resíduo'),
    ];
    expect(noPatio(livro)).toEqual([]);
  });

  it('e insumo do cliente conta tanto quanto peça — inclusive a carga mista', () => {
    for (const tipo of ['Peça de cliente', 'Matéria-prima ou insumo do cliente', 'Peças e insumos do cliente']) {
      expect(ehDoCliente({ tipo }), tipo).toBe(true);
      expect(noPatio([entrou('OS-6000', '2026-09-15', '08:00', tipo)]), tipo).toHaveLength(1);
    }
    expect(ehDoCliente({ tipo: 'Produto acabado' })).toBe(false);
    expect(ehDoCliente({})).toBe(false);
  });
});

/* ══ 2. A ponta solta ════════════════════════════════════════════════════════════════════════ */

describe('entrada de cliente sem OS', () => {
  it('não entra na conta do pátio, e aparece como ponta solta', () => {
    // Não dá para parear o que não tem chave. Somar no pátio esconderia o problema atrás de um
    // número; deixar de fora sem dizer nada seria pior.
    const livro = [entrou(undefined, '2026-09-15'), entrou('OS-7000', '2026-09-15', '09:00')];
    expect(noPatio(livro)).toHaveLength(1);
    expect(semRastro(livro)).toHaveLength(1);
    expect(semRastro(livro)[0].valores.os).toBeUndefined();
  });

  it('carga da empresa sem OS não é ponta solta — não há o que parear', () => {
    expect(semRastro([entrou(undefined, '2026-09-15', '08:00', 'Resíduo')])).toEqual([]);
  });
});

/* ══ 3. A avaria ═════════════════════════════════════════════════════════════════════════════ */

describe('avaria vista no portão', () => {
  it('fica listada: o portão viu, e quem abre a ocorrência da 8.5.3 é outro setor', () => {
    const livro = [
      carga({
        sentido: 'Entrada', tipo: 'Peça de cliente', os: 'OS-8000',
        data: '2026-09-17', hora: '07:40', estado: 'Avaria aparente',
        descricaoAvaria: 'Flange amassado no canto do palete.', avisou: 'Gerência de produção',
      }),
      entrou('OS-8001', '2026-09-17', '08:10'),
    ];
    expect(avariasVistas(livro)).toHaveLength(1);
    expect(avariasVistas(livro)[0].valores.avisou).toBe('Gerência de produção');
  });

  it('carga íntegra não vira pendência', () => {
    expect(avariasVistas([carga({
      sentido: 'Entrada', tipo: 'Peça de cliente', data: '2026-09-17', estado: 'Íntegra',
    })])).toEqual([]);
  });
});

/* ══ 4. O turno ══════════════════════════════════════════════════════════════════════════════ */

describe('o movimento do dia', () => {
  it('separa entradas de saídas e devolve na ordem do relógio', () => {
    const livro = [
      saiu('OS-9001', '2026-09-17', '16:20'),
      entrou('OS-9000', '2026-09-17', '07:40'),
      entrou('OS-9002', '2026-09-17', '11:05'),
      entrou('OS-9003', '2026-09-16', '09:00'),
    ];
    const hoje = movimentoDoDia(livro, '2026-09-17');
    expect(hoje.entradas.map((r) => r.valores.hora)).toEqual(['07:40', '11:05']);
    expect(hoje.saidas.map((r) => r.valores.hora)).toEqual(['16:20']);
  });
});

/* ══ 5. Quanto tempo está aí ═════════════════════════════════════════════════════════════════ */

describe('há quantos dias no pátio', () => {
  it('conta os dias, e não inventa número quando a data não dá para ler', () => {
    expect(diasNoPatio(entrou('OS-1', '2026-09-10'), '2026-09-17')).toBe(7);
    expect(diasNoPatio(entrou('OS-1', '2026-09-17'), '2026-09-17')).toBe(0);
    expect(diasNoPatio(carga({ sentido: 'Entrada', tipo: 'Peça de cliente' }), '2026-09-17')).toBe(null);
  });
});

/* ══ 6. O que o portão não deveria digitar ═══════════════════════════════════════════════════ */

describe('o registro novo já nasce com o que o sistema sabe', () => {
  it('data de hoje, hora do relógio e quem está registrando', () => {
    const iniciais = valoresIniciais(CONTROLE_CARGAS, 'Beatriz Nogueira');
    const agora = new Date();
    const dd = (n: number) => String(n).padStart(2, '0');

    expect(iniciais.data).toBe(
      [agora.getFullYear(), dd(agora.getMonth() + 1), dd(agora.getDate())].join('-'),
    );
    expect(iniciais.hora).toMatch(/^\d{2}:\d{2}$/);
    expect(iniciais.registradoPor).toBe('Beatriz Nogueira');
  });

  it('a data é a do relógio local, e não a do horário universal', () => {
    // Às nove da noite daqui, o dia universal já virou. O registro sairia com a data de amanhã,
    // e o erro só apareceria numa auditoria, como carga que entrou antes de existir.
    const iniciais = valoresIniciais(CONTROLE_CARGAS, null);
    expect(iniciais.data).toBe(new Date().toLocaleDateString('en-CA'));
  });

  it('sem ninguém logado, o campo fica vazio em vez de mentir um nome', () => {
    expect(valoresIniciais(CONTROLE_CARGAS, null).registradoPor).toBeUndefined();
  });

  it('nada mais vem preenchido — o resto é o que aconteceu, e só quem viu sabe', () => {
    expect(Object.keys(valoresIniciais(CONTROLE_CARGAS, 'Beatriz Nogueira')).sort())
      .toEqual(['data', 'hora', 'registradoPor']);
  });
});
