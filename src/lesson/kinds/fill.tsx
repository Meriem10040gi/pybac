// Fill the blanks: choose a blank, then a word to put there. Words can be used twice.
import { Figures } from '@/components/figure';
import { HighlightedLine } from '@/components/highlight';
import { RichText } from '@/components/rich-text';
import type { FillStep } from '@/content/types';

import { checkProgram, fillCode, parseFill } from '../check';
import { shuffle, type Kind } from './types';

type A = { tokens: string[]; chosen: (number | null)[]; active: number };

export const fill: Kind<FillStep, A> = {
  init: (s) => {
    const { answers } = parseFill(s.code);
    return { tokens: shuffle([...new Set([...answers, ...s.distractors])]), chosen: answers.map(() => null), active: 0 };
  },
  ready: (_s, a) => a.chosen.every((c) => c !== null),
  check: async (s, a, run) => {
    const { answers } = parseFill(s.code);
    const got = a.chosen.map((i) => (i === null ? '' : a.tokens[i]));
    if (got.every((g, i) => g === answers[i])) return { correct: true };
    if (s.output !== undefined || s.tests?.length) {
      const c = await checkProgram(run, fillCode(s.code, got), { output: s.output, tests: s.tests });
      if (c.ok) return { correct: true };
      return { correct: false, message: c.reason };
    }
    const n = got.filter((g, i) => g === answers[i]).length;
    return { correct: false, message: `${n} trou(s) sur ${answers.length} sont justes.` };
  },
  solution: (s, a) => {
    const { answers } = parseFill(s.code);
    return { ...a, chosen: answers.map((ans) => a.tokens.indexOf(ans)) };
  },
  View: ({ step, answer, setAnswer, locked, feedback }) => {
    const { lines, answers } = parseFill(step.code);
    const pick = (t: number) => {
      const chosen = [...answer.chosen];
      chosen[answer.active] = t;
      const next = chosen.findIndex((c, i) => c === null && i !== answer.active);
      setAnswer({ ...answer, chosen, active: next === -1 ? answer.active : next });
    };
    const tapBlank = (b: number) => {
      const chosen = [...answer.chosen];
      if (b === answer.active) chosen[b] = null;
      setAnswer({ ...answer, chosen, active: b });
    };
    return (
      <div className="kind">
        <RichText className="prompt">{step.prompt}</RichText>
        <Figures f={step.figure} />
        <div className="fill-code mono">
          {lines.map((parts, li) => (
            <div key={li} className="fill-line">
              {parts.map((p, pi) => {
                if ('text' in p) {
                  return (
                    <span key={pi} className="fill-text">
                      <HighlightedLine line={p.text} />
                    </span>
                  );
                }
                const t = answer.chosen[p.blank];
                const value = t === null ? '' : answer.tokens[t];
                const shown = locked && feedback;
                const right = value === answers[p.blank];
                const cls = [
                  'blank',
                  !locked && answer.active === p.blank && 'is-active',
                  value !== '' && 'is-filled',
                  shown && (right || feedback.correct ? 'is-good' : 'is-bad'),
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <button key={pi} type="button" disabled={locked} onClick={() => tapBlank(p.blank)} className={cls} aria-label={`Trou ${p.blank + 1}${value ? ` : ${value}` : ', vide'}`}>
                    {value || ' '}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {!locked ? (
          <>
            <p className="muted small">Choisissez un trou (encadré en jaune), puis le mot à y mettre.</p>
            <div className="tokens">
              {answer.tokens.map((t, i) => (
                <button key={i} type="button" onClick={() => pick(i)} className="token mono">
                  {t}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    );
  },
};
