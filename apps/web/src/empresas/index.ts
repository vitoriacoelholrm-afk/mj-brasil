// As empresas atendidas, registradas.
//
// Importar cada uma aqui é o que a coloca no registro da plataforma. Quando o próximo cliente
// entrar, acrescenta-se uma linha — e nada mais.
//
// Isto mora fora dos módulos de propósito: um módulo não pode saber o nome de nenhuma empresa,
// senão deixa de servir para a seguinte. Há um teste que falha se souber.
import '@/empresas/minasjato';
import '@/empresas/modelo';

// As ordens de serviço da empresa 01, entregues ao módulo do tratamento de superfície.
import '@/empresas/minasjato.ordens';

// E o levantamento do diagnóstico dela, entregue ao módulo dos documentos.
import '@/empresas/minasjato.diagnostico';

// O texto dos manuais da qualidade, entregue ao módulo do manual. O da empresa 01 é a letra do
// documento que ela emitiu; o do modelo é exemplo, e é o único que se escreve pela tela.
import '@/empresas/minasjato.manual';
import '@/empresas/modelo.manual';
