// Back-office home: how the class is doing at a glance, what happened lately, who to follow up,
// and the lessons where the students get the fewest stars.
import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import { Button } from '@/components/ui';
import { LESSONS } from '@/content/course';

import { ago, daysAgo, doneCount, finishedAt, lastActive, timeFmt, useAdminData } from './data';
import { BoHead } from './shell';

const STARS = (n: number) => (
  <span className="path-stars" aria-label={`${n} étoiles sur 3`}>
    {'★'.repeat(n)}
    <span className="path-stars-off">{'★'.repeat(3 - n)}</span>
  </span>
);

export function Dashboard() {
  const { students, accounts, loading, loadedAt, error, reload } = useAdminData();

  const stats = useMemo(() => {
    const active = (days: number) => students.filter((s) => {
      const d = lastActive(s);
      return d !== null && daysAgo(d) < days;
    }).length;
    const totalDone = students.reduce((n, s) => n + doneCount(s.progress), 0);

    // every lesson finished, by anyone, most recent first
    const recent = students
      .flatMap((s) => Object.entries(s.progress.done).map(([id, rec]) => ({ s, rec, lesson: LESSONS.find((l) => l.lesson.id === id) })))
      .filter((x) => x.lesson)
      .sort((a, b) => finishedAt(b.rec).getTime() - finishedAt(a.rec).getTime())
      .slice(0, 12);

    // no activity for a week, or never started
    const followUp = students
      .map((s) => ({ s, last: lastActive(s), done: doneCount(s.progress) }))
      .filter((x) => x.done === 0 || !x.last || daysAgo(x.last) >= 7)
      .sort((a, b) => (a.last?.getTime() ?? 0) - (b.last?.getTime() ?? 0))
      .slice(0, 8);

    // lessons finished by at least 2 students (1 when the class is small), fewest stars first
    const minDone = students.length >= 4 ? 2 : 1;
    const hard = LESSONS.map((l) => {
      const recs = students.map((s) => s.progress.done[l.lesson.id]).filter(Boolean);
      return { l, n: recs.length, avg: recs.length ? recs.reduce((t, r) => t + r!.stars, 0) / recs.length : 0 };
    })
      .filter((x) => x.n >= minDone && x.avg < 3)
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 5);

    return { week: active(7), today: active(1), totalDone, recent, followUp, hard };
  }, [students]);

  const n = students.length;

  return (
    <div className="bo-page">
      <BoHead title="Tableau de bord" sub={loadedAt ? `Données de ${timeFmt.format(loadedAt)}` : 'Chargement…'}>
        <Button small variant="ghost" label="Actualiser" onClick={reload} busy={loading} />
      </BoHead>

      {error ? (
        <div className="alert alert-bad" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {accounts && n === 0 ? <Welcome /> : null}

      {n > 0 ? (
        <>
          <dl className="bo-kpis">
            <div>
              <dt>Élèves inscrits</dt>
              <dd>{n}</dd>
            </div>
            <div>
              <dt>Actifs cette semaine</dt>
              <dd>
                {stats.week} <small>sur {n}</small>
              </dd>
            </div>
            <div>
              <dt>Actifs aujourd'hui</dt>
              <dd>{stats.today}</dd>
            </div>
            <div>
              <dt>Leçons terminées par élève, en moyenne</dt>
              <dd>
                {(stats.totalDone / n).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} <small>sur {LESSONS.length}</small>
              </dd>
            </div>
          </dl>

          <div className="bo-grid">
            <section className="bo-card">
              <h2>Activité récente</h2>
              {stats.recent.length === 0 ? <p className="muted">Aucune leçon terminée pour l'instant.</p> : null}
              <ul className="bo-feed">
                {stats.recent.map(({ s, rec, lesson }) => (
                  <li key={`${s.id}-${lesson!.lesson.id}`}>
                    <Link to={`/admin/eleves/${s.id}`} className="bo-feed-who">
                      {s.email}
                    </Link>
                    <span>
                      a terminé <strong>{lesson!.lesson.title}</strong> {STARS(rec.stars)}
                    </span>
                    <span className="muted small">{ago(finishedAt(rec))}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="bo-col">
              <section className="bo-card">
                <h2>À relancer</h2>
                <p className="muted small">Pas d'activité depuis 7 jours, ou aucune leçon terminée.</p>
                {stats.followUp.length === 0 ? <p>Tout le monde a travaillé cette semaine.</p> : null}
                <ul className="bo-list">
                  {stats.followUp.map(({ s, last, done }) => (
                    <li key={s.id}>
                      <Link to={`/admin/eleves/${s.id}`}>{s.email}</Link>
                      <span className="muted small">{done === 0 ? 'aucune leçon terminée' : `dernière activité ${ago(last)}`}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bo-card">
                <h2>Leçons les plus difficiles</h2>
                <p className="muted small">Celles où les élèves ont le moins d'étoiles (justes du premier coup).</p>
                {stats.hard.length === 0 ? <p className="muted">Pas encore assez de leçons terminées.</p> : null}
                <ul className="bo-list">
                  {stats.hard.map(({ l, n: count, avg }) => (
                    <li key={l.lesson.id}>
                      <span>
                        <strong>{l.lesson.title}</strong> <span className="muted small">{l.unit.title}</span>
                      </span>
                      <span className="small">
                        {avg.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ★ en moyenne, {count} élève{count > 1 ? 's' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** No student yet: what to do first. */
function Welcome() {
  const url = window.location.origin;
  const [copied, setCopied] = useState(false);
  return (
    <section className="bo-card bo-welcome">
      <h2>Aucun élève inscrit pour l'instant</h2>
      <p>Donnez l'adresse du site à vos élèves : ils créent leur compte avec leur e-mail, et leur progression apparaît ici.</p>
      <div className="row">
        <code className="bo-url">{url}</code>
        <Button
          small
          variant="ghost"
          label={copied ? 'Adresse copiée' : 'Copier l\'adresse'}
          onClick={() => {
            void navigator.clipboard?.writeText(url).then(() => setCopied(true));
          }}
        />
      </div>
    </section>
  );
}
