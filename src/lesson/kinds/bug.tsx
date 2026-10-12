import { CodeView, type LineState } from '@/components/code-view';
import { Figures } from '@/components/figure';
import { RichText } from '@/components/rich-text';
import type { BugStep } from '@/content/types';

import type { Kind } from './types';

export const bug: Kind<BugStep, number | null> = {
  init: () => null,
  ready: (_s, a) => a !== null,
  check: async (s, a) => ({ correct: a === s.line }),
  solution: (s) => s.line,
  oneShot: true,
  View: ({ step, answer, setAnswer, locked }) => {
    const state: Record<number, LineState> = {};
    if (answer !== null) state[answer] = locked ? (answer === step.line ? 'good' : 'bad') : 'selected';
    if (locked) state[step.line] = 'good';
    return (
      <div className="kind">
        <RichText className="prompt">{step.prompt}</RichText>
        <Figures f={step.figure} />
        <CodeView code={step.code} lineState={state} onLinePress={locked ? undefined : setAnswer} large />
        <p className="muted small">{answer === null ? 'Cliquez ou touchez la ligne qui contient l\'erreur.' : `Vous avez choisi la ligne ${answer}.`}</p>
      </div>
    );
  },
};
