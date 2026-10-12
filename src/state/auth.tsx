// Who is logged in. The server decides (GET /api/me); the last known user is also kept in the
// browser, so that a student already logged in can keep working without internet.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { setStudentView } from './admin-view';
import { api, ApiError, offline, setApiAccount } from './api';
import { setResumeScope } from './lesson-resume';
import { getItem, removeItem, setItem } from './storage';

export type User = { id: number; email: string; isAdmin: boolean };

type Auth = {
  /** loading: asking the server; out: nobody is logged in. */
  status: 'loading' | 'in' | 'out';
  user: User | null;
  /** The server could not be reached: the user shown is the last one known. */
  offline: boolean;
  /** A class code is asked when creating an account. */
  signupCode: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, code?: string) => Promise<void>;
  logout: () => Promise<void>;
  /** The session is no longer valid (expired, password changed by the teacher): back to the login page. */
  expire: () => void;
};

const KEY = 'auth-user';
const Ctx = createContext<Auth | null>(null);

export function useAuth() {
  const a = useContext(Ctx);
  if (!a) throw new Error('useAuth() must be used inside <AuthProvider>');
  return a;
}

function cached(): User | null {
  try {
    const u = JSON.parse(getItem(KEY) ?? 'null');
    return u && typeof u.id === 'number' && typeof u.email === 'string' ? { id: u.id, email: u.email, isAdmin: !!u.isAdmin } : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<Auth['status']>('loading');
  const [isOffline, setOffline] = useState(false);
  const [signupCode, setSignupCode] = useState(false);

  const setUser = useCallback((u: User | null) => {
    // a new login (or a logout) of an admin starts in the back-office again
    if (!u || u.id !== cached()?.id) setStudentView(false);
    if (u) setItem(KEY, JSON.stringify(u));
    else removeItem(KEY);
    setResumeScope(u ? String(u.id) : null);
    setApiAccount(u ? u.id : null);
    setUserState(u);
    setStatus(u ? 'in' : 'out');
  }, []);

  // another tab logged in or out with another account: this tab reloads, so that it never shows
  // (nor saves) the progress of an account that is no longer the one of the browser
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY && e.key !== null) return;
      const now = cached();
      if ((now?.id ?? null) !== (user?.id ?? null)) window.location.reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user]);

  useEffect(() => {
    api<{ user: User }>('/me')
      .then((r) => {
        setOffline(false);
        setUser(r.user);
      })
      .catch((e) => {
        // no internet, or the server does not answer: the student keeps working with this device
        if ((offline(e) || (e instanceof ApiError && e.status >= 500)) && cached()) {
          setOffline(true);
          setUser(cached());
        } else setUser(null);
      });
    api<{ signupCode: boolean }>('/config')
      .then((r) => setSignupCode(r.signupCode))
      .catch(() => {});
  }, [setUser]);

  const value = useMemo<Auth>(
    () => ({
      status,
      user,
      offline: isOffline,
      signupCode,
      login: async (email, password) => {
        const r = await api<{ user: User }>('/auth/login', { body: { email, password } });
        setOffline(false);
        setUser(r.user);
      },
      signup: async (email, password, code) => {
        const r = await api<{ user: User }>('/auth/signup', { body: { email, password, code } });
        setOffline(false);
        setUser(r.user);
      },
      logout: async () => {
        try {
          await api('/auth/logout', { body: {} });
        } catch (e) {
          // without internet the cookie stays, but this browser forgets the user
          if (!(e instanceof ApiError)) throw e;
        }
        setUser(null);
      },
      expire: () => setUser(null),
    }),
    [status, user, isOffline, signupCode, setUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
