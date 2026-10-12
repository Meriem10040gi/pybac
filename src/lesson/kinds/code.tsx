// Write code. "Exécuter" just runs it; "Vérifier" (in the lesson bar) runs the tests and the variants.
// On a wide screen: the instructions on the left, the editor and the results on the right.
import { useState } from 'react';

import { CodeEditor } from '@/components/code-editor';
import { ConsoleView } from '@/components/console-view';
import { Figures } from '@/components/figure';
import { RichText } from '@/components/rich-text';
import { Button } from '@/components/ui';
import type { CodeStep } from '@/content/types';
import { usePython } from '@/python/engine';
import type { RunResult } from '@/python/protocol';

import { checkProgram, normOut, type ProgramCheck } from '../check';
import type { Kind, KindProps } from './types';

export const code: Kind<CodeStep, string> = {
  init: (s) => s.starter,
  ready: (_s, a) => a.trim().length > 0,
  check: async (s, a, run) => {
    const c = await checkProgram(run, a, { output: s.output, tests: s.tests, variants: s.variants });
    return { correct: c.ok, message: c.reason, detail: c };
  },
  solution: (s) => s.solution,
  View: CodeExercise,
  wide: true,
};

export function Hints({ hints, shown }: { hints: string[]; shown: number }) {
  return (
    <>
      {hints.slice(0, shown).map((h, i) => (
        <div key={i} className="alert alert-gold">
          <RichText>{`**Indice ${i + 1}.** ${h}`}</RichText>
        </div>
      ))}
    </>
  );
}

function CodeExercise({ step, answer, setAnswer, locked, feedback }: KindProps<CodeStep, string>) {
  const py = usePython();
  const [ran, setRan] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [hints, setHints] = useState(0);
  const check = feedback?.detail as ProgramCheck | undefined;

  const run = async () => {
    setRunning(true);
    setRan(await py.run({ code: answer }));
    setRunning(false);
  };

  return (
    <div className="workbench">
      <div className="brief">
        <RichText className="prompt">{step.prompt}</RichText>
        <Figures f={step.figure} />
        {step.plan ? (
          <section className="panel panel-plan">
            <h4>La méthode</h4>
            <ol>
              {step.plan.map((p, i) => (
                <li key={i}>
                  <RichText as="span">{p}</RichText>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {step.tests.length ? (
          <section className="panel panel-code">
            <h4>Exemples</h4>
            <ul className="examples mono">
              {step.tests.map((t) => (
                <li key={t.call}>
                  {t.call} <span className="muted">renvoie</span> {t.expected}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {step.output !== undefined && !step.tests.length ? (
          <section className="panel panel-code">
            <h4>Affichage attendu</h4>
            <pre className="examples mono">{normOut(step.output)}</pre>
          </section>
        ) : null}
        <Hints hints={step.hints} shown={hints} />
      </div>

      <div className="bench">
        <CodeEditor
          value={answer}
          onChange={(v) => {
            setAnswer(v);
            setRan(null);
          }}
          editable={!locked}
        />
        {!locked ? (
          <div className="row">
            <Button small variant="ghost" label="▶ Exécuter" onClick={run} busy={running} disabled={py.status !== 'ready'} style={{ flex: 1 }} />
            <Button
              small
              variant="ghost"
              label={hints >= step.hints.length ? 'Plus d\'indice' : `💡 Indice ${hints + 1} sur ${step.hints.length}`}
              onClick={() => setHints(hints + 1)}
              disabled={hints >= step.hints.length}
              style={{ flex: 1 }}
            />
          </div>
        ) : null}
        {ran && !check ? <ConsoleView output={ran.stdout} error={ran.error} timeout={ran.timeout} /> : null}
        {check ? <Results check={check} /> : null}
      </div>
    </div>
  );
}

function Results({ check }: { check: ProgramCheck }) {
  const r = check.result;
  return (
    <div className="results">
      <ConsoleView output={r.stdout} error={r.error} timeout={r.timeout} />
      {check.expectedOutput !== undefined && check.outputOk === false ? (
        <section className="panel panel-ok">
          <h4>Affichage attendu</h4>
          <pre className="examples mono">{normOut(check.expectedOutput)}</pre>
        </section>
      ) : null}
      {check.tests.length ? (
        <section className="panel">
          <h4>Tests</h4>
          <ul className="checks">
            {check.tests.map((t) => (
              <li key={t.call} className={t.ok ? 'is-ok' : 'is-ko'}>
                <span className="checks-mark" aria-label={t.ok ? 'réussi' : 'raté'}>
                  {t.ok ? '✓' : '✗'}
                </span>
                <div>
                  <code>{t.call}</code>
                  <p className="muted small">
                    attendu {t.expected}
                    {t.ok ? '' : t.error ? `, erreur ${t.error.type}` : `, obtenu ${t.got ?? '(rien)'}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {check.variants.length ? (
        <section className="panel">
          <h4>Avec d'autres valeurs</h4>
          <ul className="checks">
            {check.variants.map((v) => (
              <li key={v.label} className={v.ok ? 'is-ok' : 'is-ko'}>
                <span className="checks-mark" aria-label={v.ok ? 'réussi' : 'raté'}>
                  {v.ok ? '✓' : '✗'}
                </span>
                <div>
                  <code>avec {v.label}</code>
                  <p className="muted small">
                    attendu {normOut(v.expected)}
                    {v.ok || v.missing ? '' : v.timeout ? ', ne s\'arrête pas' : v.error ? `, erreur ${v.error.type}` : `, obtenu ${normOut(v.got) || '(rien)'}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
