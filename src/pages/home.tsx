// Home: the lesson to do now (with a bit of its code), then the course as the contents page of a
// notebook: modules, and their units with the progress.
import { Link, useNavigate } from 'react-router';

import { HighlightedLine } from '@/components/highlight';
import { PythonStatus } from '@/components/python-status';
import { Account, Settings } from '@/components/settings';
import { Button } from '@/components/ui';
import { COURSE, LESSONS } from '@/content/course';
import type { Lesson, Unit } from '@/content/types';
import { usePython } from '@/python/engine';
import { useProgress } from '@/state/progress';

/** Units are numbered across modules: 1, 2, 3… */
const NUMBER = new Map(COURSE.flatMap((m) => m.units).map((u, i) => [u.id, i + 1]));

/** A few lines of the first program of the lesson, shown on the home page. */
function excerpt(lesson: Lesson): string[] | null {
  for (const s of lesson.steps) {
    const code = 'code' in s && typeof s.code === 'string' && !s.code.includes('{{') ? s.code : s.kind === 'code' ? s.starter : null;
    if (code && code.trim()) return code.split('\n').slice(0, 7);
  }
  return null;
}

export function Home() {
  const progress = useProgress();
  const py = usePython();
  const navigate = useNavigate();
  // a lesson left in the middle comes first; otherwise the first lesson not done yet
  const current = progress.current();
  const next = current ?? progress.next();
  const doneCount = LESSONS.filter((l) => progress.isDone(l.lesson.id)).length;
  const lines = next ? excerpt(next.lesson) : null;

  return (
    <div className="page home">
      {next ? (
        <section className="hero paper" aria-labelledby="hero-title">
          <div className="hero-text">
            <p className="hero-status">
              {current ? `Vous en êtes à l'étape ${current.pos + 1} sur ${current.total}` : progress.xp === 0 ? 'Votre première leçon' : 'Votre prochaine leçon'}
            </p>
            <h1 id="hero-title">{next.lesson.title}</h1>
            <p className="hero-unit">
              {next.unit.title}, dans « {next.module.title} »
            </p>
            <Button label={current ? 'Reprendre la leçon' : progress.xp === 0 ? 'Commencer' : 'Continuer'} variant="gold" onClick={() => navigate(`/lecon/${next.lesson.id}`)} />
          </div>
          {lines ? (
            <pre className="hero-code" aria-hidden>
              {lines.map((l, i) => (
                <span key={i} className="hero-code-line">
                  <span className="hero-code-n">{i + 1}</span>
                  <code>
                    <HighlightedLine line={l || ' '} />
                  </code>
                </span>
              ))}
            </pre>
          ) : null}
        </section>
      ) : (
        <section className="hero paper">
          <div className="hero-text">
            <h1>Toutes les leçons sont terminées</h1>
            <p className="hero-unit">De nouveaux chapitres arrivent bientôt. En attendant, entraînez-vous dans le bac à sable.</p>
            <Button label="Ouvrir le bac à sable" variant="gold" onClick={() => navigate('/bac-a-sable')} />
          </div>
        </section>
      )}

      {py.status !== 'ready' ? <PythonStatus /> : null}

      <section className="toc" aria-labelledby="toc-title">
        <header className="toc-head">
          <h2 id="toc-title">Sommaire</h2>
          <p className="muted">
            {doneCount} leçon{doneCount > 1 ? 's' : ''} terminée{doneCount > 1 ? 's' : ''} sur {LESSONS.length}
          </p>
        </header>
        {COURSE.map((m) => (
          <section key={m.id} className="toc-module">
            <h3>{m.title}</h3>
            <p className="toc-module-sub">{m.subtitle}</p>
            <ol className="toc-units">
              {m.units.map((u) => (
                <UnitRow key={u.id} unit={u} n={NUMBER.get(u.id)!} />
              ))}
              {m.soon?.map((s) => (
                <li key={s.title} className="toc-row is-soon">
                  <span className="toc-n">…</span>
                  <span className="toc-main">
                    <span className="toc-title">{s.title}</span>
                    <span className="toc-sub">{s.subtitle}</span>
                  </span>
                  <span className="toc-leader" />
                  <span className="toc-state">bientôt</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </section>

      <section className="home-settings">
        <h2>Compte et réglages</h2>
        <Account />
        <Settings />
      </section>
    </div>
  );
}

function UnitRow({ unit, n }: { unit: Unit; n: number }) {
  const progress = useProgress();
  const done = unit.lessons.filter((l) => progress.isDone(l.id)).length;
  const open = progress.isUnlocked(unit.lessons[0].id);
  const complete = done === unit.lessons.length;
  const started = unit.lessons.some((l) => progress.inProgress[l.id]);
  const body = (
    <>
      <span className="toc-n">{n}</span>
      <span className="toc-main">
        <span className="toc-title">{unit.title}</span>
        <span className="toc-sub">
          {unit.chapter ? `${unit.chapter}. ` : ''}
          {unit.subtitle}
        </span>
      </span>
      <span className="toc-leader" />
      <span className="toc-state">
        {!open ? (
          <span aria-label="pas encore ouverte">🔒</span>
        ) : complete ? (
          <span className="toc-done" aria-label="terminée">
            ✓
          </span>
        ) : (
          <span aria-label={`${done} leçons terminées sur ${unit.lessons.length}`}>
            {done}/{unit.lessons.length}
          </span>
        )}
      </span>
    </>
  );
  const cls = `toc-row${!open ? ' is-locked' : ''}${complete ? ' is-complete' : ''}${started ? ' is-started' : ''}`;
  return <li>{open ? <Link to={`/unite/${unit.id}`} className={cls}>{body}</Link> : <div className={cls}>{body}</div>}</li>;
}
