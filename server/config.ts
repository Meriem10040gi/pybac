// The settings of the server, read from the environment (the .env file on your computer, the
// "Environment Variables" of the host online): see .env.example. Shared by the Node server
// (server/index.ts) and the Vercel function (api/index.ts).
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Config } from './app.js';
import { memoryStore, mysqlStore, type Store } from './store.js';

export async function configFromEnv(): Promise<Config> {
  const production = process.env.NODE_ENV === 'production';
  const url = process.env.DATABASE_URL?.trim();

  let store: Store;
  if (url) {
    store = await mysqlStore(url);
    console.log('[db] MySQL connectée');
  } else if (production) {
    throw new Error('[db] DATABASE_URL manque : en production, le serveur ne démarre pas sans base de données.');
  } else {
    store = memoryStore();
    console.warn('[db] pas de DATABASE_URL : comptes et progression gardés en mémoire (effacés à l\'arrêt du serveur)');
  }

  return {
    store,
    admins: new Set(
      (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
    signupCode: process.env.SIGNUP_CODE?.trim() || null,
    // the built site, served by the Node server (on Vercel, the site is served by Vercel itself)
    distDir: process.env.VERCEL ? null : path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist'),
    secureCookie: production,
  };
}
