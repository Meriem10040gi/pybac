// The data of the back-office: every account with its progress (GET /api/admin/users), loaded once
// when the back-office opens and shared by its pages. "Actualiser" loads it again.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { LESSONS } from '@/content/course';
import { api } from '@/state/api';
import type { Saved } from '@/state/merge';

export type Student = {
  id: number;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  progress: Saved;
  progressUpdatedAt: string | null;
};

type AdminData = {
  /** All accounts, admins included. */
  accounts: Student[] | null;
  /** The accounts of the students (without the admins). */
  students: Student[];
  error: string | null;
  loading: boolean;
  loadedAt: Date | null;
  reload: () => void;
};

const Ctx = createContext<AdminData | null>(null);

export function useAdminData() {
  const d = useContext(Ctx);
  if (!d) throw new Error('useAdminData() must be used inside <AdminDataProvider>');
  return d;
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Student[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    api<{ users: Student[] }>('/admin/users')
      .then((r) => {
        setAccounts(r.users);
        setLoadedAt(new Date());
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(reload, [reload]);

  const value = useMemo<AdminData>(
    () => ({ accounts, students: (accounts ?? []).filter((a) => !a.isAdmin), error, loading, loadedAt, reload }),
    [accounts, error, loading, loadedAt, reload],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ---------------------------------------------------------------- helpers

export const day = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function streakNow(p: Saved) {
  const today = day(new Date());
  const yesterday = day(new Date(Date.now() - 86400000));
  return p.streak.last === today || p.streak.last === yesterday ? p.streak.count : 0;
}

/** Last time the student did something: last save of the progress or last login. */
export function lastActive(s: Student): Date | null {
  const t = Math.max(s.progressUpdatedAt ? Date.parse(s.progressUpdatedAt) : 0, s.lastLoginAt ? Date.parse(s.lastLoginAt) : 0);
  return t ? new Date(t) : null;
}

/** Whole days between that date and today (0 = today). */
export function daysAgo(d: Date) {
  return Math.round((new Date(day(new Date())).getTime() - new Date(day(d)).getTime()) / 86400000);
}

export const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
export const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

export function ago(d: Date | null) {
  if (!d) return 'jamais';
  const n = daysAgo(d);
  if (n <= 0) return 'aujourd\'hui';
  if (n === 1) return 'hier';
  if (n < 30) return `il y a ${n} jours`;
  return dateFmt.format(d);
}

export const doneCount = (p: Saved) => LESSONS.filter((l) => p.done[l.lesson.id]).length;

/** When a lesson was finished: the exact moment if known, else the day. */
export function finishedAt(rec: { date: string; at?: number }) {
  return rec.at ? new Date(rec.at) : new Date(`${rec.date}T12:00:00`);
}

/** One line per student, one column per lesson (stars, empty if not done). Separator ";" and BOM:
 * opens directly in Excel or LibreOffice set to French. */
export function downloadCsv(students: Student[]) {
  const cell = (v: string | number) => {
    const t = String(v);
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const head = ['E-mail', 'Leçons terminées', 'XP', "Jours d'affilée", 'Dernière activité', 'Inscription', ...LESSONS.map((l) => `${l.unit.title} : ${l.lesson.title}`)];
  const lines = students.map((s) => {
    const last = lastActive(s);
    return [
      s.email,
      doneCount(s.progress),
      s.progress.xp,
      streakNow(s.progress),
      last ? day(last) : '',
      day(new Date(s.createdAt)),
      ...LESSONS.map((l) => s.progress.done[l.lesson.id]?.stars ?? ''),
    ];
  });
  const csv = '﻿' + [head, ...lines].map((r) => r.map(cell).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `pybac-suivi-${day(new Date())}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
