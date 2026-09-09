// Vercel serverless function — the production HTTP entry. Imports the PRE-BUNDLED handler
// (scripts/build-api.mjs → api/_handler.js, self-contained) so @vercel/nft has nothing to trace.
// Node runtime; node req→Web Request adapted inline.
import type { IncomingMessage, ServerResponse } from 'node:http';
// eslint-disable-next-line import/no-unresolved -- generated at build by scripts/build-api.mjs
import { trpcFetchHandler } from '../_handler.js';

export const config = { runtime: 'nodejs', maxDuration: 30 };

export default async function handler(req: IncomingMessage & { url?: string }, res: ServerResponse) {
  try {
    const chunks: Buffer[] = [];
    if (req.method !== 'GET' && req.method !== 'HEAD') for await (const c of req) chunks.push(c as Buffer);
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers[k] = v;
    const host = headers['host'] ?? 'localhost';
    const request = new Request(`https://${host}${req.url}`, {
      method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined,
    });
    const response = await trpcFetchHandler(request);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String((e as Error)?.message ?? e) }));
  }
}
