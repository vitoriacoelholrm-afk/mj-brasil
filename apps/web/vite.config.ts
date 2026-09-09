import { defineConfig, type Connect } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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
          const { trpcFetchHandler } = await server.ssrLoadModule('@app/trpc');
          const chunks: Buffer[] = [];
          if (req.method !== 'GET' && req.method !== 'HEAD') for await (const c of req) chunks.push(c as Buffer);
          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers[k] = v;
          const request = new Request(`http://localhost${req.originalUrl}`, {
            method: req.method, headers,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          });
          const response: Response = await trpcFetchHandler(request);
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

export default defineConfig({
  // tsconfigPaths resolves the per-app @astralitics/* aliases that `astralitics install` writes into
  // tsconfig.base.json. Without it vite has no idea what '@astralitics/entities' is, so the dev-API
  // middleware fails to load ANY installed module's Functions - typecheck and vitest passed while
  // the running app's request path was broken.
  plugins: [tsconfigPaths({ projects: ['../../tsconfig.base.json'] }), react(), trpcDevApi()],
  resolve: { alias: { '@': join(__dirname, 'src') } },
  // Transpile the workspace TS packages the dev-API imports (instead of externalizing them as CJS).
  ssr: { noExternal: ['@app/trpc', '@app/db'] },
  server: { port: 5273 },
});
