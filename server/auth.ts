// Passwords and sessions.
// - A password is never stored: only its scrypt hash, with a random salt.
// - A session is a random token kept in an HttpOnly cookie (JavaScript of the page cannot read it).
//   The database only keeps the SHA-256 of the token: a copy of the database does not open sessions.
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const scrypt = (password: string, salt: Buffer, keylen: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))));

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function checkPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, salt, hash] = stored.split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const key = await scrypt(password, Buffer.from(salt, 'base64'), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** A hash to compare with when the email is unknown, so that the answer takes the same time. */
let dummy: Promise<string> | null = null;
export function dummyHash() {
  dummy ??= hashPassword(randomBytes(16).toString('hex'));
  return dummy;
}

export const SESSION_COOKIE = 'pybac_session';
export const SESSION_DAYS = 180;

export function newToken() {
  return randomBytes(32).toString('base64url');
}

export function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function normEmail(x: unknown): string | null {
  if (typeof x !== 'string') return null;
  const e = x.trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

export const PASSWORD_MIN = 8;

export function passwordProblem(x: unknown): string | null {
  if (typeof x !== 'string' || x.length < PASSWORD_MIN) return `Le mot de passe doit avoir au moins ${PASSWORD_MIN} caractères.`;
  if (x.length > 200) return 'Le mot de passe est trop long.';
  return null;
}

/** At most `max` tries per key (IP + email) in `windowMs`: slows down password guessing. */
export function limiter(max: number, windowMs: number) {
  const hits = new Map<string, { n: number; until: number }>();
  return (key: string) => {
    const now = Date.now();
    if (hits.size > 10000) for (const [k, h] of hits) if (h.until < now) hits.delete(k);
    const h = hits.get(key);
    if (!h || h.until < now) {
      hits.set(key, { n: 1, until: now + windowMs });
      return true;
    }
    h.n++;
    return h.n <= max;
  };
}
