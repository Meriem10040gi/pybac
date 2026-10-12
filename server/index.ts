// Starts the server. Settings come from the environment (the .env file in development, the
// settings of the host in production): see .env.example.
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

import { createApp } from './app.ts';
import { memoryStore, mysqlStore, type Store } from './store.ts';

const production = process.env.NODE_ENV === 'production';
const url = process.env.DATABASE_URL?.trim();

let store: Store;
if (url) {
  store = await mysqlStore(url);
  console.log('[db] MySQL connectée');
} else if (production) {
  console.error('[db] DATABASE_URL manque : le serveur ne démarre pas sans base de données en production.');
  process.exit(1);
} else {
  store = memoryStore();
  console.warn('[db] pas de DATABASE_URL : comptes et progression gardés en mémoire (effacés à l\'arrêt du serveur)');
}

const admins = new Set(
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);
if (!admins.size) console.warn('[auth] ADMIN_EMAILS est vide : personne n\'a accès au suivi des élèves');

const app = createApp({
  store,
  admins,
  signupCode: process.env.SIGNUP_CODE?.trim() || null,
  distDir: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist'),
  secureCookie: production,
});

// --port (development: always 3000, the port the site forwards /api to), else PORT (given by the host)
const { values: args } = parseArgs({ options: { port: { type: 'string' } } });
const port = Number(args.port ?? process.env.PORT ?? 3000);
app.listen(port, () => console.log(`[server] http://localhost:${port}`));
