// The student's progress: lessons done, XP, days in a row.
// It is saved at once in this browser (so the app works without internet), then sent to the server,
// which merges it with the copy of the other devices of the student (src/state/merge.ts).
// When the server cannot be reached, the change waits ("dirty") and is sent as soon as possible.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { LESSONS } from '@/content/course';

import { api, ApiError, offline } from './api';
import { clearAllResumes } from './lesson-resume';
import { canon, EMPTY, merge, normalize, same, type InProgress, type Saved } from './merge';
import { getItem, removeItem, setItem } from './storage';

export type { InProgress, LessonRecord } from './merge';

export type SyncState = 'loading' | 'saved' | 'saving' | 'offline';

type Progress = Saved & {
  isDone: (lessonId: string) => boolean;
  isUnlocked: (lessonId: string) => boolean;
  /** First lesson not done yet, in course order. */
  next: () => (typeof LESSONS)[number] | undefined;
  /** The lesson left in the middle most recently, if any. */
  current: () => ((typeof LESSONS)[number] & InProgress) | undefined;
  setInProgress: (lessonId: string, pos: number, total: number) => void;
  clearInProgress: (lessonId: string) => void;
  completeLesson: (lessonId: string, stars: number, xp: number) => void;
  setFreeAccess: (on: boolean) => void;
  reset: () => Promise<void>;
  /** Days in a row, 0 if the last lesson was before yesterday. */
  streakNow: number;
  sync: SyncState;
};

const Ctx = createContext<Progress | null>(null);

export function useProgress() {
  const p = useContext(Ctx);
  if (!p) throw new Error('useProgress() must be used inside <ProgressProvider>');
  return p;
}

const day = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const yesterday = () => day(new Date(Date.now() - 86400000));

function read(key: string): Saved | null {
  try {
    const raw = getItem(key);
    return raw ? normalize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function ProgressProvider({ userId, onExpired, children }: { userId: number; onExpired: () => void; children: React.ReactNode }) {
  const key = `progress-v1:${userId}`;
  const dirtyKey = `progress-dirty:${userId}`;

  // localStorage is synchronous: the progress is there from the first render
  // only the copy of this account: the progress of the version without accounts (key "progress-v1")
  // is not given to anyone, it would land in whichever account logs in first on this browser
  const [saved, setSaved] = useState<Saved>(() => read(key) ?? EMPTY);
  const [sync, setSync] = useState<SyncState>('loading');
  const current = useRef(saved);
  current.current = saved;
  /** The copy of the server, as last seen (canonical text); null until it has been read. */
  const server = useRef<string | null>(null);
  const pushing = useRef(false);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  const fail = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) onExpiredRef.current();
    else setSync('offline');
  }, []);

  /** Receives the copy of the server: merged into this one. */
  const receive = useCallback((data: unknown) => {
    const s = normalize(data);
    server.current = canon(s);
    setSaved((cur) => {
      const m = merge(cur, s);
      return same(m, cur) ? cur : m;
    });
    if (same(merge(current.current, s), s)) {
      removeItem(dirtyKey);
      setSync('saved');
    }
  }, [dirtyKey]);

  const push = useCallback(async () => {
    if (pushing.current) return;
    pushing.current = true;
    setSync('saving');
    try {
      const r = await api<{ data: Saved }>('/progress', { method: 'PUT', body: { data: current.current } });
      receive(r.data);
    } catch (e) {
      fail(e);
    } finally {
      pushing.current = false;
    }
    // changed while it was being sent: send again
    if (server.current !== null && canon(current.current) !== server.current && getItem(dirtyKey)) setTimeout(() => void push(), 500);
  }, [receive, fail, dirtyKey]);

  // first: read the copy of the server
  useEffect(() => {
    let alive = true;
    api<{ data: Saved }>('/progress')
      .then((r) => {
        if (!alive) return;
        receive(r.data);
        if (!same(merge(current.current, normalize(r.data)), normalize(r.data))) void push();
      })
      .catch((e) => alive && fail(e));
    return () => {
      alive = false;
    };
  }, [receive, push, fail]);

  // every change: kept in this browser at once, sent to the server a moment later
  useEffect(() => {
    setItem(key, JSON.stringify(saved));
    if (server.current === null || canon(saved) === server.current) return;
    setItem(dirtyKey, '1');
    const t = setTimeout(() => void push(), 800);
    return () => clearTimeout(t);
  }, [saved, key, dirtyKey, push]);

  // back online, or from time to time: send what is waiting
  useEffect(() => {
    const retry = () => {
      if (getItem(dirtyKey) || server.current === null) {
        if (server.current === null) {
          api<{ data: Saved }>('/progress')
            .then((r) => {
              receive(r.data);
              void push();
            })
            .catch(fail);
        } else void push();
      }
    };
    window.addEventListener('online', retry);
    const timer = setInterval(retry, 60000);
    return () => {
      window.removeEventListener('online', retry);
      clearInterval(timer);
    };
  }, [dirtyKey, push, receive, fail]);

  const update = useCallback((f: (s: Saved) => Saved) => setSaved(f), []);

  const value = useMemo<Progress>(() => {
    const isDone = (id: string) => !!saved.done[id];
    // Lessons open one after the other inside a module; each module can be started on its own,
    // so the student can follow the order of the chapters in class.
    const isUnlocked = (id: string) => {
      if (saved.freeAccess) return true;
      const i = LESSONS.findIndex((l) => l.lesson.id === id);
      if (i <= 0) return true;
      const prev = LESSONS[i - 1];
      return prev.module.id !== LESSONS[i].module.id || isDone(prev.lesson.id);
    };
    const last = saved.streak.last;
    return {
      ...saved,
      sync,
      isDone,
      isUnlocked,
      next: () => LESSONS.find((l) => !isDone(l.lesson.id)),
      current: () => {
        let best: ((typeof LESSONS)[number] & InProgress) | undefined;
        for (const [id, p] of Object.entries(saved.inProgress)) {
          const l = LESSONS.find((x) => x.lesson.id === id);
          if (l && (!best || p.at > best.at)) best = { ...l, ...p };
        }
        return best;
      },
      setInProgress: (lessonId, pos, total) =>
        update((s) => {
          const old = s.inProgress[lessonId];
          if (old && old.pos === pos && old.total === total) return s;
          return { ...s, inProgress: { ...s.inProgress, [lessonId]: { pos, total, at: Date.now() } } };
        }),
      clearInProgress: (lessonId) =>
        update((s) => {
          if (!s.inProgress[lessonId]) return s;
          const { [lessonId]: _gone, ...rest } = s.inProgress;
          return { ...s, inProgress: rest };
        }),
      streakNow: last === day() || last === yesterday() ? saved.streak.count : 0,
      completeLesson: (lessonId, stars, xp) =>
        update((s) => {
          const old = s.done[lessonId];
          const today = day();
          const count = s.streak.last === today ? s.streak.count : s.streak.last === yesterday() ? s.streak.count + 1 : 1;
          const { [lessonId]: _finished, ...inProgress } = s.inProgress;
          return {
            ...s,
            inProgress,
            xp: s.xp + xp,
            done: { ...s.done, [lessonId]: { stars: Math.max(stars, old?.stars ?? 0), xp: (old?.xp ?? 0) + xp, date: today, at: Date.now() } },
            streak: { count, last: today },
          };
        }),
      setFreeAccess: (on) => update((s) => ({ ...s, freeAccess: on, freeAccessAt: Date.now() })),
      reset: async () => {
        clearAllResumes();
        try {
          const r = await api<{ data: Saved }>('/progress/reset', { body: {} });
          const s = normalize(r.data);
          server.current = canon(s);
          setSaved(s);
          removeItem(dirtyKey);
        } catch (e) {
          if (!offline(e)) throw e;
          // without internet: erased here, and on the server at the next connection (higher epoch)
          setSaved((s) => ({ ...EMPTY, epoch: s.epoch + 1 }));
        }
      },
    };
  }, [saved, sync, update, dirtyKey]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
