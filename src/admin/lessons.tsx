// Back-office: each lesson of the course, with how many students finished it, how many left it in
// the middle, and the average stars (3 = almost everything right the first time).
import { Fragment, useMemo } from 'react';

import { Button, ProgressBar } from '@/components/ui';
import { COURSE } from '@/content/course';

import { useAdminData } from './data';
import { BoHead } from './shell';

export function LessonsPage() {
  const { students, loading, reload, error } = useAdminData();
  const n = students.length;

  const byLesson = useMemo(() => {
    const m = new Map<string, { done: number; current: number; stars: number }>();
    for (const s of students) {
      for (const [id, rec] of Object.entries(s.progress.done)) {
        const x = m.get(id) ?? { done: 0, current: 0, stars: 0 };
        x.done++;
        x.stars += rec.stars;
        m.set(id, x);
      }
      for (const id of Object.keys(s.progress.inProgress)) {
        const x = m.get(id) ?? { done: 0, current: 0, stars: 0 };
        x.current++;
        m.set(id, x);
      }
    }
    return m;
  }, [students]);

  return (
    <div className="bo-page">
      <BoHead title="Leçons" sub={`Pour chaque leçon : les élèves qui l'ont terminée, sur ${n} élève${n > 1 ? 's' : ''} inscrit${n > 1 ? 's' : ''}.`}>
        <Button small variant="ghost" label="Actualiser" onClick={reload} busy={loading} />
      </BoHead>

      {error ? (
        <div className="alert alert-bad" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {COURSE.map((m) => (
        <section key={m.id} className="admin-module">
          <h2>{m.title}</h2>
          <div className="admin-table-wrap">
            <table className="admin-table bo-lessons">
              <thead>
                <tr>
                  <th scope="col">Leçon</th>
                  <th scope="col">Terminée par</th>
                  <th scope="col">En cours</th>
                  <th scope="col">Étoiles en moyenne</th>
                </tr>
              </thead>
              <tbody>
                {m.units.map((u) => (
                  <Fragment key={u.id}>
                    <tr className="bo-unit-row">
                      <th scope="rowgroup" colSpan={4}>
                        {u.title}
                      </th>
                    </tr>
                    {u.lessons.map((l) => {
                      const x = byLesson.get(l.id) ?? { done: 0, current: 0, stars: 0 };
                      return (
                        <tr key={l.id}>
                          <th scope="row">
                            {l.title}
                            {l.type === 'defi' ? <span className="tag tag-gold">défi</span> : null}
                          </th>
                          <td>
                            <span className="admin-done">
                              <ProgressBar value={n ? x.done / n : 0} label={`${x.done} élèves sur ${n}`} />
                              <span>
                                {x.done}/{n}
                              </span>
                            </span>
                          </td>
                          <td>{x.current || ''}</td>
                          <td>{x.done ? `${(x.stars / x.done).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ★` : ''}</td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
