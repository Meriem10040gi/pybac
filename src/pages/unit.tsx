// A unit: its lessons and défis, in order, as a path (done, in progress, open, locked).
import { Link, useParams } from 'react-router';

import { COURSE, findUnit } from '@/content/course';
import { useProgress } from '@/state/progress';

import { NotFound } from './not-found';

const NUMBER = new Map(COURSE.flatMap((m) => m.units).map((u, i) => [u.id, i + 1]));

export function UnitPage() {
  const { id = '' } = useParams();
  const found = findUnit(id);
  const progress = useProgress();
  if (!found) return <NotFound inShell />;
  const { unit, module } = found;

  return (
    <div className="page unit">
      <Link to="/" className="back">
        ‹ Sommaire
      </Link>
      <header className="unit-head">
        <span className="unit-number" aria-hidden>
          {NUMBER.get(unit.id)}
        </span>
        <div>
          <p className="muted">
            {module.title}
            {unit.chapter ? `, ${unit.chapter.toLowerCase()}` : ''}
          </p>
          <h1>{unit.title}</h1>
          <p className="unit-sub">{unit.subtitle}</p>
        </div>
      </header>

      <ol className="path">
        {unit.lessons.map((l) => {
          const rec = progress.done[l.id];
          const cur = progress.inProgress[l.id];
          const open = progress.isUnlocked(l.id);
          const defi = l.type === 'defi';
          // cards and demos only explain: the other steps are exercises (same rule as isExercise in lesson/kinds)
          const n = l.steps.filter((s) => s.kind !== 'card' && s.kind !== 'demo').length;
          const state = cur ? 'is-current' : rec ? 'is-done' : !open ? 'is-locked' : 'is-open';
          const body = (
            <>
              <span className={`path-node${defi ? ' is-defi' : ''}`} aria-hidden>
                {cur ? '▶' : rec ? '✓' : !open ? '🔒' : defi ? '🏆' : '▶'}
              </span>
              <span className="path-main">
                <span className="path-kind">{cur ? 'En cours' : defi ? 'Défi' : 'Leçon'}</span>
                <span className="path-title">{l.title}</span>
                <span className="path-meta">
                  {n} exercice{n > 1 ? 's' : ''}
                  {cur ? `, étape ${cur.pos + 1} sur ${cur.total}` : ''}
                  {rec && !cur ? (
                    <span className="path-stars" aria-label={`${rec.stars} étoiles sur 3`}>
                      {'★'.repeat(rec.stars)}
                      <span className="path-stars-off">{'★'.repeat(3 - rec.stars)}</span>
                    </span>
                  ) : null}
                </span>
              </span>
            </>
          );
          return (
            <li key={l.id} className={`path-step ${state}`}>
              {open ? (
                <Link to={`/lecon/${l.id}`} className="path-link">
                  {body}
                </Link>
              ) : (
                <div className="path-link">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
