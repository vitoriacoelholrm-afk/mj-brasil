// documentosRouter — o texto dos documentos do SGQ (app-local).
//
// Toda rota é orgScopedProcedure: roda dentro de withTenant, logo é isolada por empresa por
// construção. A permissão de cada verbo é checada na própria capability.
import { router, orgScopedProcedure, type ScopedContext } from '../trpc.js';
import {
  listarTextos, listarTextosInput,
  salvarTexto, salvarTextoInput,
  listarArquivos, listarArquivosInput,
  anexarArquivo, anexarArquivoInput,
  lerArquivo, lerArquivoInput,
  removerArquivo, removerArquivoInput,
} from '@app/db';

const sc = (ctx: unknown) => ctx as ScopedContext;

export const documentosRouter = router({
  listarTextos: orgScopedProcedure.input(listarTextosInput).query(({ ctx, input }) => listarTextos(sc(ctx).db, sc(ctx).identity, input)),
  salvarTexto: orgScopedProcedure.input(salvarTextoInput).mutation(({ ctx, input }) => salvarTexto(sc(ctx).db, sc(ctx).identity, input)),
  listarArquivos: orgScopedProcedure.input(listarArquivosInput).query(({ ctx, input }) => listarArquivos(sc(ctx).db, sc(ctx).identity, input)),
  anexarArquivo: orgScopedProcedure.input(anexarArquivoInput).mutation(({ ctx, input }) => anexarArquivo(sc(ctx).db, sc(ctx).identity, input)),
  lerArquivo: orgScopedProcedure.input(lerArquivoInput).query(({ ctx, input }) => lerArquivo(sc(ctx).db, sc(ctx).identity, input)),
  removerArquivo: orgScopedProcedure.input(removerArquivoInput).mutation(({ ctx, input }) => removerArquivo(sc(ctx).db, sc(ctx).identity, input)),
});
