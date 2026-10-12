// "Suivi des élèves" (admins only): every account with its progress, the detail of one student
// lesson by lesson, a new password for a student who forgot it, and an export for a spreadsheet.
// The server checks again that the user is an admin (server/app.ts): this page only shows.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';

import { Button, ProgressBar } from '@/components/ui';
import { COURSE, LESSONS } from '@/content/course';
import { api } from '@/state/api';
import { useAuth } from '@/state/auth';
import type { Saved } from '@/state/merge';

import { NotFound } from './not-found';

type Student = {
  id: number;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  progress: Saved;
  progressUpdatedAt: string | null;
};

const day = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function streakNow(p: Saved) {
  const today = day(new Date());
  const yesterday = day(new Date(Date.now() - 86400000));
  return p.streak.last === today || p.streak.last === yesterday ? p.streak.count : 0;
}

/** Last time the student did something: last save of the progress or last login. */
function lastActive(s: Student): Date | null {
  const t = Math.max(s.progressUpdatedAt ? Date.parse(s.progressUpdatedAt) : 0, s.lastLoginAt ? Date.parse(s.lastLoginAt) : 0);
  return t ? new Date(t) : null;
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

function ago(d: Date | null) {
  if (!d) return 'jamais';
  const days = Math.floor((new Date(day(new Date())).getTime() - new Date(day(d)).getTime()) / 86400000);
  if (days <= 0) return 'aujourd\'hui';
  if (days === 1) return 'hier';
  if (days < 30) return `il y a ${days} jours`;
  return dateFmt.format(d);
}

const doneCount = (p: Saved) => LESSONS.filter((l) => p.done[l.lesson.id]).length;

function useStudents() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    setError(null);
    api<{ users: Student[] }>('/admin/users')
      .then((r) => setStudents(r.users))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);
  return { students, error, reload: load };
}

type Sort = 'email' | 'done' | 'xp' | 'active';

export function AdminPage() {
  const auth = useAuth();
  const { students, error, reload } = useStudents();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('active');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (students ?? []).filter((s) => !q || s.email.includes(q));
    const key: Record<Sort, (s: Student) => number | string> = {
      email: (s) => s.email,
      done: (s) => -doneCount(s.progress),
      xp: (s) => -s.progress.xp,
      active: (s) => -(lastActive(s)?.getTime() ?? 0),
    };
    return [...list].sort((a, b) => {
      const x = key[sort](a);
      const y = key[sort](b);
      return x < y ? -1 : x > y ? 1 : a.email.localeCompare(b.email);
    });
  }, [students, query, sort]);

  if (!auth.user?.isAdmin) return <NotFound inShell />;

  const week = Date.now() - 7 * 86400000;
  const activeWeek = (students ?? []).filter((s) => (lastActive(s)?.getTime() ?? 0) > week).length;

  return (
    <div className="page admin">
      <header className="page-head admin-head">
        <div>
          <h1>Suivi des élèves</h1>
          <p className="muted">
            {students ? `${students.length} compte${students.length > 1 ? 's' : ''}, dont ${activeWeek} actif${activeWeek > 1 ? 's' : ''} ces 7 derniers jours.` : 'Chargement…'}
          </p>
        </div>
        <div className="row">
          <Button small variant="ghost" label="Actualiser" onClick={reload} />
          <Button small variant="ghost" label="Exporter pour un tableur" onClick={() => students && downloadCsv(students)} disabled={!students?.length} />
        </div>
      </header>

      {error ? (
        <div className="alert alert-bad" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      <div className="admin-tools">
        <label className="field admin-search">
          <span>Chercher un élève</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="adresse e-mail" />
        </label>
        <label className="field">
          <span>Trier par</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="active">dernière activité</option>
            <option value="done">leçons terminées</option>
            <option value="xp">XP</option>
            <option value="email">adresse e-mail</option>
          </select>
        </label>
      </div>

      {students && rows.length === 0 ? <p className="muted">{students.length ? 'Aucun élève ne correspond à cette recherche.' : 'Personne n\'a encore créé de compte. Donnez l\'adresse du site à vos élèves.'}</p> : null}

      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Élève</th>
                <th scope="col">Leçons terminées</th>
                <th scope="col">XP</th>
                <th scope="col">Jours d'affilée</th>
                <th scope="col">Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const n = doneCount(s.progress);
                return (
                  <tr key={s.id}>
                    <th scope="row">
                      <Link to={`/suivi/${s.id}`}>{s.email}</Link>
                      {s.isAdmin ? <span className="tag">admin</span> : null}
                    </th>
                    <td>
                      <span className="admin-done">
                        <ProgressBar value={n / LESSONS.length} label={`${n} leçons sur ${LESSONS.length}`} />
                        <span>
                          {n}/{LESSONS.length}
                        </span>
                      </span>
                    </td>
                    <td>{s.progress.xp}</td>
                    <td>{streakNow(s.progress)}</td>
                    <td>{ago(lastActive(s))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export function AdminStudentPage() {
  const auth = useAuth();
  const { id } = useParams();
  const { students, error } = useStudents();
  if (!auth.user?.isAdmin) return <NotFound inShell />;
  const s = students?.find((x) => String(x.id) === id);

  return (
    <div className="page admin">
      <Link to="/suivi" className="back">
        ‹ Tous les élèves
      </Link>
      {error ? (
        <div className="alert alert-bad" role="alert">
          <p>{error}</p>
        </div>
      ) : null}
      {!students && !error ? <p className="muted">Chargement…</p> : null}
      {students && !s ? <p className="muted">Cet élève n'existe pas (ou plus).</p> : null}
      {s ? <StudentDetail s={s} /> : null}
    </div>
  );
}

function StudentDetail({ s }: { s: Student }) {
  const p = s.progress;
  const n = doneCount(p);
  return (
    <>
      <header className="page-head">
        <h1 className="admin-email">{s.email}</h1>
        <p className="muted">
          Inscrit le {dateFmt.format(new Date(s.createdAt))}. Dernière activité : {ago(lastActive(s))}.
          {p.freeAccess ? ' Mode libre activé.' : ''}
        </p>
      </header>

      <dl className="admin-stats">
        <div>
          <dt>Leçons terminées</dt>
          <dd>
            {n} sur {LESSONS.length}
          </dd>
        </div>
        <div>
          <dt>XP</dt>
          <dd>{p.xp}</dd>
        </div>
        <div>
          <dt>Jours d'affilée</dt>
          <dd>{streakNow(p)}</dd>
        </div>
      </dl>

      {COURSE.map((m) => (
        <section key={m.id} className="admin-module">
          <h2>{m.title}</h2>
          {m.units.map((u) => {
            const d = u.lessons.filter((l) => p.done[l.id]).length;
            return (
              <details key={u.id} className="admin-unit" open={d > 0 && d < u.lessons.length}>
                <summary>
                  <span>{u.title}</span>
                  <span className="muted">
                    {d}/{u.lessons.length}
                  </span>
                </summary>
                <ul>
                  {u.lessons.map((l) => {
                    const rec = p.done[l.id];
                    const cur = p.inProgress[l.id];
                    return (
                      <li key={l.id} className={rec ? 'is-done' : cur ? 'is-current' : undefined}>
                        <span>{l.title}</span>
                        <span className="admin-lesson-state">
                          {rec ? (
                            <>
                              <span className="path-stars" aria-label={`${rec.stars} étoiles sur 3`}>
                                {'★'.repeat(rec.stars)}
                                <span className="path-stars-off">{'★'.repeat(3 - rec.stars)}</span>
                              </span>{' '}
                              {dateFmt.format(new Date(rec.date))}
                            </>
                          ) : cur ? (
                            `en cours, étape ${cur.pos + 1} sur ${cur.total}`
                          ) : (
                            'pas commencée'
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })}
        </section>
      ))}

      <NewPassword student={s} />
    </>
  );
}

function NewPassword({ student }: { student: Student }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api(`/admin/users/${student.id}/password`, { body: { password } });
      setMsg({ ok: true, text: `Mot de passe changé. Donnez-le à l'élève : il se connecte avec, puis ses autres appareils lui demanderont de se reconnecter.` });
      setPassword('');
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Échec.' });
    }
    setBusy(false);
  };

  return (
    <section className="admin-password">
      <h2>Nouveau mot de passe</h2>
      <p className="muted">Pour un élève qui a oublié le sien. L'ancien mot de passe ne marchera plus.</p>
      <form className="row" onSubmit={submit}>
        <label className="field" style={{ flex: 1, minWidth: 220 }}>
          <span className="visually-hidden">Nouveau mot de passe</span>
          <input autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="au moins 8 caractères" />
        </label>
        <button type="submit" className="btn btn-primary btn-small" disabled={busy || password.length < 8}>
          Changer le mot de passe
        </button>
      </form>
      {msg ? (
        <div className={`alert ${msg.ok ? 'alert-info' : 'alert-bad'}`} role="status">
          <p>{msg.text}</p>
        </div>
      ) : null}
    </section>
  );
}

/** One line per student, one column per lesson (stars, empty if not done). Separator ";" and BOM:
 * opens directly in Excel or LibreOffice set to French. */
function downloadCsv(students: Student[]) {
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
