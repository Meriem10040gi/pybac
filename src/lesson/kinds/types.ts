// What every exercise kind provides to the lesson player.
import type { Step } from '@/content/types';

import type { Runner } from '../check';

export type Feedback = {
  correct: boolean;
  /** Why it is wrong (inline markup), shown in the feedback panel. */
  message?: string;
  /** Extra data the exercise view uses to show what was right or wrong. */
  detail?: unknown;
};

export type KindProps<S extends Step, A> = {
  step: S;
  answer: A;
  setAnswer: (a: A) => void;
  feedback: Feedback | null;
  /** The answer has been checked (or the solution shown): the view is read-only. */
  locked: boolean;
};

export type Kind<S extends Step, A> = {
  init: (step: S) => A;
  ready: (step: S, answer: A) => boolean;
  check: (step: S, answer: A, run: Runner) => Promise<Feedback>;
  /** The answer filled with the solution ("Voir la solution"). */
  solution: (step: S, answer: A) => A;
  View: (props: KindProps<S, A>) => React.ReactElement;
  /** A wrong answer shows the right one at once (multiple choice): no second try. */
  oneShot?: boolean;
  /** Uses the whole width of a computer screen (instructions and editor side by side). */
  wide?: boolean;
};

/** Shuffles a copy of the array; tries to avoid giving back the original order. */
export function shuffle<T>(items: T[]): T[] {
  for (let attempt = 0; attempt < 5; attempt++) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (a.length < 2 || a.some((x, i) => x !== items[i])) return a;
  }
  return [...items].reverse();
}
