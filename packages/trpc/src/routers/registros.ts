// registrosRouter — os formulários da ISO 9001 desta aplicação (app-local, não é módulo do
// catálogo). Toda rota é orgScopedProcedure: roda dentro de withTenant, logo é isolada por
// empresa por construção. A permissão de cada verbo é checada na própria capability.
import { router, orgScopedProcedure, type ScopedContext } from '../trpc.js';
import {
  criarRegistro, criarRegistroInput,
  listarRegistros, listarRegistrosInput,
  lerAnexo, lerAnexoInput,
} from '@app/db';

const sc = (ctx: unknown) => ctx as ScopedContext;

export const registrosRouter = router({
  listar: orgScopedProcedure.input(listarRegistrosInput).query(({ ctx, input }) => listarRegistros(sc(ctx).db, sc(ctx).identity, input)),
  criar: orgScopedProcedure.input(criarRegistroInput).mutation(({ ctx, input }) => criarRegistro(sc(ctx).db, sc(ctx).identity, input)),
  lerAnexo: orgScopedProcedure.input(lerAnexoInput).query(({ ctx, input }) => lerAnexo(sc(ctx).db, sc(ctx).identity, input)),
});
