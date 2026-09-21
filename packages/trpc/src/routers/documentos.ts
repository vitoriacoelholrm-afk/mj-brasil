// documentosRouter — o texto dos documentos do SGQ (app-local).
//
// Toda rota é orgScopedProcedure: roda dentro de withTenant, logo é isolada por empresa por
// construção. A permissão de cada verbo é checada na própria capability.
import { router, orgScopedProcedure, type ScopedContext } from '../trpc.js';
import {
  listarTextos, listarTextosInput,
  salvarTexto, salvarTextoInput,
} from '@app/db';

const sc = (ctx: unknown) => ctx as ScopedContext;

export const documentosRouter = router({
  listarTextos: orgScopedProcedure.input(listarTextosInput).query(({ ctx, input }) => listarTextos(sc(ctx).db, sc(ctx).identity, input)),
  salvarTexto: orgScopedProcedure.input(salvarTextoInput).mutation(({ ctx, input }) => salvarTexto(sc(ctx).db, sc(ctx).identity, input)),
});
