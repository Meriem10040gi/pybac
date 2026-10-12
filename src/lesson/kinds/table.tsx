// Table of variables: one column per variable, one row per moment of the program.
import { CodeView } from '@/components/code-view';
import { Figures } from '@/components/figure';
import { RichText } from '@/components/rich-text';
import type { TableStep } from '@/content/types';

import { normCell } from '../check';
import type { Kind } from './types';

const given = (cell: string) => cell.startsWith('=');

export const table: Kind<TableStep, string[][]> = {
  init: (s) => s.answer.map((row) => row.map((c) => (given(c) ? c.slice(1) : ''))),
  ready: (s, a) => s.answer.every((row, r) => row.every((c, k) => given(c) || a[r][k].trim() !== '')),
  check: async (s, a) => {
    const wrong: string[] = [];
    let total = 0;
    s.answer.forEach((row, r) =>
      row.forEach((c, k) => {
        if (given(c)) return;
        total++;
        if (normCell(a[r][k]) !== normCell(c)) wrong.push(`${r},${k}`);
      }),
    );
    return wrong.length
      ? { correct: false, message: `${total - wrong.length} case(s) sur ${total} sont justes. Les cases fausses sont en rouge.`, detail: wrong }
      : { correct: true };
  },
  solution: (s) => s.answer.map((row) => row.map((c) => (given(c) ? c.slice(1) : c))),
  View: ({ step, answer, setAnswer, locked, feedback }) => {
    const wrong = new Set((feedback?.detail as string[] | undefined) ?? []);
    const set = (r: number, k: number, v: string) => setAnswer(answer.map((row, i) => (i === r ? row.map((c, j) => (j === k ? v : c)) : row)));
    return (
      <div className="kind">
        <RichText className="prompt">{step.prompt}</RichText>
        <Figures f={step.figure} />
        <div className={step.code ? 'split' : undefined}>
          {step.code ? <CodeView code={step.code} /> : null}
          <div className="vartable-scroll">
            <table className="vartable">
              <thead>
                <tr>
                  <td />
                  {step.columns.map((c) => (
                    <th key={c} scope="col" className="mono">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {step.rows.map((label, r) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {step.columns.map((col, k) => {
                      const cell = step.answer[r][k];
                      if (given(cell)) {
                        return (
                          <td key={k} className="is-given mono">
                            {cell.slice(1)}
                          </td>
                        );
                      }
                      const bad = locked && wrong.has(`${r},${k}`);
                      const good = locked && !bad && feedback !== null;
                      return (
                        <td key={k} className={bad ? 'is-bad' : good ? 'is-good' : undefined}>
                          <input
                            className="mono"
                            value={answer[r][k]}
                            onChange={(e) => set(r, k, e.target.value)}
                            readOnly={locked}
                            autoCapitalize="none"
                            autoCorrect="off"
                            autoComplete="off"
                            spellCheck={false}
                            aria-label={`${col}, ${label}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {step.code ? <p className="muted small">« – » : la variable n'existe pas encore. La touche Tab passe à la case suivante.</p> : null}
      </div>
    );
  },
};
