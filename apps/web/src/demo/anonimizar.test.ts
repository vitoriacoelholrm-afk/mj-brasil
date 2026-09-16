// A trava da demonstração. Se alguém acrescentar um dado de cliente novo e esquecer de cadastrar
// a troca, é aqui que aparece — e o build de demo também quebra, pelo mesmo `vazamentos`.
import { describe, it, expect } from 'vitest';
import { TROCAS, fundo, texto, vazamentos } from './anonimizar';
import { ORDENS } from '@/os/exemplos';
import { MINASJATO } from '@/empresas/minasjato';
import { apiDemo } from './api';

describe('a troca de nomes', () => {
  it('troca o mais específico primeiro, senão o curto come o longo', () => {
    expect(texto('WEIR do Brasil Ltda')).toBe('Cliente A Indústria Ltda');
    expect(texto('RIP WEIR-04')).toBe('RIP CLI-A-04');
    expect(texto('Obra Samarco')).toBe('Obra 01');
  });

  it('pega nome de pessoa, lote, certificado e referência de esquema', () => {
    expect(texto('Emerson William de Faria')).toBe('Marcos Teixeira');
    expect(texto('lote 125120112')).toBe('lote 310420881');
    expect(texto('certificado M008200/2026')).toBe('certificado C012740/2026');
    expect(texto('PRO.BRA.DPR.008 Cat. Im3')).toBe('ESQ.CLI-A.004 Cat. Im3');
    expect(texto('250CVX usinado')).toBe('MOD-250 usinado');
  });

  it('não mexe em marca de tinta — é produto de catálogo, não diz nada do cliente', () => {
    expect(texto('INTERSEAL 1509 · International')).toBe('INTERSEAL 1509 · International');
    expect(texto('Jotamastic 80 · Jotun')).toBe('Jotamastic 80 · Jotun');
  });

  it('nem no código de formulário da lista mestra — é o que a tela existe para mostrar', () => {
    expect(texto('FM-001 rev. 00')).toBe('FM-001 rev. 00');
    expect(texto('LM-SGQ-001')).toBe('LM-SGQ-001');
  });

  it('desce em qualquer profundidade, inclusive em campo que ainda não existe', () => {
    const inventado = { a: [{ b: { c: 'WEIR do Brasil Ltda', n: 7 } }], d: null };
    expect(fundo(inventado)).toEqual({ a: [{ b: { c: 'Cliente A Indústria Ltda', n: 7 } }], d: null });
  });
});

describe('nada real sobra depois da troca', () => {
  const limpo = (v: unknown) => vazamentos(JSON.stringify(fundo(v)));

  it('nas quatro ordens de serviço', () => {
    expect(limpo(ORDENS)).toEqual([]);
  });

  it('no perfil da empresa atendida, com os 47 documentos', () => {
    expect(limpo(MINASJATO)).toEqual([]);
  });

  it('nos dados fixos que substituem a API', async () => {
    const api = apiDemo as any;
    const respostas = await Promise.all([
      api['equipment-maintenance'].listAssets.query({}),
      api['compliance-certifications'].listCredentials.query({}),
      api['compliance-certifications'].vencimientosBoard.query({}),
      api['customer-management'].listCustomers.query({}),
    ]);
    expect(limpo(respostas)).toEqual([]);
  });

  it('e o detector acusa de verdade quando sobra', () => {
    // Sem esta, os testes acima passariam mesmo se `vazamentos` sempre devolvesse vazio.
    expect(vazamentos('relatório da WEIR do Brasil Ltda')).toContain('WEIR do Brasil Ltda');
    expect(TROCAS.length).toBeGreaterThan(30);
  });

  it('acha o termo em qualquer caixa — foi assim que dois escaparam para o ar', () => {
    // O pacote publicado trazia `id:"minasjato"` e a frase 'Rip Weir 01'. Os dois estavam
    // cadastrados, mas em OUTRA caixa ('Minasjato', 'WEIR'), e a busca comparava caixa.
    expect(vazamentos('id: minasjato')).toContain('Minasjato');
    expect(vazamentos('Rip Weir 01 OK')).toContain('WEIR');
  });

  it('e devolve na caixa que couber no lugar', () => {
    // Identificador continua identificador: sem espaco e sem acento, senao o perfil some.
    expect(texto('minasjato')).toBe('industria-alfa');
    expect(texto('Rip Weir 01')).toBe('Rip CLI-A 01');
    expect(texto('RIP WEIR-04')).toBe('RIP CLI-A-04');
    expect(texto('Minasjato')).toBe('Indústria Alfa');   // na tela, com acento
  });
});

describe('a API da demonstração', () => {
  it('devolve os formatos que as telas esperam', async () => {
    const api = apiDemo as any;
    const ativos = await api['equipment-maintenance'].listAssets.query({});
    expect(ativos.rows).toHaveLength(4);
    expect(ativos.rows[0]).toHaveProperty('code');

    const painel = await api['compliance-certifications'].vencimientosBoard.query({});
    expect(Object.keys(painel.buckets)).toEqual(['expired', 'd7', 'd15', 'd30', 'later']);
    expect(painel.counts.expired).toBe(0);
  });

  it('procedimento desconhecido devolve lista vazia em vez de estourar', async () => {
    expect(await (apiDemo as any)['modulo-inexistente'].seLaOQue.query({})).toEqual({ rows: [] });
  });

  it('é só leitura: gravar avisa que é demonstração', async () => {
    await expect((apiDemo as any)['customer-management'].createCustomer.mutate({}))
      .rejects.toThrow(/demonstração/);
  });
});
