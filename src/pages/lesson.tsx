// Lesson player: one step at a time, "Vérifier" then feedback. Exercises answered wrong come back
// once at the end of the lesson. XP: 10 if right the first time, 5 after a retry, 0 with the solution.
// The state of the lesson is saved at every change (src/state/lesson-resume.ts): leaving in the middle
// and coming back resumes at the same step, with the answer being written.
// Keyboard (computer): Entrée = the main button, Ctrl+Entrée in the editor = Vérifier, A to D = an answer.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { PythonStatus } from '@/components/python-status';
import { RichText } from '@/components/rich-text';
import { Button, ProgressBar } from '@/components/ui';
import { findLesson, LESSONS } from '@/content/course';
import type { Lesson, Step, Unit } from '@/content/types';
import { isExercise, kindOf, type Feedback } from '@/lesson/kinds';
import { CardView, DemoView } from '@/lesson/kinds/info';
import { usePython } from '@/python/engine';
import { clearResume, loadResume, saveResume, type LessonStats, type Snapshot } from '@/state/lesson-resume';
import { useProgress } from '@/state/progress';

import { NotFound } from './not-found';

const PRAISE = ['Bravo !', 'C\'est juste !', 'Bien joué !', 'Excellent !', 'Parfait !'];

export function LessonPage() {
  const { id = '' } = useParams();
  const found = findLesson(id);
  const progress = useProgress();
  const [generation, setGeneration] = useState(0);
  const steps = found?.lesson.steps.length ?? 0;
  // read once per lesson (and again after "Recommencer")
  const [initial, setInitial] = useState(() => ({ id, generation, snap: loadResume(id, steps) }));
  if (initial.id !== id || initial.generation !== generation) setInitial({ id, generation, snap: generation > initial.generation ? null : loadResume(id, steps) });

  useEffect(() => {
    document.title = found ? `${found.lesson.title} · PyBac` : 'PyBac';
    return () => {
      document.title = 'PyBac';
    };
  }, [found]);

  if (!found) return <NotFound />;

  const restart = () => {
    clearResume(id);
    progress.clearInProgress(id);
    setGeneration((g) => g + 1);
  };
  return <Player key={`${id}-${generation}`} lesson={found.lesson} unit={found.unit} initial={initial.snap} onRestart={restart} />;
}

function initFor(step: Step) {
  return isExercise(step) ? kindOf(step).init(step) : null;
}

function usesPython(step: Step) {
  if (step.kind === 'demo' || step.kind === 'code' || step.kind === 'sql') return true;
  if (step.kind === 'order' || step.kind === 'fill') return step.output !== undefined || !!step.tests?.length;
  return false;
}

/** After a click with the mouse on an answer, a word or a line, Entrée must mean "Vérifier", not
 * "press this button again": the button gives the focus back. (A click from the keyboard has detail 0.) */
function releaseFocus(e: React.MouseEvent) {
  const button = (e.target as HTMLElement).closest('button');
  if (button && e.detail > 0) setTimeout(() => button.blur(), 0);
}

/** Typing in a field: Entrée must not move the lesson forward. */
function typing(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

function Player({ lesson, unit, initial, onRestart }: { lesson: Lesson; unit: Unit; initial: Snapshot | null; onRestart: () => void }) {
  const py = usePython();
  const progress = useProgress();
  const steps = lesson.steps;
  const top = useRef<HTMLDivElement>(null);

  const [queue, setQueue] = useState<number[]>(() => initial?.queue ?? steps.map((_, i) => i));
  const [pos, setPos] = useState(() => initial?.pos ?? 0);
  const [answer, setAnswer] = useState<any>(() => {
    if (initial && initial.answer !== undefined && initial.answer !== null) return initial.answer;
    return initFor(steps[initial ? initial.queue[initial.pos] : 0]);
  });
  const [feedback, setFeedback] = useState<Feedback | null>(() => initial?.feedback ?? null);
  const [revealed, setRevealed] = useState(() => initial?.revealed ?? false);
  const [attempts, setAttempts] = useState(() => initial?.attempts ?? 0);
  const [checking, setChecking] = useState(false);
  const [stats, setStats] = useState<LessonStats>(() => initial?.stats ?? { xp: 0, firstTry: 0, exercises: steps.filter(isExercise).length });
  const [praise, setPraise] = useState(PRAISE[0]);
  const [finished, setFinished] = useState(false);
  // banner "vous reprenez à l'étape …", shown until the student moves to the next step
  const [resumedAt, setResumedAt] = useState(() => (initial && (initial.pos > 0 || initial.attempts > 0) ? initial.pos : -1));

  // save where the student is, a moment after the last change (not at every keystroke)
  useEffect(() => {
    if (finished) return;
    const t = setTimeout(() => saveResume(lesson.id, { steps: steps.length, queue, pos, answer, feedback, revealed, attempts, stats }), 300);
    return () => clearTimeout(t);
  }, [lesson.id, steps.length, queue, pos, answer, feedback, revealed, attempts, stats, finished]);

  // "en cours, étape 4 sur 10" on the home and unit pages, once the student has really started
  const started = pos > 0 || attempts > 0;
  const { setInProgress } = progress;
  useEffect(() => {
    if (!finished && started) setInProgress(lesson.id, pos, queue.length);
  }, [finished, started, lesson.id, pos, queue.length, setInProgress]);

  const stepIndex = queue[pos];
  const step = steps[stepIndex];
  const repeat = pos >= steps.length;
  const exercise = isExercise(step);
  const kind = exercise ? kindOf(step) : null;
  const locked = feedback !== null;
  const waitingPython = usesPython(step) && py.status !== 'ready';

  const requeue = () => {
    if (!repeat && step.kind !== 'code' && step.kind !== 'sql') setQueue((q) => [...q, stepIndex]);
  };

  const goNext = () => {
    if (pos + 1 >= queue.length) {
      const ratio = stats.exercises ? stats.firstTry / stats.exercises : 1;
      clearResume(lesson.id);
      progress.completeLesson(lesson.id, ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1, stats.xp);
      setFinished(true);
      window.scrollTo({ top: 0 });
      return;
    }
    setResumedAt(-1);
    setPos(pos + 1);
    setAnswer(initFor(steps[queue[pos + 1]]));
    setFeedback(null);
    setRevealed(false);
    setAttempts(0);
    window.scrollTo({ top: 0 });
    top.current?.focus({ preventScroll: true });
  };

  const onCheck = async () => {
    if (!isExercise(step) || checking) return;
    const k = kindOf(step);
    setChecking(true);
    const fb = await k.check(step, answer, py.run);
    setChecking(false);
    setFeedback(fb);
    setAttempts((a) => a + 1);
    if (fb.correct) {
      setPraise(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
      const gain = repeat ? 2 : attempts === 0 ? 10 : 5;
      setStats((s) => ({ ...s, xp: s.xp + gain, firstTry: s.firstTry + (!repeat && attempts === 0 ? 1 : 0) }));
    } else if (k.oneShot) {
      requeue();
    }
  };

  const showSolution = () => {
    if (!isExercise(step)) return;
    setAnswer(kindOf(step).solution(step, answer));
    setRevealed(true);
    setFeedback({ correct: false });
    requeue();
  };

  // the main action of the bar, also used by the keyboard
  const canCheck = isExercise(step) && !!kind && !feedback && kind.ready(step, answer) && !waitingPython && !checking;
  const primary = (): (() => void) | null => {
    if (!exercise) return goNext;
    if (!feedback) return canCheck ? onCheck : null;
    if (feedback.correct || revealed || kind!.oneShot) return goNext;
    return () => setFeedback(null);
  };
  const primaryRef = useRef(primary);
  primaryRef.current = primary;

  useEffect(() => {
    if (finished) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.metaKey) return;
      if (e.key === 'Enter') {
        // Ctrl+Entrée checks even from the editor; Entrée alone only outside text fields and buttons
        const fromButton = (e.target as HTMLElement | null)?.tagName === 'BUTTON';
        if (!e.ctrlKey && (typing(e.target) || fromButton)) return;
        const action = primaryRef.current();
        if (action) {
          e.preventDefault();
          action();
        }
      } else if (!e.ctrlKey && step.kind === 'choice' && !locked && !typing(e.target)) {
        const i = 'abcd'.indexOf(e.key.toLowerCase());
        if (i >= 0 && i < step.options.length) setAnswer(i);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finished, step, locked]);

  if (finished) return <Finished lesson={lesson} unit={unit} stats={stats} />;

  const View_ = kind?.View;
  const wide = !!kind?.wide;
  const barState = feedback ? (feedback.correct ? 'is-ok' : revealed ? 'is-info' : 'is-bad') : '';

  return (
    <div className="lesson">
      <header className="lesson-top">
        <Link to={`/unite/${unit.id}`} className="lesson-close" aria-label="Quitter la leçon">
          ✕
        </Link>
        <ProgressBar value={pos / queue.length} label="Avancement dans la leçon" />
        <span className="lesson-count">
          {Math.min(pos + 1, queue.length)} / {queue.length}
        </span>
      </header>

      <main className="lesson-main">
        <div ref={top} tabIndex={-1} className={`lesson-page paper${wide ? ' is-wide' : ''}`} onClickCapture={releaseFocus}>
          {resumedAt === pos ? (
            <div className="alert alert-info resume">
              <p>
                Vous reprenez là où vous vous étiez arrêté : étape {pos + 1} sur {queue.length}.
              </p>
              <button type="button" className="link-button" onClick={onRestart}>
                Recommencer depuis le début
              </button>
            </div>
          ) : null}
          <p className="lesson-where">
            <span>{unit.title}</span>
            <span className={`tag${lesson.type === 'defi' ? ' tag-gold' : ''}`}>{lesson.type === 'defi' ? 'Défi' : 'Leçon'}</span>
            {repeat ? <span className="tag tag-red">À revoir</span> : null}
          </p>
          {step.kind === 'card' ? <CardView step={step} /> : null}
          {step.kind === 'demo' ? <DemoView step={step} /> : null}
          {View_ && exercise ? <View_ key={`${pos}`} step={step} answer={answer} setAnswer={setAnswer} feedback={feedback} locked={locked} /> : null}
        </div>
      </main>

      <footer className={`lesson-bar ${barState}`}>
        <div className={`lesson-bar-inner${wide ? ' is-wide' : ''}`}>
          {feedback ? (
            <div className="feedback" role="status" aria-live="polite">
              <p className="verdict">{feedback.correct ? praise : revealed ? 'Voici la solution.' : kind?.oneShot ? 'Pas tout à fait.' : 'Pas encore.'}</p>
              {!feedback.correct && !revealed && feedback.message ? <RichText>{feedback.message}</RichText> : null}
              {!feedback.correct && !revealed && kind?.oneShot ? <p>La bonne réponse est en vert. Cette question reviendra à la fin.</p> : null}
              {(feedback.correct || revealed || kind?.oneShot) && exercise ? <RichText>{step.explain}</RichText> : null}
            </div>
          ) : null}

          {/* a demo shows the status itself, inside the step-by-step viewer */}
          {exercise && waitingPython && !feedback ? <PythonStatus /> : null}

          <div className="lesson-actions">
            {!exercise ? (
              <Button label="Continuer" onClick={goNext} />
            ) : !feedback ? (
              <Button label="Vérifier" onClick={onCheck} busy={checking} disabled={!kind!.ready(step, answer) || waitingPython} />
            ) : feedback.correct || revealed || kind!.oneShot ? (
              <Button label="Continuer" variant={feedback.correct ? 'ok' : revealed ? 'primary' : 'bad'} onClick={goNext} />
            ) : (
              <>
                {attempts >= 2 ? <Button label="Voir la solution" variant="ghost" onClick={showSolution} /> : null}
                <Button label="Réessayer" variant="bad" onClick={() => setFeedback(null)} />
              </>
            )}
          </div>
          <p className="lesson-keys">{!feedback && (step.kind === 'code' || step.kind === 'sql' || step.kind === 'table') ? 'Ctrl + Entrée pour vérifier' : 'Entrée pour valider'}</p>
        </div>
      </footer>
    </div>
  );
}

function Finished({ lesson, unit, stats }: { lesson: Lesson; unit: Unit; stats: LessonStats }) {
  const navigate = useNavigate();
  const i = LESSONS.findIndex((l) => l.lesson.id === lesson.id);
  const next = LESSONS[i + 1];
  const ratio = stats.exercises ? stats.firstTry / stats.exercises : 1;
  const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
  return (
    <div className="lesson lesson-finished">
      <div className="finished paper">
        <h1>{lesson.type === 'defi' ? 'Défi réussi !' : 'Leçon terminée !'}</h1>
        <p className="finished-stars" aria-label={`${stars} étoiles sur 3`}>
          {'★'.repeat(stars)}
          <span className="path-stars-off">{'★'.repeat(3 - stars)}</span>
        </p>
        <dl className="finished-stats">
          <div>
            <dt>XP gagnés</dt>
            <dd>+{stats.xp}</dd>
          </div>
          <div>
            <dt>Justes du premier coup</dt>
            <dd>
              {stats.firstTry} sur {stats.exercises}
            </dd>
          </div>
        </dl>
        <div className="finished-actions">
          {next ? <Button label={`Leçon suivante : ${next.lesson.title}`} onClick={() => navigate(`/lecon/${next.lesson.id}`, { replace: true })} block /> : null}
          <Button label="Retour à l'unité" variant="ghost" onClick={() => navigate(`/unite/${unit.id}`)} block />
        </div>
      </div>
    </div>
  );
}
