// DbOrTx — a top-level db OR a transaction; capabilities accept either (mirrors the catalog's
// @astralitics/module-identity-access DbOrTx). On install, @astralitics/module-identity-access is
// aliased to @app/db, so a back-ported capability's `import type { DbOrTx }` resolves here.
import type { PgDatabase } from 'drizzle-orm/pg-core';

export type DbOrTx = PgDatabase<any, any, any>;
