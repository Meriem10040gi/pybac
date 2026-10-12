// The saved progress of a student, and how two copies are merged (the copy of this browser and the
// copy on the server, which may come from another device). Used by the app and by the server
// (server/app.ts), so both merge the same way. No import here: the server runs this file directly.
//
// Merging never loses a finished lesson: for each lesson the best result is kept. The total XP is
// the sum of the XP of the lessons, so it is always consistent. "Effacer la progression" increases
// `epoch`: a copy with a higher epoch replaces an older one instead of being merged with it.

export type LessonRecord = {
  stars: number;
  xp: number;
  /** Day of completion (YYYY-MM-DD). */
  date: string;
  /** When the lesson was finished (ms), to know if a lesson "in progress" elsewhere is older. */
  at?: number;
};

/** A lesson left in the middle: the step reached, out of how many, and when (to resume the latest one). */
export type InProgress = { pos: number; total: number; at: number };

export type Saved = {
  done: Record<string, LessonRecord>;
  xp: number;
  streak: { count: number; last: string | null };
  /** All lessons open, whatever the order. */
  freeAccess: boolean;
  /** When "Mode libre" was last changed (ms): the latest change wins. */
  freeAccessAt: number;
  inProgress: Record<string, InProgress>;
  /** Number of times the progress was erased. */
  epoch: number;
};

export const EMPTY: Saved = { done: {}, xp: 0, streak: { count: 0, last: null }, freeAccess: false, freeAccessAt: 0, inProgress: {}, epoch: 0 };

const MAX_LESSONS = 2000;
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const num = (x: unknown, min: number, max: number) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(max, Math.max(min, Math.round(x))) : min);
const isDay = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const isId = (k: string) => k.length > 0 && k.length <= 100;

/** Cleans a progress coming from storage or from the network (old format, missing fields, bad values). */
export function normalize(x: unknown): Saved {
  if (!isObj(x)) return EMPTY;
  const done: Saved['done'] = {};
  if (isObj(x.done)) {
    for (const [id, r] of Object.entries(x.done).slice(0, MAX_LESSONS)) {
      if (!isId(id) || !isObj(r)) continue;
      done[id] = { stars: num(r.stars, 0, 3), xp: num(r.xp, 0, 100000), date: isDay(r.date) ? r.date : '1970-01-01', ...(typeof r.at === 'number' ? { at: num(r.at, 0, 1e15) } : {}) };
    }
  }
  const inProgress: Saved['inProgress'] = {};
  if (isObj(x.inProgress)) {
    for (const [id, p] of Object.entries(x.inProgress).slice(0, MAX_LESSONS)) {
      if (!isId(id) || !isObj(p)) continue;
      inProgress[id] = { pos: num(p.pos, 0, 10000), total: num(p.total, 1, 10000), at: num(p.at, 0, 1e15) };
    }
  }
  const streak = isObj(x.streak) ? { count: num(x.streak.count, 0, 100000), last: isDay(x.streak.last) ? x.streak.last : null } : EMPTY.streak;
  return {
    done,
    xp: Object.values(done).reduce((s, r) => s + r.xp, 0),
    streak,
    freeAccess: x.freeAccess === true,
    freeAccessAt: num(x.freeAccessAt, 0, 1e15),
    inProgress,
    epoch: num(x.epoch, 0, 1e9),
  };
}

export function merge(a: Saved, b: Saved): Saved {
  if (a.epoch !== b.epoch) return a.epoch > b.epoch ? a : b;

  const done: Saved['done'] = { ...a.done };
  for (const [id, r] of Object.entries(b.done)) {
    const o = done[id];
    done[id] = o
      ? { stars: Math.max(o.stars, r.stars), xp: Math.max(o.xp, r.xp), date: o.date > r.date ? o.date : r.date, ...(o.at || r.at ? { at: Math.max(o.at ?? 0, r.at ?? 0) } : {}) }
      : r;
  }

  const inProgress: Saved['inProgress'] = {};
  for (const src of [a.inProgress, b.inProgress]) {
    for (const [id, p] of Object.entries(src)) {
      if (!inProgress[id] || p.at > inProgress[id].at) inProgress[id] = p;
    }
  }
  // a lesson finished after it was left in the middle (maybe on another device) is not "in progress"
  for (const [id, p] of Object.entries(inProgress)) {
    const d = done[id];
    if (d && (d.at === undefined || d.at >= p.at)) delete inProgress[id];
  }

  const sa = a.streak;
  const sb = b.streak;
  const streak = (sa.last ?? '') > (sb.last ?? '') ? sa : (sb.last ?? '') > (sa.last ?? '') ? sb : { count: Math.max(sa.count, sb.count), last: sa.last };

  return {
    done,
    xp: Object.values(done).reduce((s, r) => s + r.xp, 0),
    streak,
    ...(b.freeAccessAt > a.freeAccessAt ? { freeAccess: b.freeAccess, freeAccessAt: b.freeAccessAt } : { freeAccess: a.freeAccess, freeAccessAt: a.freeAccessAt }),
    inProgress,
    epoch: a.epoch,
  };
}

/** The same text for the same progress, whatever the order of the keys. */
export function canon(x: unknown): string {
  if (Array.isArray(x)) return `[${x.map(canon).join(',')}]`;
  if (x && typeof x === 'object') {
    return `{${Object.keys(x)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canon((x as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(x) ?? 'null';
}

export function same(a: Saved, b: Saved) {
  return canon(a) === canon(b);
}
