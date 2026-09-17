import { defineConfig, type Connect } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { texto as anonimizarTexto, vazamentos } from './src/demo/anonimizar';

// Load gitignored secrets into the dev process so the dev-API middleware can reach the DB/Supabase.
// (Production: env vars on Vercel; this block is a no-op when .env.local is absent.)
const envPath = join(__dirname, '../../.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) { const k = t.slice(0, i); if (!(k in process.env)) process.env[k] = t.slice(i + 1); }
  }
}

// Dev-only middleware: mount the tRPC fetch handler at /api/trpc so the web app talks to the real
// request path locally (the same handler the Vercel function serves in prod). Loaded lazily via
// ssrLoadModule so env is set first; node req→Web Request adapted inline (no extra dep).
function trpcDevApi() {
  return {
    name: 'trpc-dev-api',
    apply: 'serve' as const,
    configureServer(server: { middlewares: Connect.Server; ssrLoadModule: (id: string) => Promise<any> }) {
      server.middlewares.use('/api/trpc', async (req: any, res: any) => {
        try {
          const { trpcFetchHandler, appRouter, createContext, TRPC_ENDPOINT } =
            await server.ssrLoadModule('@app/trpc');
          const chunks: Buffer[] = [];
          if (req.method !== 'GET' && req.method !== 'HEAD') for await (const c of req) chunks.push(c as Buffer);
          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers[k] = v;
          const request = new Request(`http://localhost${req.originalUrl}`, {
            method: req.method, headers,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          });

          // ── SESSAO DE DESENVOLVIMENTO ────────────────────────────────────────────────────────
          // Alimenta o principal `pinMembershipId` do chassis a partir do header x-dev-membership,
          // para o app ser utilizavel antes de existir autenticacao de verdade.
          //
          // Mora AQUI de proposito: este plugin e `apply: 'serve'`, entao nao entra em build
          // nenhum — a funcao da Vercel (api/trpc) nunca ve este codigo e continua exigindo um
          // token Supabase verificado. Alem disso exige ALLOW_DEV_LOGIN=true, entao nem o
          // `vite dev` aceita sem o desenvolvedor ter optado explicitamente.
          //
          // Nada a jusante muda: resolveContext ainda precisa achar uma membership ATIVA com esse
          // id, e toda consulta continua dentro de withTenant, com RLS.
          const devMembership = process.env.ALLOW_DEV_LOGIN === 'true'
            ? headers['x-dev-membership']
            : undefined;
          const response: Response = devMembership
            ? await (await import('@trpc/server/adapters/fetch')).fetchRequestHandler({
                endpoint: TRPC_ENDPOINT,
                req: request,
                router: appRouter,
                createContext: () => createContext({ headers, pinMembershipId: devMembership }),
              })
            : await trpcFetchHandler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String((e as Error)?.message ?? e) }));
        }
      });
    },
  };
}

// Modo demonstração (VITE_DEMO=1): reescreve os textos no PACOTE GERADO, não em tempo de execução.
// A diferença importa: trocar no runtime deixaria os nomes reais como literais dentro do .js, e
// quem abrisse o código-fonte da página os veria. Aqui eles não chegam a ser escritos.
function anonimizarDemo() {
  return {
    name: 'anonimizar-demo',
    apply: 'build' as const,
    enforce: 'post' as const,
    // O HTML não passa pelo gancho dos chunks — precisa do seu.
    transformIndexHtml(html: string) {
      const limpo = anonimizarTexto(html);
      const sobrou = vazamentos(limpo);
      if (sobrou.length) throw new Error(`index.html da demonstração ainda contém: ${sobrou.join(', ')}`);
      return limpo;
    },
    generateBundle(_opcoes: unknown, pacote: Record<string, any>) {
      for (const arquivo of Object.values(pacote)) {
        if (arquivo.type === 'chunk') arquivo.code = anonimizarTexto(arquivo.code);
        else if (typeof arquivo.source === 'string') arquivo.source = anonimizarTexto(arquivo.source);
      }
      // Trava: se sobrou algum termo real, o build falha em vez de publicar.
      for (const arquivo of Object.values(pacote)) {
        const conteudo = arquivo.type === 'chunk' ? arquivo.code : arquivo.source;
        if (typeof conteudo !== 'string') continue;
        const sobrou = vazamentos(conteudo);
        if (sobrou.length) {
          throw new Error(`Build de demonstração ainda contém: ${sobrou.join(', ')}`);
        }
      }
    },
  };
}

const EH_DEMO = process.env.VITE_DEMO === '1';

export default defineConfig({
  // tsconfigPaths resolves the per-app @astralitics/* aliases that `astralitics install` writes into
  // tsconfig.base.json. Without it vite has no idea what '@astralitics/entities' is, so the dev-API
  // middleware fails to load ANY installed module's Functions - typecheck and vitest passed while
  // the running app's request path was broken.
  plugins: [
    tsconfigPaths({ projects: ['../../tsconfig.base.json'] }), react(), trpcDevApi(),
    ...(EH_DEMO ? [anonimizarDemo()] : []),
  ],
  resolve: { alias: { '@': join(__dirname, 'src') } },
  // Transpile the workspace TS packages the dev-API imports (instead of externalizing them as CJS).
  ssr: { noExternal: ['@app/trpc', '@app/db'] },
  // `host: true` faz o servidor de desenvolvimento atender a rede local, e não só esta
  // máquina — é o que permite abrir no celular pelo IP, que é onde a câmera existe de
  // verdade. Vale só em `vite dev`: o build não tem servidor. Em rede pública, quem estiver
  // na mesma rede alcança a porta; o dado aqui é local e sem senha, então convém desligar.
  server: { port: 5273, host: true },
});
