// Where the student stopped inside a lesson (step, answer being written, check already done, XP),
// saved in the browser so that the lesson starts again at the same place. One key per lesson; the key
// is removed when the lesson is finished. The keys include the account, so that two students on the
// same computer do not share their lessons in progress.
import type { Feedback } from '@/lesson/kinds';

import { getItem, keys, removeItem, setItem } from './storage';

let PREFIX = 'lesson-resume-v1:';

/** Called when someone logs in or out (src/state/auth.tsx). */
export function setResumeScope(userId: string | null) {
  PREFIX = userId ? `lesson-resume-v1:${userId}:` : 'lesson-resume-v1:';
}

export type LessonStats = { xp: number; firstTry: number; exercises: number };

export type Snapshot = {
  /** Number of steps of the lesson when saved: if the lesson changes, the snapshot is ignored. */
  steps: number;
  queue: number[];
  pos: number;
  answer: unknown;
  feedback: Feedback | null;
  revealed: boolean;
  attempts: number;
  stats: LessonStats;
};

export function loadResume(lessonId: string, steps: number): Snapshot | null {
  try {
    const raw = getItem(PREFIX + lessonId);
    if (!raw) return null;
    const s = JSON.parse(raw) as Snapshot;
    const valid =
      s.steps === steps &&
      Array.isArray(s.queue) &&
      s.queue.every((i) => Number.isInteger(i) && i >= 0 && i < steps) &&
      Number.isInteger(s.pos) &&
      s.pos >= 0 &&
      s.pos < s.queue.length;
    return valid ? s : null;
  } catch {
    return null;
  }
}

export function saveResume(lessonId: string, snapshot: Snapshot) {
  setItem(PREFIX + lessonId, JSON.stringify(snapshot));
}

export function clearResume(lessonId: string) {
  removeItem(PREFIX + lessonId);
}

export function clearAllResumes() {
  keys()
    .filter((k) => k.startsWith(PREFIX))
    .forEach(removeItem);
}
