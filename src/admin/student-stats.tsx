// The tracking of one student in the back-office: where they are now, their figures, their activity
// day by day (a calendar of the last weeks) and their progress in each module.
import { useState } from 'react';

import { ProgressBar } from '@/components/ui';
import { COURSE, LESSONS } from '@/content/course';

import { ago, dateFmt, day, daysAgo, doneCount, finishedPerDay, lastActive, lastFinished, positionOf, streakNow, type Student } from './data';

const Stars = ({ n }: { n: number }) => (
  <span className="path-stars" aria-label={`${n} étoile${n > 1 ? 's' : ''} sur 3`}>
    {'★'.repeat(n)}
    <span className="path-stars-off">{'★'.repeat(3 - n)}</span>
  </span>
);

// ---------------------------------------------------------------- where now

export function WhereNow({ s }: { s: Student }) {
  const pos = positionOf(s);
  const last = lastFinished(s);
  return (
    <section className="bo-card st-where" aria-labelledby="st-where-title">
      <h2 id="st-where-title">Où en est-il ?</h2>
      {pos.kind === 'current' ? (
        <div className="st-where-main">
          <span className="st-where-kind is-current">Leçon en cours</span>
          <span className="st-where-title">{pos.at.lesson.title}</span>
          <span className="muted small">
            {pos.at.module.title}, {pos.at.unit.title}
          </span>
          <div className="st-where-step">
            <ProgressBar value={pos.pos / pos.total} color="var(--marge)" label={`Étape ${pos.pos + 1} sur ${pos.total}`} />
            <span className="small">
              étape {pos.pos + 1} sur {pos.total}
            </span>
          </div>
          <span className="muted small">Laissée {ago(pos.since)}{daysAgo(pos.since) >= 3 ? ' : il est peut-être bloqué.' : '.'}</span>
        </div>
      ) : pos.kind === 'next' ? (
        <div className="st-where-main">
          <span className="st-where-kind">{doneCount(s.progress) === 0 ? 'Pas encore commencé' : 'Prochaine leçon'}</span>
          <span className="st-where-title">{pos.at.lesson.title}</span>
          <span className="muted small">
            {pos.at.module.title}, {pos.at.unit.title}
          </span>
        </div>
      ) : (
        <div className="st-where-main">
          <span className="st-where-kind is-done">Parcours terminé</span>
          <span className="st-where-title">Toutes les leçons sont faites.</span>
        </div>
      )}
      <p className="st-where-last small">
        {last ? (
          <>
            Dernière leçon terminée : <strong>{last.at.lesson.title}</strong> <Stars n={last.stars} />, {ago(last.date)}.
          </>
        ) : (
          'Aucune leçon terminée pour l\'instant.'
        )}{' '}
        Dernière connexion : {ago(s.lastLoginAt ? new Date(s.lastLoginAt) : null)}.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------- figures

export function StudentFigures({ s }: { s: Student }) {
  const p = s.progress;
  const n = doneCount(p);
  const recs = Object.values(p.done);
  const avg = recs.length ? recs.reduce((t, r) => t + r.stars, 0) / recs.length : 0;
  const perDay = finishedPerDay(s);
  const today = new Date();
  let active30 = 0;
  for (let i = 0; i < 30; i++) if (perDay.get(day(new Date(today.getTime() - i * 86400000)))) active30++;
  const count = (k: number) => recs.filter((r) => r.stars === k).length;

  return (
    <dl className="bo-kpis">
      <div>
        <dt>Avancement</dt>
        <dd>
          {Math.round((n / LESSONS.length) * 100)} % <small>{n}/{LESSONS.length}</small>
        </dd>
      </div>
      <div>
        <dt>Étoiles en moyenne</dt>
        <dd>
          {recs.length ? avg.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '–'} <small>sur 3</small>
        </dd>
        <span className="st-stars-split small">
          <span>
            <Stars n={3} /> {count(3)}
          </span>
          <span>
            <Stars n={2} /> {count(2)}
          </span>
          <span>
            <Stars n={1} /> {count(1)}
          </span>
        </span>
      </div>
      <div>
        <dt>Jours actifs sur les 30 derniers</dt>
        <dd>
          {active30} <small>jour{active30 > 1 ? 's' : ''}</small>
        </dd>
      </div>
      <div>
        <dt>Jours d'affilée</dt>
        <dd>{streakNow(p)}</dd>
      </div>
      <div>
        <dt>XP</dt>
        <dd>{p.xp}</dd>
      </div>
    </dl>
  );
}

// ---------------------------------------------------------------- activity calendar

const WEEKS = 12;
const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
/** One hue (the navy of the app), light to dark: 1, 2, 3, 4 or more lessons in the day. */
const SHADES = ['#c9daec', '#8fb0d1', '#4f7fae', '#1f4b73'];
const shade = (n: number) => (n <= 0 ? null : SHADES[Math.min(n, 4) - 1]);

export function ActivityCalendar({ s }: { s: Student }) {
  const perDay = finishedPerDay(s);
  const [tip, setTip] = useState<{ x: number; y: number; text: string; value: string } | null>(null);

  // weeks start on Monday; the last column is the current week
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const start = new Date(monday);
  start.setDate(monday.getDate() - (WEEKS - 1) * 7);
  const created = new Date(day(new Date(s.createdAt)) + 'T12:00:00');

  const weeks: { date: Date; key: string; n: number; future: boolean; before: boolean }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const key = day(date);
      col.push({ date, key, n: perDay.get(key) ?? 0, future: date > today, before: date < created });
    }
    weeks.push(col);
  }
  const total = weeks.flat().reduce((t, c) => t + c.n, 0);

  const show = (e: React.SyntheticEvent<HTMLElement>, c: (typeof weeks)[number][number]) => {
    const box = (e.currentTarget.closest('.st-cal') as HTMLElement).getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    setTip({
      x: r.left - box.left + r.width / 2,
      y: r.top - box.top,
      value: c.n ? `${c.n} leçon${c.n > 1 ? 's' : ''} terminée${c.n > 1 ? 's' : ''}` : 'aucune leçon terminée',
      text: `${DAY_NAMES[(c.date.getDay() + 6) % 7]} ${c.date.getDate()} ${MONTHS[c.date.getMonth()]}`,
    });
  };

  return (
    <section className="bo-card" aria-labelledby="st-cal-title">
      <div className="st-cal-head">
        <h2 id="st-cal-title">Activité</h2>
        <span className="muted small">
          {total} leçon{total > 1 ? 's' : ''} terminée{total > 1 ? 's' : ''} ces {WEEKS} dernières semaines
        </span>
      </div>
      <div className="st-cal" onPointerLeave={() => setTip(null)}>
        <div className="st-cal-grid" role="grid" aria-label={`Leçons terminées par jour, ${WEEKS} dernières semaines`}>
          <div className="st-cal-days" aria-hidden>
            <span />
            {['L', '', 'M', '', 'V', '', ''].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          {weeks.map((col, w) => {
            // the name of the month above the first week that starts in it (not on the first column
            // when a new month starts just after: the two names would overlap)
            const first = col[0].date;
            const newMonth = w > 0 && first.getMonth() !== weeks[w - 1][0].date.getMonth();
            const nextChange = weeks.findIndex((c2, i) => i > 0 && c2[0].date.getMonth() !== weeks[i - 1][0].date.getMonth());
            const showMonth = newMonth || (w === 0 && (nextChange === -1 || nextChange >= 3));
            return (
              <div key={w} className="st-cal-week" role="row">
                <span className="st-cal-month" aria-hidden>
                  {showMonth ? MONTHS[first.getMonth()] : ''}
                </span>
                {col.map((c) =>
                  c.future ? (
                    <span key={c.key} className="st-cal-cell is-future" aria-hidden />
                  ) : (
                    <span
                      key={c.key}
                      role="gridcell"
                      tabIndex={0}
                      className={`st-cal-cell${c.before ? ' is-before' : ''}${c.n ? ' has-value' : ''}`}
                      style={{ background: shade(c.n) ?? undefined }}
                      aria-label={`${DAY_NAMES[(c.date.getDay() + 6) % 7]} ${c.date.getDate()} ${MONTHS[c.date.getMonth()]} : ${c.n} leçon${c.n > 1 ? 's' : ''}`}
                      onPointerEnter={(e) => show(e, c)}
                      onFocus={(e) => show(e, c)}
                      onBlur={() => setTip(null)}
                    />
                  ),
                )}
              </div>
            );
          })}
        </div>
        {tip ? (
          <div className="st-tip" style={{ left: tip.x, top: tip.y }} role="tooltip">
            <strong>{tip.value}</strong>
            <span>{tip.text}</span>
          </div>
        ) : null}
      </div>
      <div className="st-cal-legend" aria-hidden>
        <span className="muted small">Moins</span>
        <span className="st-cal-cell" />
        {SHADES.map((c) => (
          <span key={c} className="st-cal-cell" style={{ background: c }} />
        ))}
        <span className="muted small">Plus (4 leçons ou plus)</span>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- modules

export function ModuleBars({ s }: { s: Student }) {
  return (
    <section className="bo-card" aria-labelledby="st-mod-title">
      <h2 id="st-mod-title">Progression par module</h2>
      <ul className="st-modules">
        {COURSE.map((m) => {
          const ids = m.units.flatMap((u) => u.lessons.map((l) => l.id));
          const d = ids.filter((id) => s.progress.done[id]).length;
          const current = ids.some((id) => s.progress.inProgress[id]);
          return (
            <li key={m.id}>
              <span className="st-mod-name">
                {m.title}
                {current ? <span className="tag tag-red">en cours</span> : null}
              </span>
              <span className="st-mod-bar" aria-hidden>
                <span style={{ width: `${(d / ids.length) * 100}%` }} />
              </span>
              <span className="st-mod-value">
                {d === ids.length ? '✓ terminé' : `${d} / ${ids.length}`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Registered on…, last seen…: the line under the name of the student. */
export function studentLine(s: Student) {
  return `Inscrit le ${dateFmt.format(new Date(s.createdAt))}. Dernière activité : ${ago(lastActive(s))}.${s.progress.freeAccess ? ' Mode libre activé.' : ''}`;
}
