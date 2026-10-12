// Put lines in order: a line of the pool goes at the end of the answer, a line of the answer goes
// back to the pool. For code, any order that passes the checks is accepted.
import { Figures } from '@/components/figure';
import { HighlightedLine } from '@/components/highlight';
import { RichText } from '@/components/rich-text';
import type { OrderStep } from '@/content/types';

import { checkProgram } from '../check';
import { shuffle, type Kind } from './types';

type A = { items: string[]; chosen: number[] };

export const order: Kind<OrderStep, A> = {
  init: (s) => ({ items: shuffle([...s.lines, ...(s.distractors ?? [])]), chosen: [] }),
  ready: (_s, a) => a.chosen.length > 0,
  check: async (s, a, run) => {
    const got = a.chosen.map((i) => a.items[i]);
    if (got.length === s.lines.length && got.every((l, i) => l === s.lines[i])) return { correct: true };
    if (s.mode === 'code' && (s.output !== undefined || s.tests?.length)) {
      const c = await checkProgram(run, got.join('\n'), { output: s.output, tests: s.tests });
      if (c.ok) return { correct: true };
      return { correct: false, message: c.reason };
    }
    const placed = got.filter((l, i) => l === s.lines[i]).length;
    const extra = got.some((l) => !s.lines.includes(l));
    return {
      correct: false,
      message: extra
        ? 'Une ligne de votre réponse ne fait pas partie de la solution.'
        : got.length < s.lines.length
          ? `Il manque ${s.lines.length - got.length} ligne(s).`
          : `${placed} ligne(s) sur ${s.lines.length} sont à la bonne place.`,
    };
  },
  solution: (s, a) => {
    const used = new Set<number>();
    const chosen = s.lines.map((l) => {
      const i = a.items.findIndex((x, j) => x === l && !used.has(j));
      used.add(i);
      return i;
    });
    return { ...a, chosen };
  },
  View: ({ step, answer, setAnswer, locked }) => {
    const pool = answer.items.map((_, i) => i).filter((i) => !answer.chosen.includes(i));
    const code = step.mode === 'code';
    const line = (i: number, n?: number) => {
      const text = answer.items[i];
      const indent = code ? /^ */.exec(text)![0].length / 4 : 0;
      return (
        <>
          {n !== undefined ? <span className="order-n">{n}</span> : null}
          {code ? (
            <code className="order-code" style={{ paddingLeft: indent * 22 }}>
              <HighlightedLine line={text.trimStart()} />
            </code>
          ) : (
            <span className="order-text">{text}</span>
          )}
        </>
      );
    };
    return (
      <div className="kind">
        <RichText className="prompt">{step.prompt}</RichText>
        <Figures f={step.figure} />
        <div className="order">
          <section className="order-col">
            <h4 className="label">Votre réponse</h4>
            <ol className="order-answer">
              {answer.chosen.length === 0 ? <li className="order-empty">Choisissez les lignes, dans l'ordre.</li> : null}
              {answer.chosen.map((i, k) => (
                <li key={i}>
                  <button type="button" className="order-item is-placed" disabled={locked} onClick={() => setAnswer({ ...answer, chosen: answer.chosen.filter((x) => x !== i) })} aria-label={`Retirer la ligne ${k + 1}`}>
                    {line(i, k + 1)}
                  </button>
                </li>
              ))}
            </ol>
          </section>
          {pool.length ? (
            <section className="order-col">
              <h4 className="label">Lignes disponibles</h4>
              <ul className="order-pool">
                {pool.map((i) => (
                  <li key={i}>
                    <button type="button" className="order-item" disabled={locked} onClick={() => setAnswer({ ...answer, chosen: [...answer.chosen, i] })}>
                      {line(i)}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        {code ? <p className="muted small">Le décalage de chaque ligne est déjà le bon : regardez-le pour trouver l'ordre.</p> : null}
      </div>
    );
  },
};
