// Back-office: the list of the students (search, sort, export) and the page of one student
// (lesson by lesson, new password, delete the account).
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { Button, ProgressBar } from '@/components/ui';
import { COURSE, LESSONS } from '@/content/course';
import { api } from '@/state/api';
import { useAuth } from '@/state/auth';

import { ago, dateFmt, doneCount, downloadCsv, lastActive, positionOf, streakNow, useAdminData, type Student } from './data';
import { ActivityCalendar, ModuleBars, StudentFigures, studentLine, WhereNow } from './student-stats';
import { BoHead } from './shell';

type Sort = 'active' | 'done' | 'xp' | 'email';

export function StudentsPage() {
  const { accounts, students, error, loading, reload } = useAdminData();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('active');
  const [withAdmins, setWithAdmins] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (withAdmins ? (accounts ?? []) : students).filter((s) => !q || s.email.includes(q));
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
  }, [accounts, students, query, sort, withAdmins]);

  return (
    <div className="bo-page">
      <BoHead title="Élèves" sub={accounts ? `${students.length} élève${students.length > 1 ? 's' : ''} inscrit${students.length > 1 ? 's' : ''}` : 'Chargement…'}>
        <Button small variant="ghost" label="Actualiser" onClick={reload} busy={loading} />
        <Button small variant="ghost" label="Exporter pour un tableur" onClick={() => downloadCsv(students)} disabled={!students.length} />
      </BoHead>

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
        <label className="bo-check">
          <input type="checkbox" checked={withAdmins} onChange={(e) => setWithAdmins(e.target.checked)} />
          Montrer les administrateurs
        </label>
      </div>

      {accounts && rows.length === 0 ? <p className="muted">{students.length ? 'Aucun élève ne correspond à cette recherche.' : 'Personne n\'a encore créé de compte élève.'}</p> : null}

      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Élève</th>
                <th scope="col">Où en est-il</th>
                <th scope="col">Leçons terminées</th>
                <th scope="col">XP</th>
                <th scope="col">Jours d'affilée</th>
                <th scope="col">Dernière activité</th>
                <th scope="col">Inscription</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const n = doneCount(s.progress);
                return (
                  <tr key={s.id}>
                    <th scope="row">
                      <Link to={`/admin/eleves/${s.id}`}>{s.email}</Link>
                      {s.isAdmin ? <span className="tag">admin</span> : null}
                    </th>
                    <td className="st-where-cell">
                      <Where s={s} />
                    </td>
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
                    <td>{dateFmt.format(new Date(s.createdAt))}</td>
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

/** Short version of "Où en est-il ?", for the list. */
function Where({ s }: { s: Student }) {
  const pos = positionOf(s);
  if (pos.kind === 'finished') return <span className="muted">parcours terminé</span>;
  return (
    <span className="st-where-short">
      <span className={pos.kind === 'current' ? 'is-current' : undefined}>{pos.at.lesson.title}</span>
      <span className="muted small">{pos.kind === 'current' ? `en cours, étape ${pos.pos + 1} sur ${pos.total}` : doneCount(s.progress) === 0 ? 'pas encore commencé' : 'prochaine leçon'}</span>
    </span>
  );
}

export function StudentPage() {
  const { id } = useParams();
  const { accounts, error } = useAdminData();
  const s = accounts?.find((x) => String(x.id) === id);

  return (
    <div className="bo-page">
      <Link to="/admin/eleves" className="back">
        ‹ Tous les élèves
      </Link>
      {error ? (
        <div className="alert alert-bad" role="alert">
          <p>{error}</p>
        </div>
      ) : null}
      {!accounts && !error ? <p className="muted">Chargement…</p> : null}
      {accounts && !s ? <p className="muted">Ce compte n'existe pas (ou plus).</p> : null}
      {s ? <StudentDetail s={s} /> : null}
    </div>
  );
}

function StudentDetail({ s }: { s: Student }) {
  const p = s.progress;
  return (
    <>
      <BoHead title={s.email} sub={studentLine(s)} />

      <div className="st-top">
        <WhereNow s={s} />
        <StudentFigures s={s} />
      </div>

      <div className="st-grid">
        <ActivityCalendar s={s} />
        <ModuleBars s={s} />
      </div>

      <h2 className="st-section">Détail leçon par leçon</h2>
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
                              {dateFmt.format(new Date(`${rec.date}T12:00:00`))}
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
      {!s.isAdmin ? <DeleteAccount student={s} /> : null}
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
      setMsg({ ok: true, text: 'Mot de passe changé. Donnez-le à l\'élève : ses appareils lui demanderont de se reconnecter.' });
      setPassword('');
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Échec.' });
    }
    setBusy(false);
  };

  return (
    <section className="bo-card">
      <h2>Nouveau mot de passe</h2>
      <p className="muted small">Pour un élève qui a oublié le sien. L'ancien mot de passe ne marchera plus.</p>
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

function DeleteAccount({ student }: { student: Student }) {
  const { reload } = useAdminData();
  const auth = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (auth.user?.id === student.id) return null;

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/users/${student.id}`, { method: 'DELETE', body: {} });
      reload();
      navigate('/admin/eleves');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec.');
      setBusy(false);
    }
  };

  return (
    <section className="bo-card bo-danger">
      <h2>Supprimer le compte</h2>
      <p className="muted small">Le compte et toute sa progression sont effacés pour toujours. L'élève pourra recréer un compte, qui repartira de zéro.</p>
      {confirm ? (
        <div className="row">
          <Button small variant="ghost" label="Annuler" onClick={() => setConfirm(false)} />
          <Button small variant="bad" label={`Supprimer ${student.email}`} onClick={() => void remove()} busy={busy} />
        </div>
      ) : (
        <div>
          <Button small variant="ghost" label="Supprimer ce compte…" onClick={() => setConfirm(true)} />
        </div>
      )}
      {error ? (
        <div className="alert alert-bad" role="alert">
          <p>{error}</p>
        </div>
      ) : null}
    </section>
  );
}
