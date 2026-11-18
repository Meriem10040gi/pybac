// Where the accounts, sessions and progress are kept: PostgreSQL or MySQL (DATABASE_URL),
// or, only for local development without a database, in memory (everything is lost when the server stops).
//
// The tables are created if they do not exist, and never dropped or changed by the app: deploying
// a new version keeps all the accounts and all the progress.
import mysql, { type Pool as MysqlPool, type RowDataPacket } from 'mysql2/promise';
import pg from 'pg';
import { readFileSync } from 'node:fs';

import { EMPTY, normalize, type Saved } from '../src/state/merge.js';

/** isAdmin: set in the database (npm run admin). The emails of ADMIN_EMAILS are admins too (server/app.ts). */
export type User = { id: number; email: string; passwordHash: string; isAdmin: boolean; createdAt: Date; lastLoginAt: Date | null };
export type UserWithProgress = Omit<User, 'passwordHash'> & { progress: Saved; progressUpdatedAt: Date | null };

export interface Store {
  createUser(email: string, passwordHash: string): Promise<User | null>;
  userByEmail(email: string): Promise<User | null>;
  userById(id: number): Promise<User | null>;
  setPassword(userId: number, passwordHash: string): Promise<void>;
  setAdmin(userId: number, on: boolean): Promise<void>;
  touchLogin(userId: number): Promise<void>;
  createSession(tokenHash: string, userId: number, expiresAt: Date): Promise<void>;
  sessionUser(tokenHash: string): Promise<User | null>;
  deleteSession(tokenHash: string): Promise<void>;
  deleteSessions(userId: number): Promise<void>;
  getProgress(userId: number): Promise<Saved>;
  /** Reads the progress, changes it with `f` and saves it, without another request in between. */
  updateProgress(userId: number, f: (old: Saved) => Saved): Promise<Saved>;
  listUsers(): Promise<UserWithProgress[]>;
  /** Deletes the account, its sessions and its progress. */
  deleteUser(userId: number): Promise<void>;
}

type UserRow = { id: number; email: string; password_hash: string; is_admin: number | boolean; created_at: Date; last_login_at: Date | null };
const toUser = (r: UserRow): User => ({
  id: r.id,
  email: r.email,
  passwordHash: r.password_hash,
  isAdmin: Boolean(r.is_admin),
  createdAt: r.created_at,
  lastLoginAt: r.last_login_at,
});

/** A JSON column comes back parsed (MySQL/PostgreSQL) or as text (MariaDB). */
const parseData = (d: unknown): Saved => normalize(typeof d === 'string' ? JSON.parse(d) : d);

// ---------------------------------------------------------------- PostgreSQL

const PG_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    last_login_at TIMESTAMPTZ NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash CHAR(64) NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER NOT NULL PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id)`,
];

function pgPoolFromUrl(url: string): pg.Pool {
  const u = new URL(url);
  const sslMode = (u.searchParams.get('sslmode') ?? u.searchParams.get('ssl-mode') ?? '').toLowerCase();
  const ca = process.env.DATABASE_CA_CERT?.trim();
  let ssl: pg.ConnectionConfig['ssl'];
  if (ca) {
    ssl = {
      ca: ca.startsWith('-----BEGIN') ? ca.replace(/\\n/g, '\n') : readFileSync(ca, 'utf8'),
      rejectUnauthorized: true,
    };
  } else if (sslMode && sslMode !== 'disable') {
    ssl = { rejectUnauthorized: false };
    console.warn('[db] connexion chiffrée sans vérification du certificat : ajoutez DATABASE_CA_CERT pour le vérifier');
  }

  return new pg.Pool({
    host: u.hostname,
    port: u.port ? Number(u.port) : 5432,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, '')),
    ssl,
    max: Number(process.env.DB_POOL_SIZE ?? (process.env.VERCEL ? 2 : 5)),
  });
}

export async function postgresStore(url: string): Promise<Store> {
  const pool = pgPoolFromUrl(url);
  for (const sql of PG_SCHEMA) await pool.query(sql);

  const { rows: colRows } = await pool.query<{ exists: boolean }>(
    "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_admin') as exists",
  );
  if (!colRows[0]?.exists) {
    await pool.query('ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE');
    console.log('[db] colonne ajoutée : users.is_admin');
  }

  const one = async (sql: string, params: unknown[]) => {
    const { rows } = await pool.query<UserRow>(sql, params);
    return rows[0] ? toUser(rows[0]) : null;
  };

  return {
    async createUser(email, passwordHash) {
      try {
        const { rows } = await pool.query<UserRow>(
          'INSERT INTO users (email, password_hash, created_at) VALUES ($1, $2, NOW()) RETURNING *',
          [email, passwordHash],
        );
        return rows[0] ? toUser(rows[0]) : null;
      } catch (e: unknown) {
        if ((e as { code?: string })?.code === '23505') return null;
        throw e;
      }
    },
    userByEmail: (email) => one('SELECT * FROM users WHERE email = $1', [email]),
    userById: (id) => one('SELECT * FROM users WHERE id = $1', [id]),
    async setPassword(userId, passwordHash) {
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
    },
    async setAdmin(userId, on) {
      await pool.query('UPDATE users SET is_admin = $1 WHERE id = $2', [on, userId]);
    },
    async touchLogin(userId) {
      await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userId]);
      await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
    },
    async createSession(tokenHash, userId, expiresAt) {
      await pool.query(
        'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES ($1, $2, NOW(), $3)',
        [tokenHash, userId, expiresAt],
      );
    },
    sessionUser: (tokenHash) =>
      one(
        'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > NOW()',
        [tokenHash],
      ),
    async deleteSession(tokenHash) {
      await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
    },
    async deleteSessions(userId) {
      await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    },
    async getProgress(userId) {
      const { rows } = await pool.query<{ data: unknown }>('SELECT data FROM progress WHERE user_id = $1', [userId]);
      return rows[0] ? parseData(rows[0].data) : EMPTY;
    },
    async updateProgress(userId, f) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query<{ data: unknown }>('SELECT data FROM progress WHERE user_id = $1 FOR UPDATE', [userId]);
        const next = normalize(f(rows[0] ? parseData(rows[0].data) : EMPTY));
        await client.query(
          `INSERT INTO progress (user_id, data, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
          [userId, JSON.stringify(next)],
        );
        await client.query('COMMIT');
        return next;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    },
    async deleteUser(userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    },
    async listUsers() {
      const { rows } = await pool.query<UserRow & { data: unknown; updated_at: Date | null }>(
        'SELECT u.*, p.data, p.updated_at FROM users u LEFT JOIN progress p ON p.user_id = u.id ORDER BY u.email',
      );
      return rows.map((r) => {
        const { passwordHash: _hidden, ...user } = toUser(r);
        return { ...user, progress: r.data ? parseData(r.data) : EMPTY, progressUpdatedAt: r.updated_at };
      });
    },
  };
}

// ---------------------------------------------------------------- MySQL

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    last_login_at DATETIME NULL,
    UNIQUE KEY users_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash CHAR(64) NOT NULL PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    KEY sessions_user (user_id),
    CONSTRAINT sessions_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS progress (
    user_id INT UNSIGNED NOT NULL PRIMARY KEY,
    data JSON NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT progress_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

/** Columns added after the first version: added to an existing table, without touching its rows. */
const ADDED_COLUMNS = [{ table: 'users', column: 'is_admin', sql: 'ALTER TABLE users ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash' }];

/** mysql://user:password@host:port/database?ssl-mode=REQUIRED (the format given by Aiven). */
function mysqlPoolFromUrl(url: string): MysqlPool {
  const u = new URL(url);
  const sslMode = (u.searchParams.get('ssl-mode') ?? u.searchParams.get('sslmode') ?? '').toUpperCase();
  // DATABASE_CA_CERT: the path of ca.pem, or its content (-----BEGIN CERTIFICATE----- …), handy on
  // hosts where there is no file to upload, like Vercel
  const ca = process.env.DATABASE_CA_CERT?.trim();
  let ssl: mysql.SslOptions | undefined;
  if (ca) {
    // the certificate of the server is checked (Aiven: "CA certificate" on the service page)
    // (pasted on one line, the line breaks may be written \n)
    ssl = { ca: ca.startsWith('-----BEGIN') ? ca.replace(/\\n/g, '\n') : readFileSync(ca, 'utf8'), rejectUnauthorized: true };
  } else if (sslMode && sslMode !== 'DISABLED') {
    // ssl-mode=REQUIRED: the connection is encrypted, like the mysql client does with this mode
    ssl = { rejectUnauthorized: false };
    console.warn('[db] connexion chiffrée sans vérification du certificat : ajoutez DATABASE_CA_CERT pour le vérifier');
  }
  return mysql.createPool({
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, '')),
    ssl,
    timezone: 'Z',
    // a Vercel function has many small instances: few connections each
    connectionLimit: Number(process.env.DB_POOL_SIZE ?? (process.env.VERCEL ? 2 : 5)),
    waitForConnections: true,
    enableKeepAlive: true,
  });
}

type MysqlUserRow = RowDataPacket & UserRow;

export async function mysqlStore(url: string): Promise<Store> {
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    return postgresStore(url);
  }
  const pool = mysqlPoolFromUrl(url);
  for (const sql of SCHEMA) await pool.query(sql);
  for (const c of ADDED_COLUMNS) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [c.table, c.column],
    );
    if (Number(rows[0].n) === 0) {
      await pool.query(c.sql);
      console.log(`[db] colonne ajoutée : ${c.table}.${c.column}`);
    }
  }

  const one = async (sql: string, params: unknown[]) => {
    const [rows] = await pool.query<MysqlUserRow[]>(sql, params);
    return rows[0] ? toUser(rows[0]) : null;
  };

  return {
    async createUser(email, passwordHash) {
      try {
        const [r] = await pool.execute<mysql.ResultSetHeader>('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, UTC_TIMESTAMP())', [email, passwordHash]);
        return await one('SELECT * FROM users WHERE id = ?', [r.insertId]);
      } catch (e) {
        if ((e as { code?: string }).code === 'ER_DUP_ENTRY') return null;
        throw e;
      }
    },
    userByEmail: (email) => one('SELECT * FROM users WHERE email = ?', [email]),
    userById: (id) => one('SELECT * FROM users WHERE id = ?', [id]),
    async setPassword(userId, passwordHash) {
      await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    },
    async setAdmin(userId, on) {
      await pool.execute('UPDATE users SET is_admin = ? WHERE id = ?', [on ? 1 : 0, userId]);
    },
    async touchLogin(userId) {
      await pool.execute('UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?', [userId]);
      await pool.execute('DELETE FROM sessions WHERE expires_at < UTC_TIMESTAMP()');
    },
    async createSession(tokenHash, userId, expiresAt) {
      await pool.execute('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, UTC_TIMESTAMP(), ?)', [tokenHash, userId, expiresAt]);
    },
    sessionUser: (tokenHash) =>
      one('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()', [tokenHash]),
    async deleteSession(tokenHash) {
      await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
    },
    async deleteSessions(userId) {
      await pool.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
    },
    getProgress(userId) {
      return pool.query<RowDataPacket[]>('SELECT data FROM progress WHERE user_id = ?', [userId]).then(([rows]) =>
        rows[0] ? parseData(rows[0].data) : EMPTY
      );
    },
    async updateProgress(userId, f) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        // FOR UPDATE: two devices saving at the same moment wait for each other
        const [rows] = await conn.query<RowDataPacket[]>('SELECT data FROM progress WHERE user_id = ? FOR UPDATE', [userId]);
        const next = normalize(f(rows[0] ? parseData(rows[0].data) : EMPTY));
        await conn.query(
          'INSERT INTO progress (user_id, data, updated_at) VALUES (?, ?, UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = VALUES(updated_at)',
          [userId, JSON.stringify(next)],
        );
        await conn.commit();
        return next;
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
    },
    async deleteUser(userId) {
      // sessions and progress go with the account (ON DELETE CASCADE)
      await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    },
    async listUsers() {
      const [rows] = await pool.query<(MysqlUserRow & { data: unknown; updated_at: Date | null })[]>(
        'SELECT u.*, p.data, p.updated_at FROM users u LEFT JOIN progress p ON p.user_id = u.id ORDER BY u.email',
      );
      return rows.map((r) => {
        const { passwordHash: _hidden, ...user } = toUser(r);
        return { ...user, progress: r.data ? parseData(r.data) : EMPTY, progressUpdatedAt: r.updated_at };
      });
    },
  };
}

// ---------------------------------------------------------------- Auto Store (PostgreSQL / MySQL)

export async function createStore(url: string): Promise<Store> {
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    const store = await postgresStore(url);
    console.log('[db] PostgreSQL connectée');
    return store;
  }
  const store = await mysqlStore(url);
  console.log('[db] MySQL connectée');
  return store;
}

// ---------------------------------------------------------------- memory (local development only)

export function memoryStore(): Store {
  const users: User[] = [];
  const sessions = new Map<string, { userId: number; expiresAt: Date }>();
  const progress = new Map<number, { data: Saved; updatedAt: Date }>();
  return {
    async createUser(email, passwordHash) {
      if (users.some((u) => u.email === email)) return null;
      const u = { id: users.length + 1, email, passwordHash, isAdmin: false, createdAt: new Date(), lastLoginAt: null };
      users.push(u);
      return u;
    },
    userByEmail: async (email) => users.find((u) => u.email === email) ?? null,
    userById: async (id) => users.find((u) => u.id === id) ?? null,
    async setPassword(userId, passwordHash) {
      const u = users.find((x) => x.id === userId);
      if (u) u.passwordHash = passwordHash;
    },
    async setAdmin(userId, on) {
      const u = users.find((x) => x.id === userId);
      if (u) u.isAdmin = on;
    },
    async touchLogin(userId) {
      const u = users.find((x) => x.id === userId);
      if (u) u.lastLoginAt = new Date();
    },
    async createSession(tokenHash, userId, expiresAt) {
      sessions.set(tokenHash, { userId, expiresAt });
    },
    async sessionUser(tokenHash) {
      const s = sessions.get(tokenHash);
      return s && s.expiresAt > new Date() ? (users.find((u) => u.id === s.userId) ?? null) : null;
    },
    async deleteSession(tokenHash) {
      sessions.delete(tokenHash);
    },
    async deleteSessions(userId) {
      for (const [k, s] of sessions) if (s.userId === userId) sessions.delete(k);
    },
    getProgress: async (userId) => progress.get(userId)?.data ?? EMPTY,
    async updateProgress(userId, f) {
      const next = normalize(f(progress.get(userId)?.data ?? EMPTY));
      progress.set(userId, { data: next, updatedAt: new Date() });
      return next;
    },
    async deleteUser(userId) {
      const i = users.findIndex((u) => u.id === userId);
      if (i >= 0) users.splice(i, 1);
      progress.delete(userId);
      for (const [k, x] of sessions) if (x.userId === userId) sessions.delete(k);
    },
    listUsers: async () =>
      [...users]
        .sort((a, b) => a.email.localeCompare(b.email))
        .map(({ passwordHash: _hidden, ...u }) => ({ ...u, progress: progress.get(u.id)?.data ?? EMPTY, progressUpdatedAt: progress.get(u.id)?.updatedAt ?? null })),
  };
}
