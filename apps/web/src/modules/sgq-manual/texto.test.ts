// O TEXTO DO MANUAL. O que estes testes guardam é a afirmação que originou tudo isto: o manual da
// qualidade JÁ DESCREVE cada cláusula da norma. Se um dia descrever menos, é aqui que se vê.
import { describe, it, expect, beforeEach } from 'vitest';
import '@/empresas';
import { definirEmpresaAtiva } from '@/plataforma/empresa';
import { doc } from '@/modules/sgq-documentos/listaMestra';
import { CLAUSULAS } from './norma';
import { clausulasEscritas, corridoDo, manualDaEmpresa, textoDaClausula } from './texto';

describe('o manual da empresa 01 descreve a norma inteira', () => {
  beforeEach(() => definirEmpresaAtiva('minasjato'));

  it('as 37 cláusulas da norma têm texto — nenhuma ficou de fora', () => {
    // É o fato que a consultoria afirmou em 21/09/2026, e que o app estava ignorando: o manual
    // percorre a norma inteira. O sistema tratava como "falta" o que já estava escrito.
    const escritas = new Set(clausulasEscritas());
    const semTexto = CLAUSULAS.filter((x) => !escritas.has(x.ref)).map((x) => x.ref);
    expect(semTexto).toEqual([]);
    expect(escritas.size).toBe(CLAUSULAS.length);
  });

  it('o texto é o do documento emitido, não um resumo', () => {
    const c74 = textoDaClausula('7.4')!;
    expect(c74.titulo).toBe('Comunicação');
    // As cinco perguntas da 7.4 estão na letra do manual.
    for (const pedaco of ['sobre o que comunicar', 'quando comunicar', 'com quem se comunicar',
      'como comunicar', 'quem comunica']) {
      expect(corridoDo(c74.trechos[0]), pedaco).toContain(pedaco);
    }
  });

  it('a exclusão da 8.3 vem com a justificativa junto — sem ela é lacuna, não exclusão', () => {
    const c83 = textoDaClausula('8.3')!;
    expect(c83.trechos[0].citacao).toContain('não desenvolve especificações de pintura');
  });

  it('a numeração dos subitens do manual é preservada', () => {
    // O auditor pede "me mostra o 8.2.3". Achatar a cláusula num parágrafo só perderia o endereço.
    const c82 = textoDaClausula('8.2')!;
    expect(c82.trechos.map((t) => t.sub)).toEqual(['8.2.1', '8.2.2', '8.2.3', '8.2.4']);
    const c71 = textoDaClausula('7.1')!;
    expect(c71.trechos.map((t) => t.sub)).toEqual(['7.1.1', '7.1.2', '7.1.3', '7.1.4']);
  });

  it('o manual responde pelo código que a lista mestra lhe deu', () => {
    // Se alguém renumerar o manual na lista mestra e esquecer aqui, o texto gravado na tela vai
    // para um código órfão. Este teste é a corda entre os dois.
    const manual = manualDaEmpresa()!;
    expect(manual.codigo).toBe('MQ-001');
    expect(doc(manual.codigo).natureza).toBe('manual');
  });

  it('e não é exemplo: é documento assinado', () => {
    expect(manualDaEmpresa()!.exemplo).toBeUndefined();
  });

  it('procurar a cláusula NÃO devolve o texto da mãe', () => {
    // Responder a 8.5.5 com o texto da 8.5 seria dizer que está coberta quando não está. O manual
    // dela tem entrada própria; o que não pode é a busca inventar uma.
    expect(textoDaClausula('8.5.5')!.titulo).toBe('Atividades Pós-Entrega');
    expect(textoDaClausula('8.5')).toBeNull();   // o manual não escreve a 8.5 em bloco
    expect(textoDaClausula('9.9')).toBeNull();
  });
});

describe('o modelo traz exemplo, e diz que é exemplo', () => {
  beforeEach(() => definirEmpresaAtiva('modelo'));

  it('cobre as mesmas 37 cláusulas — o cliente novo não começa da página em branco', () => {
    const escritas = new Set(clausulasEscritas());
    expect(CLAUSULAS.filter((x) => !escritas.has(x.ref)).map((x) => x.ref)).toEqual([]);
  });

  it('está marcado como exemplo, e é isso que abre a edição na tela', () => {
    expect(manualDaEmpresa()!.exemplo).toBe(true);
    expect(manualDaEmpresa()!.codigo).toBe('MQ-004');
    expect(doc('MQ-004').natureza).toBe('manual');
  });

  it('o texto do modelo não nomeia empresa nenhuma', () => {
    // "A EMPRESA" em caixa alta é o que se troca primeiro. Nome de cliente vazado para o molde
    // apareceria no manual do próximo — e é o erro que este projeto inteiro evita.
    const tudo = clausulasEscritas()
      .map((ref) => textoDaClausula(ref)!.trechos.map(corridoDo).join(' '))
      .join(' ')
      .toLowerCase();
    for (const nome of ['minasjato', 'weir', 'interseal', 'jotun']) {
      expect(tudo, nome).not.toContain(nome);
    }
    expect(textoDaClausula('4.1')!.trechos[0].paragrafos![0]).toContain('A EMPRESA');
  });

  it('trocar de empresa troca o manual, sem ninguém limpar nada', () => {
    expect(manualDaEmpresa()!.codigo).toBe('MQ-004');
    definirEmpresaAtiva('minasjato');
    expect(manualDaEmpresa()!.codigo).toBe('MQ-001');
    expect(textoDaClausula('4.1')!.trechos[0].paragrafos![0]).toContain('A Minasjato');
  });
});
