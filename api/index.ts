// The API on Vercel: one function that receives every /api/... request (see vercel.json) and hands it
// to the same Express app as the Node server. The connection to the database is opened once per
// instance of the function, at its first request, then reused.
import type { IncomingMessage, ServerResponse } from 'node:http';

import { createApp } from '../server/app.js';
import { configFromEnv } from '../server/config.js';

let app: Promise<ReturnType<typeof createApp>> | null = null;

/** Vercel adds a read-only req.body (its "helpers"), which it fills only when read. Express needs to
 * set req.body itself: the getter is replaced by a normal property, before it is read, so the body of
 * the request is still there for express.json(). (NODEJS_HELPERS=0 turns the helpers off too.) */
function plainBody(req: IncomingMessage) {
  const d = Object.getOwnPropertyDescriptor(req, 'body');
  if (d?.get && d.configurable) Object.defineProperty(req, 'body', { value: undefined, writable: true, configurable: true, enumerable: true });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  plainBody(req);
  try {
    app ??= configFromEnv().then(createApp);
    (await app)(req, res);
  } catch (e) {
    // e.g. the database cannot be reached: try again at the next request
    app = null;
    console.error('[api]', e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Le serveur a rencontré un problème. Réessayez dans un moment.' }));
  }
}
