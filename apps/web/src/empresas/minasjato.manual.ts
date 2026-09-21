// O TEXTO DO MANUAL DA QUALIDADE DA MINASJATO — MQ-001 rev. 00, emitido em 05/03/2026.
//
// Transcrito do arquivo "MANUAL DO SGQ - MJ 2026.docx", elaborado por Vitória Coelho, verificado
// por Gustavo Moreira e aprovado por Leandro Santos. É DADO, e é a letra do documento assinado:
// nada aqui foi reescrito, resumido nem corrigido. Quando o manual for revisado, este arquivo
// acompanha — e o que manda é sempre o arquivo emitido, não esta cópia.
//
// A numeração dos subitens é a do manual, que nem sempre é a da norma: ele agrupa a 7.1 inteira
// sob 7.1.1 a 7.1.4, e trata 9.1.1, 9.1.2 e 9.1.3 como cláusulas separadas. Preservar isso é o
// que faz o auditor pedir "me mostra o 8.2.3" e alguém achar.
import { registrarManual, type ClausulaDoManual } from '@/modules/sgq-manual/texto';

const CLAUSULAS: ClausulaDoManual[] = [
  /* ── 4. Contexto organizacional ─────────────────────────────────────────────────────────── */
  {
    ref: '4.1',
    titulo: 'Conhecendo a Organização e seu Contexto',
    trechos: [{
      paragrafos: [
        'A Minasjato determina questões externas e internas que sejam pertinentes para o seu propósito e para seu direcionamento estratégico e que afetem sua capacidade de alcançar os resultados pretendidos de seu sistema de gestão da qualidade.',
        'A Minasjato monitora e analisa criticamente informações sobre questões externas e internas.',
      ],
    }],
  },
  {
    ref: '4.2',
    titulo: 'Entendendo as Necessidades e Expectativas de Partes Interessadas',
    trechos: [{
      paragrafos: [
        'Em função ao efeito ou potencial efeito sobre a capacidade da Minasjato em prover produtos e serviços consistentes que atendam aos requisitos dos clientes e aos requisitos regulamentares e estatutários aplicáveis, determina-se:',
      ],
      itens: [
        'As partes interessadas pertinentes para o sistema de gestão da qualidade;',
        'Os requisitos dessas partes interessadas pertinentes para o sistema de gestão da qualidade.',
      ],
    }, {
      paragrafos: [
        'A Minasjato monitora e analisa criticamente informações sobre essas partes interessadas e seus requisitos pertinentes.',
      ],
    }],
  },
  {
    ref: '4.3',
    titulo: 'Determinando o Escopo do Sistema de Gestão da Qualidade',
    trechos: [{
      paragrafos: [
        'A Minasjato estabeleceu os limites e a aplicabilidade do sistema de gestão da qualidade para estabelecer o seu escopo. Ao determinar esse escopo, a Minasjato considerou:',
      ],
      itens: [
        'As questões externas e internas;',
        'Os requisitos das partes interessadas pertinentes;',
        'Os produtos e serviços da organização.',
      ],
    }, {
      paragrafos: [
        'A Minasjato aplica os requisitos da norma NBR ISO 9001:2015. O escopo do sistema de gestão da qualidade está disponível e é mantido como informação documentada.',
      ],
      citacao: 'Serviços de tratamento de superfícies, através de jateamento abrasivo, limpeza mecânica e manual, pinturas em geral, manutenção complementar e recuperação de estruturas metálicas de médio porte',
    }],
  },
  {
    ref: '4.4',
    titulo: 'Sistema de Gestão da Qualidade e seus Processos',
    trechos: [{
      sub: '4.4.1',
      titulo: 'Processos do SGQ',
      paragrafos: [
        'A Minasjato estabeleceu, implementou, mantém e melhora continuamente um sistema de gestão da qualidade, incluindo os processos necessários e suas interações, de acordo com os requisitos da NBR ISO 9001:2015. A Minasjato:',
      ],
      itens: [
        'Determinou as entradas requeridas e as saídas esperadas desses processos;',
        'Determinou a sequência e a interação desses processos;',
        'Determina e aplica os requisitos e métodos necessários para assegurar a operação e o controle eficaz desses processos;',
        'Determina os recursos necessários para esses processos e assegura a sua disponibilidade;',
        'Atribui as responsabilidades e autoridades para esses processos;',
        'Aborda os riscos e oportunidades conforme determinados;',
        'Avalia esses processos e implementa quaisquer mudanças necessárias;',
        'Melhora os processos e o sistema de gestão da qualidade.',
      ],
    }, {
      titulo: 'Processos mapeados',
      paragrafos: ['Descrição da sequência e interação entre os processos do SGQ:'],
      itens: [
        'Comercial — responsável: Diretores. Requisitos: 4.4, 8.2.',
        'Produção — responsável: Diretores. Requisitos: 4.4, 8.1, 8.5.',
        'Compras — responsável: Diretores. Requisitos: 4.4, 8.4.',
        'Expedição — responsável: Diretores. Requisitos: 4.4, 8.5.4, 8.5.5.',
        'Direção — responsável: Diretores. Requisitos: 4.4, 5.1, 9.3.',
        'Gestão da Qualidade — responsável: Coordenador da Qualidade. Requisitos: 4.4, 7.5, 8.2, 9.1, 9.2, 9.3.',
        'Recursos Humanos — responsável: Coordenador da Qualidade. Requisitos: 4.4, 7.1.2, 7.2, 7.3.',
      ],
    }, {
      sub: '4.4.2',
      titulo: 'Informação Documentada dos Processos',
      paragrafos: ['Na extensão necessária, a Minasjato:'],
      itens: [
        'Mantém informação documentada para apoiar a operação de seus processos;',
        'Retém informação documentada para ter confiança em que os processos sejam realizados conforme planejado.',
      ],
    }],
  },

  /* ── 5. Liderança ───────────────────────────────────────────────────────────────────────── */
  {
    ref: '5.1',
    titulo: 'Liderança e Comprometimento',
    trechos: [{
      sub: '5.1.1',
      titulo: 'Comprometimento com o SGQ',
      paragrafos: [
        'A Alta Direção da Minasjato demonstra sua liderança e seu comprometimento com relação ao sistema de gestão da qualidade:',
      ],
      itens: [
        'Responsabilizando-se por prestar contas pela eficácia do sistema de gestão da qualidade;',
        'Assegurando que a política da qualidade e os objetivos da qualidade sejam estabelecidos e compatíveis com o contexto e a direção estratégica da organização;',
        'Assegurando a integração dos requisitos do sistema de gestão da qualidade nos processos de negócio da organização;',
        'Promovendo o uso da abordagem de processo e da mentalidade de risco;',
        'Assegurando que os recursos necessários para o sistema de gestão da qualidade estejam disponíveis;',
        'Comunicando a importância de uma gestão da qualidade eficaz e de estar conforme com os requisitos do SGQ;',
        'Assegurando que o sistema de gestão da qualidade alcance seus resultados pretendidos;',
        'Engajando, dirigindo e apoiando pessoas a contribuir para a eficácia do sistema de gestão da qualidade;',
        'Promovendo melhoria;',
        'Apoiando outros papéis pertinentes da gestão a demonstrar como sua liderança se aplica às áreas sob sua responsabilidade.',
      ],
    }, {
      sub: '5.1.2',
      titulo: 'Foco no Cliente',
      paragrafos: [
        'A Alta Direção demonstra liderança e comprometimento com relação ao foco no cliente, assegurando que:',
      ],
      itens: [
        'Os requisitos do cliente e os requisitos estatutários e regulamentares pertinentes sejam determinados, entendidos e atendidos consistentemente;',
        'Os riscos e oportunidades que possam afetar a conformidade de produtos e serviços e a capacidade de aumentar a satisfação do cliente sejam determinados e abordados;',
        'O foco no aumento da satisfação do cliente seja mantido.',
      ],
    }],
  },
  {
    ref: '5.2',
    titulo: 'Política da Qualidade',
    trechos: [{
      sub: '5.2.1',
      titulo: 'Estabelecimento da Política',
      paragrafos: ['A política da qualidade da Minasjato está estabelecida e mantida:'],
      citacao: 'A Minasjato, estabelece em contexto organizacional uma estrutura que apoia o direcionamento estratégico para os objetivos da qualidade, comprometida em satisfazer aos requisitos dos clientes, os requisitos estatutários e regulamentares aplicáveis, comprometendo-se com a melhoria contínua do sistema de gestão da qualidade.',
    }, {
      paragrafos: ['A Alta Direção estabeleceu, implementou e mantém uma política da qualidade que:'],
      itens: [
        'Seja apropriada ao propósito e ao contexto da organização e apoie seu direcionamento estratégico;',
        'Proveja uma estrutura para o estabelecimento dos objetivos da qualidade;',
        'Inclua um comprometimento em satisfazer requisitos aplicáveis;',
        'Inclua um comprometimento com a melhoria contínua do sistema de gestão da qualidade.',
      ],
    }, {
      sub: '5.2.2',
      titulo: 'Comunicando a Política da Qualidade',
      paragrafos: ['A política da qualidade está:'],
      itens: [
        'Disponível e é mantida como informação documentada;',
        'Comunicada, entendida e aplicada na organização;',
        'Disponível para partes interessadas pertinentes, como apropriado.',
      ],
    }],
  },
  {
    ref: '5.3',
    titulo: 'Papéis, Responsabilidade e Autoridades Organizacionais',
    trechos: [{
      paragrafos: [
        'A Alta Direção assegura que as responsabilidades e autoridades para papéis pertinentes sejam atribuídas, comunicadas e entendidas na organização. A Alta Direção atribuiu responsabilidade e autoridade para:',
      ],
      itens: [
        'Assegurar que o sistema de gestão da qualidade esteja conforme com os requisitos da NBR ISO 9001:2015;',
        'Assegurar que os processos entreguem suas saídas pretendidas;',
        'Relatar o desempenho do sistema de gestão da qualidade e as oportunidades para melhoria para a Alta Direção;',
        'Assegurar a promoção do foco no cliente na organização;',
        'Assegurar que a integridade do SGQ seja mantida quando forem planejadas e implementadas mudanças.',
      ],
    }, {
      titulo: 'Organograma',
      paragrafos: [
        'Alta Direção, e abaixo dela: Gestão da Qualidade (SGQ), Gerência Administrativa / Apoio e Gerência de Produção / Operação.',
        'Vinculados à Gerência Administrativa / Apoio: Financeiro, Faturamento, RH / Depto. Pessoal, TI e Comercial / Vendas. Vinculados à Gerência de Produção / Operação: Supervisão, PCP, Compras, Jateamento, Pintura e Expedição.',
      ],
    }, {
      titulo: 'Papéis e responsabilidades',
      itens: [
        'Alta Direção — define o direcionamento estratégico, aprova políticas e objetivos, assegura recursos, acompanha o desempenho do SGQ e promove o foco no cliente e a melhoria contínua.',
        'Gestão da Qualidade (SGQ), ligada diretamente à Alta Direção — mantém e monitora o SGQ, controla informações documentadas pertinentes, acompanha indicadores, apoia auditorias, relata desempenho do sistema e orienta ações de melhoria, riscos e não conformidades.',
        'Gerência Administrativa / Apoio — coordena os processos administrativos e de apoio, assegurando suporte ao negócio, controle de rotinas administrativas, suporte à operação e atendimento aos requisitos do cliente e do SGQ.',
        'Financeiro / Faturamento — executam controles financeiros, fluxo de caixa, contas e emissão de documentos fiscais e comerciais necessários ao funcionamento da empresa.',
        'RH / Depto. Pessoal e TI — o RH / DP gerencia admissões, documentação, apoio à competência e rotinas trabalhistas; a TI assegura suporte aos sistemas, equipamentos e recursos tecnológicos.',
        'Comercial / Vendas — realiza o relacionamento com clientes, levantamento de requisitos, elaboração de propostas, alinhamento comercial e comunicação sobre pedidos e serviços.',
        'Gerência de Produção / Operação — planeja, coordena e controla a operação, assegurando produtividade, cumprimento de prazos, conformidade técnica, integração dos setores operacionais e atendimento aos requisitos aplicáveis.',
        'PCP e Supervisão — o PCP planeja e acompanha ordens de serviço, prioridades e prazos; a Supervisão coordena diretamente as equipes e acompanha a execução das atividades operacionais.',
        'Compras — realiza a aquisição de materiais, insumos e serviços necessários às operações, conforme requisitos definidos e demandas internas aprovadas.',
        'Jateamento / Pintura / Expedição — executam os serviços conforme especificações técnicas e requisitos do cliente, asseguram a conformidade do processo e realizam liberação, acondicionamento, identificação e entrega dos itens concluídos.',
      ],
    }],
  },

  /* ── 6. Planejamento ────────────────────────────────────────────────────────────────────── */
  {
    ref: '6.1',
    titulo: 'Ações para Abordar Riscos e Oportunidades',
    trechos: [{
      sub: '6.1.1',
      titulo: 'Determinação de Riscos e Oportunidades',
      paragrafos: [
        'A Minasjato ao planejar o sistema de gestão da qualidade considera as questões referidas em 4.1 e os requisitos referidos em 4.2 e determina os riscos e oportunidades que precisam ser abordados para:',
      ],
      itens: [
        'Assegurar que o sistema de gestão da qualidade possa alcançar seus resultados pretendidos;',
        'Aumentar efeitos desejáveis;',
        'Prevenir, ou reduzir efeitos indesejáveis;',
        'Alcançar melhoria.',
      ],
    }, {
      sub: '6.1.2',
      titulo: 'Planejamento de Ações',
      paragrafos: ['A Minasjato planeja:'],
      itens: [
        'Ações para abordar esses riscos e oportunidades;',
        'Integração e implantação de ações nos processos do seu sistema de gestão da qualidade;',
        'Avaliação da eficácia dessas ações.',
      ],
    }],
  },
  {
    ref: '6.2',
    titulo: 'Objetivos da Qualidade e Planejamento para Alcançá-los',
    trechos: [{
      sub: '6.2.1',
      titulo: 'Estabelecimento dos Objetivos',
      paragrafos: [
        'A Minasjato estabelece os objetivos da qualidade nas funções, níveis e processos pertinentes. Os objetivos da qualidade:',
      ],
      itens: [
        'São coerentes com a política da qualidade;',
        'São mensuráveis;',
        'Levam em conta requisitos aplicáveis;',
        'São pertinentes para a conformidade de produtos e serviços e para aumentar a satisfação do cliente;',
        'São monitorados, comunicados e atualizados como apropriado.',
      ],
    }, {
      sub: '6.2.2',
      titulo: 'Planejamento para Alcançar os Objetivos',
      paragrafos: ['A Minasjato ao planejar como alcançar seus objetivos da qualidade, determina:'],
      itens: [
        'O que será feito;',
        'Quais recursos serão requeridos;',
        'Quem será responsável;',
        'Quando isso será concluído;',
        'Como os resultados serão avaliados.',
      ],
    }],
  },
  {
    ref: '6.3',
    titulo: 'Planejamento de Mudanças',
    trechos: [{
      paragrafos: [
        'A Minasjato quando determina a necessidade de mudanças no sistema de gestão da qualidade, as mudanças são realizadas de uma maneira planejada e sistemática. A Minasjato considera:',
      ],
      itens: [
        'O propósito das mudanças e suas potenciais consequências;',
        'A integridade do sistema de gestão da qualidade;',
        'A disponibilidade de recursos;',
        'A alocação ou realocação de responsabilidades e autoridades.',
      ],
    }],
  },

  /* ── 7. Apoio ───────────────────────────────────────────────────────────────────────────── */
  {
    ref: '7.1',
    titulo: 'Recursos',
    trechos: [{
      sub: '7.1.1',
      titulo: 'Generalidades',
      paragrafos: [
        'A Minasjato determina e provê os recursos necessários para o estabelecimento, implementação, manutenção e melhoria contínua do sistema de gestão da qualidade. A Minasjato considera:',
      ],
      itens: [
        'As capacidades e restrições de recursos internos existentes;',
        'O que precisa ser obtido dos provedores externos.',
      ],
    }, {
      sub: '7.1.2',
      titulo: 'Pessoas',
      paragrafos: [
        'A Minasjato determina e provê as pessoas necessárias para a implementação eficaz do seu sistema de gestão da qualidade e para a operação e controle de seus processos.',
      ],
    }, {
      sub: '7.1.3',
      titulo: 'Infraestrutura',
      paragrafos: [
        'A Minasjato determina, provê e mantém a infraestrutura necessária para a operação dos seus processos e para alcançar a conformidade de produtos e serviços.',
      ],
      nota: 'Infraestrutura pode incluir: (a) Edifícios e utilidades associadas; (b) Equipamento, incluindo materiais, máquinas, ferramentas e software; (c) Recursos para transporte; (d) Tecnologia da informação e de comunicação.',
    }, {
      sub: '7.1.4',
      titulo: 'Ambiente para a Operação dos Processos',
      paragrafos: [
        'A Minasjato determina, provê e mantém um ambiente necessário para a operação de seus processos e para alcançar a conformidade de produtos e serviços.',
      ],
      nota: 'Um ambiente adequado pode ser a combinação de fatores humanos e físicos: (a) social (não discriminatório, calmo); (b) psicológico (redutor de estresse, emocionalmente protetor); (c) físico (temperatura, umidade, luz, ruído).',
    }],
  },
  {
    ref: '7.1.5',
    titulo: 'Recursos de Monitoramento e Medição',
    trechos: [{
      paragrafos: [
        'A Minasjato determina e provê os recursos necessários para assegurar resultados válidos e confiáveis quando monitoramento ou medição for usado para verificar a conformidade de produtos e serviços. A organização assegura que os recursos providos:',
      ],
      itens: [
        'Sejam adequados para o tipo específico de atividades de monitoramento e medição assumidas;',
        'Sejam mantidos para assegurar que estejam continuamente apropriados aos seus propósitos.',
      ],
    }, {
      paragrafos: ['Quando a rastreabilidade de medição for um requisito, os equipamentos de medição devem ser:'],
      itens: [
        'Verificados ou calibrados a intervalos especificados, contra padrões de medição rastreáveis a padrões internacionais ou nacionais;',
        'Identificados para determinar sua situação;',
        'Salvaguardados contra ajustes, danos ou deterioração.',
      ],
    }],
  },
  {
    ref: '7.1.6',
    titulo: 'Conhecimento Organizacional',
    trechos: [{
      paragrafos: [
        'A organização determina o conhecimento necessário para a operação de seus processos e para alcançar a conformidade de produtos e serviços. Esse conhecimento deve ser mantido e estar disponível na extensão necessária.',
      ],
      nota: 'Conhecimento organizacional pode ser baseado em fontes internas (propriedade intelectual, lições aprendidas, melhorias em processos) ou externas (normas, academia, conferências, clientes ou provedores externos).',
    }],
  },
  {
    ref: '7.2',
    titulo: 'Competência',
    trechos: [{
      paragrafos: ['A Minasjato:'],
      itens: [
        'Determina a competência necessária de pessoa(s) que realize(m) trabalho sob o seu controle que afete o desempenho e a eficácia do SGQ;',
        'Assegura que essas pessoas sejam competentes, com base em educação, treinamento ou experiência apropriados;',
        'Onde aplicável, toma ações para adquirir a competência necessária e avalia a eficácia das ações tomadas;',
        'Retém informação documentada apropriada como evidência da competência.',
      ],
    }],
  },
  {
    ref: '7.3',
    titulo: 'Conscientização',
    trechos: [{
      paragrafos: [
        'A Minasjato assegura que as pessoas que realizam trabalhos sob o controle da organização estejam conscientes:',
      ],
      itens: [
        'Da política da qualidade;',
        'Dos objetivos da qualidade pertinentes;',
        'De sua contribuição para a eficácia do sistema de gestão da qualidade;',
        'Das implicações de não estar conforme com os requisitos do sistema de gestão da qualidade.',
      ],
    }],
  },
  {
    ref: '7.4',
    titulo: 'Comunicação',
    trechos: [{
      paragrafos: [
        'A Minasjato determina as comunicações internas e externas pertinentes para o sistema de gestão da qualidade, incluindo: sobre o que comunicar; quando comunicar; com quem se comunicar; como comunicar; quem comunica.',
      ],
    }],
  },
  {
    ref: '7.5',
    titulo: 'Informação Documentada',
    trechos: [{
      sub: '7.5.1',
      titulo: 'Generalidades',
      paragrafos: ['O sistema de gestão da qualidade da Minasjato inclui:'],
      itens: [
        'Informação documentada requerida pela Norma NBR ISO 9001:2015;',
        'Informação documentada determinada pela Minasjato como sendo necessária para a eficácia do sistema de gestão da qualidade.',
      ],
    }, {
      sub: '7.5.2',
      titulo: 'Criando e Atualizando',
      paragrafos: ['Ao criar e atualizar informação documentada, a Minasjato assegura:'],
      itens: [
        'Identificação e descrição (título, data, autor ou número de referência);',
        'Formato (linguagem, versão do software, gráficos) e meio (papel, eletrônico);',
        'Análise crítica e aprovação quanto à adequação e suficiência.',
      ],
    }, {
      sub: '7.5.3',
      titulo: 'Controle de Informação Documentada',
      paragrafos: ['A Minasjato controla toda informação documentada requerida pelo SGQ para assegurar que:'],
      itens: [
        'Ela esteja disponível e adequada para uso, onde e quando ela for necessária;',
        'Ela esteja protegida suficientemente contra perda de confidencialidade, uso impróprio ou perda de integridade.',
      ],
    }, {
      paragrafos: ['Para o controle de informação documentada, a Minasjato aborda:'],
      itens: [
        'Distribuição, acesso, recuperação e uso;',
        'Armazenamento e preservação, incluindo preservação de legibilidade;',
        'Controle de alterações (controle de versão);',
        'Retenção e disposição.',
      ],
    }],
  },

  /* ── 8. Operação ────────────────────────────────────────────────────────────────────────── */
  {
    ref: '8.1',
    titulo: 'Planejamento e Controle Operacionais',
    trechos: [{
      paragrafos: [
        'A Minasjato planeja, implementa e controla os processos necessários para atender aos requisitos para a provisão de produtos e serviços. A Minasjato:',
      ],
      itens: [
        'Determina os requisitos para os produtos e serviços;',
        'Estabelece critérios para os processos e para a aceitação de produtos e serviços;',
        'Determina os recursos necessários para alcançar conformidade;',
        'Implementa controle de processos de acordo com os critérios;',
        'Determina e conserva informação documentada na extensão necessária.',
      ],
    }, {
      paragrafos: [
        'A Minasjato controla mudanças planejadas e analisa criticamente as consequências de mudanças não intencionais, tomando ações para mitigar quaisquer efeitos adversos.',
      ],
    }],
  },
  {
    ref: '8.2',
    titulo: 'Requisitos para Produtos e Serviços',
    trechos: [{
      sub: '8.2.1',
      titulo: 'Comunicação com o Cliente',
      paragrafos: ['A comunicação com clientes inclui:'],
      itens: [
        'Prover informação relativa a produtos e serviços;',
        'Lidar com consultas, contratos ou pedidos, incluindo mudanças;',
        'Obter retroalimentação do cliente relativa a produtos e serviços, incluindo reclamações;',
        'Lidar ou controlar propriedade do cliente;',
        'Estabelecer requisitos específicos para ações de contingência, quando pertinente.',
      ],
    }, {
      sub: '8.2.2',
      titulo: 'Determinação de Requisitos relativos a Produtos e Serviços',
      paragrafos: [
        'Ao determinar requisitos para os produtos e serviços, a Minasjato assegura que os requisitos são definidos, incluindo requisitos estatutários e regulamentares aplicáveis, e que a organização possa atender aos pleitos para os produtos e serviços que ela oferece.',
      ],
    }, {
      sub: '8.2.3',
      titulo: 'Análise Crítica de Requisitos',
      paragrafos: [
        'A Minasjato conduz uma análise crítica antes de se comprometer a fornecer produtos e serviços, para incluir:',
      ],
      itens: [
        'Requisito especificado pelo cliente, incluindo os requisitos para atividades de entrega e pós-entrega;',
        'Requisitos não declarados pelo cliente, mas necessários para o uso especificado ou pretendido;',
        'Requisitos especificados pela organização;',
        'Requisitos estatutários e regulamentares aplicáveis a produtos e serviços;',
        'Requisitos de contrato ou pedido diferentes daqueles previamente expressos.',
      ],
    }, {
      sub: '8.2.4',
      titulo: 'Mudanças nos Requisitos para Produtos e Serviços',
      paragrafos: [
        'A Minasjato assegura que informação documentada pertinente seja emendada e que pessoas pertinentes sejam alertadas dos requisitos mudados, quando os requisitos para produtos e serviços forem mudados.',
      ],
    }],
  },
  {
    ref: '8.3',
    titulo: 'Projeto e Desenvolvimento de Produtos e Serviços',
    trechos: [{
      paragrafos: ['Este item não se aplica ao negócio da Minasjato, conforme justificativa abaixo:'],
      citacao: 'A Minasjato não desenvolve especificações de pintura, apenas executa os trabalhos conforme os requisitos definidos pelo contratante.',
    }],
  },
  {
    ref: '8.4',
    titulo: 'Controle de Processos, Produtos e Serviços Providos Externamente',
    trechos: [{
      sub: '8.4.1',
      titulo: 'Generalidades',
      paragrafos: [
        'A Minasjato assegura que processos, produtos e serviços providos externamente estejam conformes com requisitos e determina os controles a serem aplicados quando:',
      ],
      itens: [
        'Produtos e serviços de provedores externos forem destinados a incorporação nos produtos e serviços da própria organização;',
        'Produtos e serviços forem providos diretamente para o(s) cliente(s) por provedores externos em nome da organização;',
        'Um processo, ou parte de um processo, for provido por um provedor externo.',
      ],
    }, {
      sub: '8.4.2',
      titulo: 'Tipo e Extensão do Controle',
      paragrafos: [
        'A Minasjato assegura que processos, produtos e serviços providos externamente não afetem adversamente a capacidade da organização. A organização deve:',
      ],
      itens: [
        'Assegurar que processos providos externamente permaneçam sob o controle do seu sistema de gestão da qualidade;',
        'Definir os controles que ela pretende aplicar a um provedor externo e às saídas resultantes;',
        'Considerar o impacto potencial dos processos, produtos e serviços providos externamente;',
        'Determinar a verificação necessária para assegurar que os processos, produtos e serviços providos externamente atendam a requisitos.',
      ],
    }, {
      sub: '8.4.3',
      titulo: 'Informação para Provedores Externos',
      paragrafos: [
        'A Minasjato assegura a suficiência de requisitos antes de sua comunicação para o provedor externo. A Minasjato comunica seus requisitos para:',
      ],
      itens: [
        'Os processos, produtos e serviços a serem providos;',
        'A aprovação de produtos, serviços, métodos, processos e equipamentos;',
        'Competência, incluindo qualificação de pessoas requerida;',
        'Controle e monitoramento do desempenho do provedor externo.',
      ],
    }],
  },
  {
    ref: '8.5.1',
    titulo: 'Controle de Produção e de Provisão de Serviço',
    trechos: [{
      paragrafos: [
        'A Minasjato implementa produção e provisão de serviço sob condições controladas, incluindo:',
      ],
      itens: [
        'A disponibilidade de informação documentada que defina as características dos produtos/serviços e os resultados a serem alcançados;',
        'A disponibilidade e uso de recursos de monitoramento e medição adequados;',
        'A implementação de atividades de monitoramento e medição em estágios apropriados;',
        'O uso da infraestrutura e ambientes adequados para a operação dos processos;',
        'A designação de pessoas competentes, incluindo qualquer qualificação requerida;',
        'A implementação de ações para prevenir erro humano;',
        'A implementação de atividades de liberação, entrega e pós-entrega.',
      ],
    }],
  },
  {
    ref: '8.5.2',
    titulo: 'Identificação e Rastreabilidade',
    trechos: [{
      paragrafos: [
        'A Minasjato usa meios adequados para identificar saídas quando for necessário assegurar a conformidade de produtos e serviços. A Minasjato identifica a situação das saídas com relação aos requisitos de monitoramento e medição ao longo da produção e provisão de serviço.',
      ],
    }],
  },
  {
    ref: '8.5.3',
    titulo: 'Propriedade Pertencente a Clientes ou Provedores Externos',
    trechos: [{
      paragrafos: [
        'A Minasjato toma cuidado com propriedade pertencente a clientes ou provedores externos enquanto estiver sob o controle da organização. A Minasjato identifica, verifica, protege e salvaguarda propriedade de clientes ou provedores externos.',
      ],
    }],
  },
  {
    ref: '8.5.4',
    titulo: 'Preservação',
    trechos: [{
      paragrafos: [
        'A Minasjato preserva as saídas durante produção e provisão de serviço na extensão necessária, para assegurar conformidade com requisitos.',
      ],
      nota: 'Preservação pode incluir identificação, manuseio, controle de contaminação, embalagem, armazenamento, transmissão ou transporte e proteção.',
    }],
  },
  {
    ref: '8.5.5',
    titulo: 'Atividades Pós-Entrega',
    trechos: [{
      paragrafos: [
        'A Minasjato atende aos requisitos para atividades pós-entrega associadas com os produtos e serviços. Na determinação da extensão das atividades pós-entrega, a organização considera os requisitos estatutários e regulamentares, as consequências indesejáveis potenciais, a natureza e uso de seus produtos e serviços, requisitos do cliente e retroalimentação de cliente.',
      ],
    }],
  },
  {
    ref: '8.5.6',
    titulo: 'Controle de Mudanças',
    trechos: [{
      paragrafos: [
        'A Minasjato analisa criticamente e controla mudanças para produção ou provisão de serviços na extensão necessária para assegurar continuamente conformidade com requisitos.',
      ],
    }],
  },
  {
    ref: '8.6',
    titulo: 'Liberação de Produtos e Serviços',
    trechos: [{
      paragrafos: [
        'A Minasjato implementa arranjos planejados, em estágios apropriados, para verificar se os requisitos do produto e do serviço foram atendidos. A liberação de produtos e serviços para o cliente não pode proceder até que os arranjos planejados forem satisfatoriamente concluídos.',
        'A Minasjato retém informação documentada sobre a liberação de produtos e serviços incluindo: (a) Evidência de conformidade com os critérios de aceitação; (b) Rastreabilidade à(s) pessoa(s) que autoriza(m) a liberação.',
      ],
    }],
  },
  {
    ref: '8.7',
    titulo: 'Controle de Saídas Não Conformes',
    trechos: [{
      paragrafos: [
        'A Minasjato assegura que saídas que não estejam conformes com seus requisitos sejam identificadas e controladas para prevenir seu uso ou entrega não pretendida. A Minasjato lida com saídas não conformes de um ou mais dos seguintes modos:',
      ],
      itens: [
        'Correção;',
        'Segregação, contenção, retorno ou suspensão de provisão de produtos e serviços;',
        'Informação ao cliente;',
        'Obtenção de autorização para aceitação sob concessão.',
      ],
    }, {
      paragrafos: [
        'A Minasjato retém informação documentada que descreve a não conformidade, as ações tomadas, as concessões obtidas e identifica a autoridade que decide a ação.',
      ],
    }],
  },

  /* ── 9. Avaliação de desempenho ─────────────────────────────────────────────────────────── */
  {
    ref: '9.1.1',
    titulo: 'Monitoramento, Medição, Análise e Avaliação — Generalidades',
    trechos: [{
      paragrafos: ['A Minasjato determina:'],
      itens: [
        'O que precisa ser monitorado e medido;',
        'Os métodos para monitoramento, medição, análise e avaliação necessários para assegurar resultados válidos;',
        'Quando o monitoramento e a medição devem ser realizados;',
        'Quando os resultados de monitoramento e medição devem ser analisados e avaliados.',
      ],
    }, {
      paragrafos: [
        'A Minasjato avalia o desempenho e a eficácia do sistema de gestão da qualidade e retém informação documentada como evidência dos resultados.',
      ],
    }],
  },
  {
    ref: '9.1.2',
    titulo: 'Satisfação do Cliente',
    trechos: [{
      paragrafos: [
        'A Minasjato monitora a percepção de clientes do grau em que suas necessidades e expectativas foram atendidas. A Minasjato determina os métodos para obter, monitorar e analisar criticamente essa informação.',
      ],
      nota: 'Exemplos de monitoramento das percepções de cliente podem incluir pesquisas com o cliente, retroalimentação do cliente sobre produtos ou serviços entregues, reuniões com clientes, análise da participação de mercado, elogios, pleitos de garantia e relatórios de distribuidor.',
    }],
  },
  {
    ref: '9.1.3',
    titulo: 'Análise e Avaliação',
    trechos: [{
      paragrafos: [
        'A Minasjato analisa e avalia os dados e informações apropriados provenientes de monitoramento e medição. Os resultados de análises são utilizados para avaliar:',
      ],
      itens: [
        'Conformidade de produtos e serviços;',
        'O grau de satisfação do cliente;',
        'O desempenho e a eficácia do sistema de gestão da qualidade;',
        'Se o planejamento foi implementado eficazmente;',
        'A eficácia das ações tomadas para abordar riscos e oportunidades;',
        'O desempenho de provedores externos;',
        'A necessidade de melhorias no sistema de gestão da qualidade.',
      ],
    }],
  },
  {
    ref: '9.2',
    titulo: 'Auditoria Interna',
    trechos: [{
      sub: '9.2.1',
      titulo: 'Objetivo das Auditorias Internas',
      paragrafos: [
        'A Minasjato conduz auditorias internas a intervalos planejados para prover informação sobre se o sistema de gestão da qualidade:',
      ],
      itens: [
        'Está conforme com os requisitos da própria organização para o seu sistema de gestão da qualidade e com os requisitos da Norma NBR ISO 9001:2015;',
        'Está implementado e mantido eficazmente.',
      ],
    }, {
      sub: '9.2.2',
      titulo: 'Programa de Auditoria',
      paragrafos: ['A Minasjato:'],
      itens: [
        'Planeja, estabelece, implementa e mantém um programa de auditoria, incluindo a frequência, métodos, responsabilidades e requisitos para planejar e para relatar;',
        'Define os critérios de auditoria e o escopo para cada auditoria;',
        'Seleciona auditores e conduz auditorias para assegurar a objetividade e a imparcialidade do processo de auditoria;',
        'Assegura que os resultados das auditorias sejam relatados para a gerência pertinente;',
        'Executa correção e ações corretivas apropriadas sem demora indevida;',
        'Retém informação documentada como evidência da implementação do programa de auditoria e dos resultados de auditoria.',
      ],
    }],
  },
  {
    ref: '9.3',
    titulo: 'Análise Crítica pela Direção',
    trechos: [{
      sub: '9.3.1',
      titulo: 'Generalidades',
      paragrafos: [
        'A Alta Direção analisa criticamente o sistema de gestão da qualidade da organização, a intervalos planejados, para assegurar sua contínua adequação, suficiência, eficácia e alinhamento com o direcionamento estratégico da organização.',
      ],
    }, {
      sub: '9.3.2',
      titulo: 'Entradas de Análise Crítica pela Direção',
      paragrafos: ['A análise crítica pela direção é planejada e realizada levando em consideração:'],
      itens: [
        'A situação de ações provenientes de análises críticas anteriores pela direção;',
        'Mudanças em questões externas e internas pertinentes para o sistema de gestão da qualidade;',
        'Informação sobre o desempenho e a eficácia do SGQ, incluindo tendências relativas a: satisfação do cliente, extensão em que os objetivos da qualidade foram alcançados, desempenho de processo, não conformidades, ações corretivas, resultados de monitoramento, medição e auditoria, desempenho de provedores externos;',
        'A suficiência de recursos;',
        'A eficácia de ações tomadas para abordar riscos e oportunidades;',
        'Oportunidades para melhoria.',
      ],
    }, {
      sub: '9.3.3',
      titulo: 'Saídas de Análise Crítica pela Direção',
      paragrafos: ['As saídas da análise crítica pela direção incluem decisões e ações relacionadas com:'],
      itens: [
        'Oportunidades para melhoria;',
        'Qualquer necessidade de mudanças no sistema de gestão da qualidade;',
        'Necessidade de recursos.',
      ],
    }, {
      paragrafos: [
        'A Minasjato retém informação documentada como evidência dos resultados de análises críticas pela direção.',
      ],
    }],
  },

  /* ── 10. Melhoria ───────────────────────────────────────────────────────────────────────── */
  {
    ref: '10.1',
    titulo: 'Generalidades',
    trechos: [{
      paragrafos: [
        'A Minasjato determina e seleciona oportunidades para melhoria e implementa quaisquer ações necessárias para atender a requisitos do cliente e aumentar a satisfação do cliente. Essas ações incluem:',
      ],
      itens: [
        'Melhorar produtos e serviços para atender a requisitos e abordar futuras necessidades e expectativas;',
        'Corrigir, prevenir ou reduzir efeitos indesejados;',
        'Melhorar o desempenho e a eficácia do sistema de gestão da qualidade.',
      ],
      nota: 'Exemplos de melhoria podem incluir correção, ação corretiva, melhoria contínua, mudanças revolucionárias, inovação e reorganização.',
    }],
  },
  {
    ref: '10.2',
    titulo: 'Não Conformidade e Ação Corretiva',
    trechos: [{
      sub: '10.2.1',
      titulo: 'Tratamento de Não Conformidades',
      paragrafos: ['Ao ocorrer uma não conformidade, incluindo as provenientes de reclamações, a Minasjato:'],
      itens: [
        'Reage à não conformidade: toma ação para controlá-la e corrigi-la, e lida com as consequências;',
        'Avalia a necessidade de ação para eliminar a(s) causa(s) da não conformidade, a fim de que ela não se repita: analisando criticamente a não conformidade; determinando as causas; determinando se não conformidades similares existem ou poderiam ocorrer;',
        'Implementa qualquer ação necessária;',
        'Analisa criticamente a eficácia de qualquer ação corretiva tomada;',
        'Atualiza riscos e oportunidades determinados durante o planejamento, se necessário;',
        'Realiza mudanças no sistema de gestão da qualidade, se necessário.',
      ],
    }, {
      paragrafos: ['Ações corretivas são apropriadas aos efeitos das não conformidades encontradas.'],
    }, {
      sub: '10.2.2',
      titulo: 'Informação Documentada sobre Não Conformidades',
      paragrafos: ['A Minasjato retém informação documentada como evidência:'],
      itens: [
        'Da natureza das não conformidades e quaisquer ações subsequentes tomadas;',
        'Dos resultados de qualquer ação corretiva.',
      ],
    }],
  },
  {
    ref: '10.3',
    titulo: 'Melhoria Contínua',
    trechos: [{
      paragrafos: [
        'A Minasjato melhora continuamente a adequação, suficiência e eficácia do sistema de gestão da qualidade.',
        'A Minasjato considera os resultados de análise e avaliação e as saídas de análise crítica pela direção para determinar se existem necessidades ou oportunidades que devem ser abordadas como parte de melhoria contínua.',
      ],
    }],
  },
];

registrarManual('minasjato', { codigo: 'MQ-001', clausulas: CLAUSULAS });
