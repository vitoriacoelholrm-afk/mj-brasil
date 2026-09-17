// bytea — o Drizzle não traz esse tipo de fábrica, e ele é necessário enquanto a foto do registro
// mora no próprio banco (ver a migração 0020). Vai embora junto com a coluna, no dia em que o
// armazenamento de objetos entrar e sobrar só a chave.
import { customType } from 'drizzle-orm/pg-core';

export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
});
