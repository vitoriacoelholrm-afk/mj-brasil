// O MANUAL DA EMPRESA MODELO — o rascunho que o próximo cliente recebe pronto.
//
// Não é o manual de ninguém: é EXEMPLO, e a tela diz isso em toda cláusula. Existe porque manual
// nenhum nasce da página em branco — nasce de um texto que alguém já escreveu e que se ajusta ao
// que a empresa realmente faz.
//
// Por isso cada cláusula traz o parágrafo neutro e, quando a norma enumera, a enumeração que ela
// exige. "A EMPRESA" fica em caixa alta de propósito: é o que se troca primeiro, e uma palavra em
// caixa alta que sobrou no texto final salta aos olhos de quem revisa.
//
// Aqui, e SÓ aqui, a coordenação da qualidade escreve direto na tela. O porquê está em
// `plataforma/acesso.ts`, em `podeEditarOModelo`: o modelo não é registro de cliente nenhum, é o
// produto da consultoria. No cliente, quem escreve é a empresa.
import { registrarManual, type ClausulaDoManual } from '@/modules/sgq-manual/texto';

const um = (ref: string, titulo: string, texto: string, itens?: string[]): ClausulaDoManual => ({
  ref, titulo, trechos: [{ paragrafos: [texto], ...(itens ? { itens } : {}) }],
});

const CLAUSULAS: ClausulaDoManual[] = [
  um('4.1', 'Conhecendo a Organização e seu Contexto',
    'A EMPRESA determina as questões externas e internas pertinentes ao seu propósito e ao seu direcionamento estratégico, e que afetem sua capacidade de alcançar os resultados pretendidos do sistema de gestão da qualidade. Essas questões são monitoradas e analisadas criticamente.'),

  um('4.2', 'Entendendo as Necessidades e Expectativas de Partes Interessadas',
    'A EMPRESA determina as partes interessadas pertinentes ao sistema de gestão da qualidade e os requisitos dessas partes, monitorando e analisando criticamente essas informações.',
    ['Clientes — requisitos contratuais, prazo e conformidade do serviço;',
     'Colaboradores — condições de trabalho, competência e segurança;',
     'Fornecedores — requisitos de fornecimento e prazo de pagamento;',
     'Órgãos reguladores — requisitos estatutários e regulamentares aplicáveis.']),

  um('4.3', 'Determinando o Escopo do Sistema de Gestão da Qualidade',
    'A EMPRESA estabeleceu os limites e a aplicabilidade do sistema de gestão da qualidade considerando as questões externas e internas, os requisitos das partes interessadas pertinentes e os seus produtos e serviços. O escopo é mantido como informação documentada.'),

  um('4.4', 'Sistema de Gestão da Qualidade e seus Processos',
    'A EMPRESA estabeleceu, implementou, mantém e melhora continuamente o sistema de gestão da qualidade, incluindo os processos necessários e suas interações.',
    ['Determinou as entradas requeridas e as saídas esperadas de cada processo;',
     'Determinou a sequência e a interação entre eles;',
     'Determina os critérios, métodos e recursos necessários para operá-los e controlá-los;',
     'Atribui responsabilidades e autoridades;',
     'Aborda os riscos e oportunidades determinados;',
     'Avalia os processos e implementa as mudanças necessárias.']),

  um('5.1', 'Liderança e Comprometimento',
    'A Alta Direção da EMPRESA demonstra liderança e comprometimento com o sistema de gestão da qualidade, responsabilizando-se por prestar contas pela sua eficácia, assegurando os recursos necessários, comunicando a importância da gestão da qualidade e promovendo a melhoria. Demonstra o mesmo comprometimento com o foco no cliente, assegurando que os requisitos do cliente e os requisitos estatutários e regulamentares sejam determinados, entendidos e atendidos.'),

  um('5.2', 'Política da Qualidade',
    'A Alta Direção estabeleceu, implementou e mantém a política da qualidade, apropriada ao propósito e ao contexto da EMPRESA, que provê uma estrutura para os objetivos da qualidade e inclui o comprometimento em satisfazer requisitos aplicáveis e com a melhoria contínua. A política é mantida como informação documentada, comunicada e entendida na organização e disponível às partes interessadas pertinentes.'),

  um('5.3', 'Papéis, Responsabilidade e Autoridades Organizacionais',
    'A Alta Direção assegura que as responsabilidades e autoridades para papéis pertinentes sejam atribuídas, comunicadas e entendidas na organização, incluindo a responsabilidade por assegurar a conformidade do sistema com a norma, por relatar o seu desempenho à Alta Direção e por manter a integridade do sistema quando mudanças forem planejadas e implementadas. O organograma e a tabela de papéis compõem esta cláusula.'),

  um('6.1', 'Ações para Abordar Riscos e Oportunidades',
    'Ao planejar o sistema de gestão da qualidade, a EMPRESA considera as questões de 4.1 e os requisitos de 4.2 e determina os riscos e oportunidades que precisam ser abordados para assegurar que o sistema alcance os resultados pretendidos, aumentar efeitos desejáveis, prevenir ou reduzir efeitos indesejáveis e alcançar melhoria. As ações são planejadas, integradas aos processos e têm sua eficácia avaliada.'),

  um('6.2', 'Objetivos da Qualidade e Planejamento para Alcançá-los',
    'A EMPRESA estabelece objetivos da qualidade nas funções, níveis e processos pertinentes. Os objetivos são coerentes com a política, mensuráveis, monitorados, comunicados e atualizados. Para cada um, determina-se o que será feito, quais recursos serão requeridos, quem será responsável, quando será concluído e como os resultados serão avaliados.'),

  um('6.3', 'Planejamento de Mudanças',
    'Quando a EMPRESA determina a necessidade de mudanças no sistema de gestão da qualidade, elas são realizadas de maneira planejada e sistemática, considerando o propósito das mudanças e suas potenciais consequências, a integridade do sistema, a disponibilidade de recursos e a alocação ou realocação de responsabilidades e autoridades.'),

  um('7.1', 'Recursos',
    'A EMPRESA determina e provê os recursos necessários para o estabelecimento, implementação, manutenção e melhoria contínua do sistema de gestão da qualidade, considerando as capacidades e restrições dos recursos internos existentes e o que precisa ser obtido de provedores externos. Isso inclui as pessoas necessárias, a infraestrutura e o ambiente adequado para a operação dos processos.'),

  um('7.1.5', 'Recursos de Monitoramento e Medição',
    'A EMPRESA determina e provê os recursos necessários para assegurar resultados válidos e confiáveis quando monitoramento ou medição for usado para verificar a conformidade. Quando a rastreabilidade de medição for requisito, os equipamentos são calibrados ou verificados contra padrões rastreáveis, identificados quanto à sua situação e salvaguardados contra ajustes, danos ou deterioração.'),

  um('7.1.6', 'Conhecimento Organizacional',
    'A EMPRESA determina o conhecimento necessário para a operação de seus processos e para alcançar a conformidade de produtos e serviços. Esse conhecimento é mantido e disponibilizado na extensão necessária, e, ao tratar necessidades e tendências de mudança, considera o conhecimento atual e como adquirir o conhecimento adicional requerido.'),

  um('7.2', 'Competência',
    'A EMPRESA determina a competência necessária das pessoas que realizam trabalho sob o seu controle e que afetam o desempenho do sistema de gestão da qualidade, assegura que sejam competentes com base em educação, treinamento ou experiência apropriados, toma ações para adquirir a competência necessária quando aplicável, avalia a eficácia dessas ações e retém informação documentada como evidência.'),

  um('7.3', 'Conscientização',
    'A EMPRESA assegura que as pessoas que realizam trabalho sob o seu controle estejam conscientes da política da qualidade, dos objetivos pertinentes, de sua contribuição para a eficácia do sistema e das implicações de não estar conforme com os seus requisitos.'),

  um('7.4', 'Comunicação',
    'A EMPRESA determina as comunicações internas e externas pertinentes ao sistema de gestão da qualidade, incluindo sobre o que comunicar, quando comunicar, com quem se comunicar, como comunicar e quem comunica. A matriz de comunicação registra essas determinações.'),

  um('7.5', 'Informação Documentada',
    'O sistema de gestão da qualidade da EMPRESA inclui a informação documentada requerida pela norma e a que a própria empresa determina como necessária para a sua eficácia. Ao criar e atualizar, assegura identificação, formato e aprovação. O controle assegura que ela esteja disponível e adequada para uso e protegida, abordando distribuição, acesso, armazenamento, controle de versão, retenção e disposição.'),

  um('8.1', 'Planejamento e Controle Operacionais',
    'A EMPRESA planeja, implementa e controla os processos necessários para atender aos requisitos para a provisão de produtos e serviços, determinando os requisitos, estabelecendo critérios para os processos e para a aceitação, determinando os recursos, implementando o controle conforme os critérios e conservando informação documentada na extensão necessária. Controla mudanças planejadas e analisa criticamente as consequências de mudanças não intencionais.'),

  um('8.2', 'Requisitos para Produtos e Serviços',
    'A comunicação com o cliente inclui prover informação sobre produtos e serviços, lidar com consultas, contratos e pedidos, obter retroalimentação incluindo reclamações, lidar com propriedade do cliente e estabelecer requisitos para ações de contingência. Antes de se comprometer a fornecer, a EMPRESA conduz análise crítica dos requisitos do cliente, dos requisitos não declarados mas necessários, dos requisitos próprios e dos estatutários e regulamentares aplicáveis.'),

  um('8.3', 'Projeto e Desenvolvimento de Produtos e Serviços',
    'Esta cláusula pode ser excluída quando a empresa não desenvolve especificações e executa conforme requisitos definidos pelo contratante. A exclusão precisa estar declarada aqui COM JUSTIFICATIVA — a norma admite não aplicar, mas não admite omitir. Se a empresa desenvolve qualquer especificação própria, apague este parágrafo e descreva o processo.'),

  um('8.4', 'Controle de Processos, Produtos e Serviços Providos Externamente',
    'A EMPRESA assegura que processos, produtos e serviços providos externamente estejam conformes com requisitos, determina e aplica critérios para avaliação, seleção, monitoramento de desempenho e reavaliação de provedores externos, e comunica a eles os requisitos aplicáveis quanto aos processos a serem providos, à aprovação de produtos e métodos, à competência requerida e ao controle do seu desempenho.'),

  um('8.5.1', 'Controle de Produção e de Provisão de Serviço',
    'A EMPRESA implementa produção e provisão de serviço sob condições controladas, incluindo a disponibilidade de informação documentada que defina as características e os resultados a alcançar, o uso de recursos de monitoramento e medição adequados, a implementação de monitoramento em estágios apropriados, infraestrutura e ambiente adequados, pessoas competentes, ações para prevenir erro humano e atividades de liberação, entrega e pós-entrega.'),

  um('8.5.2', 'Identificação e Rastreabilidade',
    'A EMPRESA usa meios adequados para identificar as saídas quando for necessário assegurar a conformidade, e identifica a situação das saídas com relação aos requisitos de monitoramento e medição ao longo da produção e provisão de serviço. Quando a rastreabilidade for requisito, controla a identificação unívoca das saídas e retém a informação documentada necessária.'),

  um('8.5.3', 'Propriedade Pertencente a Clientes ou Provedores Externos',
    'A EMPRESA toma cuidado com a propriedade pertencente a clientes ou provedores externos enquanto estiver sob o seu controle, identificando, verificando, protegendo e salvaguardando essa propriedade. Quando a propriedade for perdida, danificada ou considerada inadequada para uso, a empresa relata o fato ao proprietário e retém informação documentada sobre o ocorrido.'),

  um('8.5.4', 'Preservação',
    'A EMPRESA preserva as saídas durante a produção e provisão de serviço, na extensão necessária para assegurar a conformidade com os requisitos. A preservação pode incluir identificação, manuseio, controle de contaminação, embalagem, armazenamento, transmissão ou transporte e proteção.'),

  um('8.5.5', 'Atividades Pós-Entrega',
    'A EMPRESA atende aos requisitos para atividades pós-entrega associadas aos produtos e serviços. Ao determinar a extensão dessas atividades, considera os requisitos estatutários e regulamentares, as consequências indesejáveis potenciais, a natureza e o uso dos seus produtos e serviços, os requisitos do cliente e a retroalimentação do cliente. Descreva aqui o que a empresa oferece depois da entrega: garantia, retoque em campo, assistência e prazo.'),

  um('8.5.6', 'Controle de Mudanças',
    'A EMPRESA analisa criticamente e controla as mudanças para produção ou provisão de serviço na extensão necessária para assegurar continuamente a conformidade com os requisitos, e retém informação documentada que descreva os resultados da análise crítica, as pessoas que autorizam a mudança e as ações necessárias decorrentes.'),

  um('8.6', 'Liberação de Produtos e Serviços',
    'A EMPRESA implementa arranjos planejados, em estágios apropriados, para verificar se os requisitos do produto e do serviço foram atendidos. A liberação para o cliente não procede até que esses arranjos estejam satisfatoriamente concluídos, salvo aprovação por autoridade pertinente. É retida informação documentada com evidência da conformidade com os critérios de aceitação e a rastreabilidade à pessoa que autoriza a liberação.'),

  um('8.7', 'Controle de Saídas Não Conformes',
    'A EMPRESA assegura que as saídas não conformes sejam identificadas e controladas para prevenir seu uso ou entrega não pretendida, lidando com elas por correção, segregação, contenção, retorno ou suspensão, informação ao cliente ou obtenção de autorização para aceitação sob concessão. Retém informação documentada que descreve a não conformidade, as ações tomadas, as concessões obtidas e identifica a autoridade que decide a ação.'),

  um('9.1.1', 'Monitoramento, Medição, Análise e Avaliação — Generalidades',
    'A EMPRESA determina o que precisa ser monitorado e medido, os métodos necessários para assegurar resultados válidos, quando o monitoramento e a medição devem ser realizados e quando os resultados devem ser analisados e avaliados. Avalia o desempenho e a eficácia do sistema de gestão da qualidade e retém informação documentada como evidência dos resultados.'),

  um('9.1.2', 'Satisfação do Cliente',
    'A EMPRESA monitora a percepção dos clientes do grau em que suas necessidades e expectativas foram atendidas, e determina os métodos para obter, monitorar e analisar criticamente essa informação — pesquisas, retroalimentação sobre serviços entregues, reuniões, elogios, reclamações e pleitos de garantia.'),

  um('9.1.3', 'Análise e Avaliação',
    'A EMPRESA analisa e avalia os dados e informações provenientes do monitoramento e da medição, e usa os resultados para avaliar a conformidade de produtos e serviços, o grau de satisfação do cliente, o desempenho e a eficácia do sistema, se o planejamento foi implementado eficazmente, a eficácia das ações tomadas para abordar riscos e oportunidades, o desempenho de provedores externos e a necessidade de melhorias.'),

  um('9.2', 'Auditoria Interna',
    'A EMPRESA conduz auditorias internas a intervalos planejados para prover informação sobre se o sistema de gestão da qualidade está conforme com os seus próprios requisitos e com os da norma, e se está implementado e mantido eficazmente. Mantém um programa de auditoria com frequência, métodos, responsabilidades e requisitos de planejamento e relato, seleciona auditores que assegurem objetividade e imparcialidade, relata os resultados à gerência pertinente e executa as correções e ações corretivas sem demora indevida.'),

  um('9.3', 'Análise Crítica pela Direção',
    'A Alta Direção analisa criticamente o sistema de gestão da qualidade a intervalos planejados, para assegurar sua contínua adequação, suficiência, eficácia e alinhamento com o direcionamento estratégico. A análise considera as ações de análises anteriores, mudanças nas questões externas e internas, o desempenho e a eficácia do sistema, a suficiência de recursos, a eficácia das ações sobre riscos e oportunidades e as oportunidades de melhoria; e produz decisões sobre melhoria, mudanças no sistema e necessidade de recursos.'),

  um('10.1', 'Melhoria — Generalidades',
    'A EMPRESA determina e seleciona oportunidades para melhoria e implementa as ações necessárias para atender aos requisitos do cliente e aumentar a sua satisfação, incluindo melhorar produtos e serviços para atender requisitos e abordar necessidades e expectativas futuras, corrigir, prevenir ou reduzir efeitos indesejados, e melhorar o desempenho e a eficácia do sistema de gestão da qualidade.'),

  um('10.2', 'Não Conformidade e Ação Corretiva',
    'Ao ocorrer uma não conformidade, incluindo as provenientes de reclamações, a EMPRESA reage a ela tomando ação para controlá-la e corrigi-la e lidando com as consequências; avalia a necessidade de ação para eliminar as causas, analisando criticamente a não conformidade, determinando as causas e determinando se não conformidades similares existem ou poderiam ocorrer; implementa as ações necessárias; analisa criticamente a eficácia delas; e retém informação documentada sobre a natureza das não conformidades e os resultados das ações corretivas.'),

  um('10.3', 'Melhoria Contínua',
    'A EMPRESA melhora continuamente a adequação, suficiência e eficácia do sistema de gestão da qualidade, considerando os resultados de análise e avaliação e as saídas da análise crítica pela direção para determinar se há necessidades ou oportunidades que devam ser tratadas como parte da melhoria contínua.'),
];

registrarManual('modelo', { codigo: 'MQ-004', exemplo: true, clausulas: CLAUSULAS });
