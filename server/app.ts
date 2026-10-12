// The API of the site (/api/…) and, in production, the files of the site itself (dist/).
//
//   POST /api/auth/signup     create an account { email, password, code? } and log in
//   POST /api/auth/login      { email, password }
//   POST /api/auth/logout
//   GET  /api/me              the logged-in user, or 401
//   GET  /api/config          what the login page needs to know (is a class code asked?)
//   GET  /api/progress        the progress saved on the server
//   PUT  /api/progress        { data }: merged with the saved progress, the result is sent back
//   POST /api/progress/reset  erase the progress (on every device)
//   GET  /api/admin/users     every student with their progress (admins only)
//   POST /api/admin/users/:id/password   { password }: a new password for a student (admins only)
import express, { type NextFunction, type Request, type Response } from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { EMPTY, merge, normalize } from '../src/state/merge.ts';
import { checkPassword, DUMMY_HASH, hashPassword, limiter, newToken, normEmail, passwordProblem, SESSION_COOKIE, SESSION_DAYS, tokenHash } from './auth.ts';
import type { Store, User } from './store.ts';

export type Config = {
  store: Store;
  /** Emails of the admins (lower case). */
  admins: Set<string>;
  /** If set, creating an account asks for this code (given by the teacher). */
  signupCode: string | null;
  /** Folder of the built site, served in production. */
  distDir: string | null;
  /** HTTPS: the cookie is only sent over a secure connection. */
  secureCookie: boolean;
};

type Authed = Request & { user?: User };

const publicUser = (u: User, admins: Set<string>) => ({ id: u.id, email: u.email, isAdmin: admins.has(u.email) });

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function createApp(cfg: Config) {
  const { store, admins } = cfg;
  const app = express();
  app.disable('x-powered-by');
  // behind the proxy of the host (Render, Railway…): req.secure and req.ip are the real ones
  app.set('trust proxy', 1);

  const api = express.Router();
  api.use(express.json({ limit: '256kb' }));
  // changes must be sent as JSON: a form of another site cannot do that without being blocked
  api.use((req, res, next) => {
    if (req.method !== 'GET' && !req.is('application/json')) return void res.status(415).json({ error: 'Requête invalide.' });
    next();
  });
  api.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  const setSession = async (res: Response, userId: number) => {
    const token = newToken();
    const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
    await store.createSession(tokenHash(token), userId, expires);
    await store.touchLogin(userId);
    res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: cfg.secureCookie, path: '/', expires });
  };

  const auth = async (req: Authed, res: Response, next: NextFunction) => {
    const token = readCookie(req, SESSION_COOKIE);
    const user = token ? await store.sessionUser(tokenHash(token)) : null;
    if (!user) return void res.status(401).json({ error: 'Connectez-vous pour continuer.' });
    req.user = user;
    next();
  };

  const adminOnly = (req: Authed, res: Response, next: NextFunction) => {
    if (!req.user || !admins.has(req.user.email)) return void res.status(403).json({ error: 'Réservé aux administrateurs.' });
    next();
  };

  const loginLimit = limiter(10, 15 * 60000);
  const signupLimit = limiter(10, 60 * 60000);

  api.get('/config', (_req, res) => {
    res.json({ signupCode: !!cfg.signupCode });
  });

  api.post('/auth/signup', async (req, res) => {
    if (!signupLimit(req.ip ?? '')) return void res.status(429).json({ error: 'Trop de comptes créés. Réessayez dans une heure.' });
    const email = normEmail(req.body?.email);
    if (!email) return void res.status(400).json({ error: 'Adresse e-mail invalide.' });
    const problem = passwordProblem(req.body?.password);
    if (problem) return void res.status(400).json({ error: problem });
    if (cfg.signupCode && String(req.body?.code ?? '').trim() !== cfg.signupCode) return void res.status(400).json({ error: 'Le code de la classe n\'est pas le bon. Demandez-le à votre professeur.' });
    const user = await store.createUser(email, await hashPassword(req.body.password));
    if (!user) return void res.status(409).json({ error: 'Un compte existe déjà avec cette adresse. Connectez-vous.' });
    await setSession(res, user.id);
    res.status(201).json({ user: publicUser(user, admins) });
  });

  api.post('/auth/login', async (req, res) => {
    const email = normEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!loginLimit(`${req.ip}|${email}`)) return void res.status(429).json({ error: 'Trop d\'essais. Réessayez dans 15 minutes.' });
    const user = email ? await store.userByEmail(email) : null;
    // same work whether the account exists or not
    const ok = await checkPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) return void res.status(401).json({ error: 'E-mail ou mot de passe incorrect.' });
    await setSession(res, user.id);
    res.json({ user: publicUser(user, admins) });
  });

  api.post('/auth/logout', async (req, res) => {
    const token = readCookie(req, SESSION_COOKIE);
    if (token) await store.deleteSession(tokenHash(token));
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  api.get('/me', auth, (req: Authed, res) => {
    res.json({ user: publicUser(req.user!, admins) });
  });

  api.get('/progress', auth, async (req: Authed, res) => {
    res.json({ data: await store.getProgress(req.user!.id) });
  });

  api.put('/progress', auth, async (req: Authed, res) => {
    const incoming = normalize(req.body?.data);
    const data = await store.updateProgress(req.user!.id, (old) => merge(old, incoming));
    res.json({ data });
  });

  api.post('/progress/reset', auth, async (req: Authed, res) => {
    const data = await store.updateProgress(req.user!.id, (old) => ({ ...EMPTY, epoch: old.epoch + 1 }));
    res.json({ data });
  });

  api.get('/admin/users', auth, adminOnly, async (_req, res) => {
    const users = await store.listUsers();
    res.json({ users: users.map((u) => ({ ...u, isAdmin: admins.has(u.email) })) });
  });

  api.post('/admin/users/:id/password', auth, adminOnly, async (req: Authed, res) => {
    const target = await store.userById(Number(req.params.id));
    if (!target) return void res.status(404).json({ error: 'Élève introuvable.' });
    const problem = passwordProblem(req.body?.password);
    if (problem) return void res.status(400).json({ error: problem });
    await store.setPassword(target.id, await hashPassword(req.body.password));
    // the old sessions of this student stop working
    await store.deleteSessions(target.id);
    res.json({ ok: true });
  });

  api.use((_req, res) => {
    res.status(404).json({ error: 'Adresse inconnue.' });
  });

  api.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[api]', err);
    res.status(500).json({ error: 'Le serveur a rencontré un problème. Réessayez dans un moment.' });
  });

  app.use('/api', api);

  // ---------------- the site (production)
  if (cfg.distDir && existsSync(cfg.distDir)) {
    const dist = cfg.distDir;
    app.use(
      express.static(dist, {
        index: false,
        setHeaders(res, file) {
          // files with a hash in their name never change; the others must be checked every time
          if (file.includes(`${path.sep}assets${path.sep}`)) res.set('Cache-Control', 'public, max-age=31536000, immutable');
          else res.set('Cache-Control', 'no-cache');
        },
      }),
    );
    // every page of the app (/lecon/…, /unite/…) is index.html
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      res.set('Cache-Control', 'no-cache');
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  return app;
}
