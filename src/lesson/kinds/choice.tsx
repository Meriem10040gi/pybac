import { CodeView } from '@/components/code-view';
import { Figures } from '@/components/figure';
import { RichText } from '@/components/rich-text';
import type { ChoiceStep } from '@/content/types';

import type { Kind } from './types';

export const choice: Kind<ChoiceStep, number | null> = {
  init: () => null,
  ready: (_s, a) => a !== null,
  check: async (s, a) => ({ correct: a === s.answer }),
  solution: (s) => s.answer,
  oneShot: true,
  View: ({ step, answer, setAnswer, locked }) => (
    <div className="kind">
      <RichText className="prompt">{step.prompt}</RichText>
      {step.code ? <CodeView code={step.code} /> : null}
      <Figures f={step.figure} />
      <div className={`options${step.options.length === 4 && step.mono ? ' options-grid' : ''}`} role="radiogroup" aria-label="Réponses">
        {step.options.map((o, i) => {
          const chosen = answer === i;
          const good = locked && i === step.answer;
          const bad = locked && chosen && i !== step.answer;
          const cls = ['option', chosen && 'is-chosen', good && 'is-good', bad && 'is-bad'].filter(Boolean).join(' ');
          return (
            <button key={i} type="button" role="radio" aria-checked={chosen} disabled={locked} onClick={() => setAnswer(i)} className={cls}>
              <span className="option-letter" aria-hidden>
                {String.fromCharCode(65 + i)}
              </span>
              {step.mono ? <span className="option-mono mono">{o}</span> : <RichText as="span">{o}</RichText>}
            </button>
          );
        })}
      </div>
      {!locked ? <p className="hint-keys">Au clavier : les touches A, B, C, D choisissent une réponse.</p> : null}
    </div>
  ),
};
