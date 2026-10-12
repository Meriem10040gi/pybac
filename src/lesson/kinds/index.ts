import type { Step } from '@/content/types';

import { bug } from './bug';
import { choice } from './choice';
import { code } from './code';
import { fill } from './fill';
import { order } from './order';
import { sql } from './sql';
import { table } from './table';
import type { Kind } from './types';

type ExerciseStep = Exclude<Step, { kind: 'card' } | { kind: 'demo' }>;

const KINDS: { [K in ExerciseStep['kind']]: Kind<Extract<ExerciseStep, { kind: K }>, any> } = { choice, bug, order, fill, table, code, sql };

export function isExercise(step: Step): step is ExerciseStep {
  return step.kind !== 'card' && step.kind !== 'demo';
}

export function kindOf(step: ExerciseStep): Kind<ExerciseStep, any> {
  return KINDS[step.kind] as Kind<ExerciseStep, any>;
}

export type { ExerciseStep };
export type { Feedback } from './types';
