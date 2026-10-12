// Step-by-step viewer: runs a program with the trace and shows, step after step, the next line to
// run, the variables (values that just changed are highlighted) and what has been printed so far.
// On a computer, the ← and → keys move between steps once the viewer has the focus.
import { useEffect, useState } from 'react';

import { usePython } from '@/python/engine';
import type { RunResult } from '@/python/protocol';

import { CodeView } from './code-view';
import { ConsoleView } from './console-view';
import { PythonStatus } from './python-status';

export function StepViewer({ code }: { code: string }) {
  const py = usePython();
  const [res, setRes] = useState<RunResult | null>(null);
  const [k, setK] = useState(0);

  useEffect(() => {
    if (py.status !== 'ready') return;
    let alive = true;
    setRes(null);
    setK(0);
    py.run({ code, trace: true }).then((r) => alive && setRes(r));
    return () => {
      alive = false;
    };
  }, [code, py.status, py.run]);

  if (py.status !== 'ready') return <PythonStatus />;
  if (!res) {
    return (
      <div className="alert alert-info alert-row" role="status">
        <span className="spinner" />
        <p>Exécution du programme…</p>
      </div>
    );
  }

  const steps = res.trace ?? [];
  if (!steps.length) return <ConsoleView output={res.stdout} error={res.error} timeout={res.timeout} />;

  const step = steps[k];
  const before = k > 0 ? steps[k - 1] : null;
  const last = k === steps.length - 1;
  const names = Object.keys(step.vars);

  let sentence: string;
  if (step.ret !== undefined) sentence = `La fonction ${step.func} renvoie ${step.ret}.`;
  else if (step.line === null) sentence = 'Le programme est terminé. Voici les valeurs finales.';
  else if (k === 0) sentence = `Python commence par la ligne ${step.line}.`;
  else sentence = `Python va exécuter la ligne ${step.line}${step.func ? ` (dans la fonction ${step.func})` : ''}.`;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' && !last) {
      setK(k + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && k > 0) {
      setK(k - 1);
      e.preventDefault();
    }
  };

  return (
    <div className="stepper" onKeyDown={onKey}>
      <div className="stepper-code">
        <CodeView code={code} lineState={step.line ? { [step.line]: step.ret !== undefined ? 'good' : 'active' } : undefined} />
      </div>

      <div className="stepper-side">
        <div className="stepper-sentence" aria-live="polite">
          <p className="stepper-count">
            Étape {k + 1} sur {steps.length}
            {res.traceTruncated && last ? ' (programme trop long, arrêté)' : ''}
          </p>
          <p>{sentence}</p>
        </div>

        <div className="stepper-vars">
          <h4>{step.func ? `Variables de ${step.func}` : 'Variables'}</h4>
          {names.length === 0 ? <p className="muted">Aucune variable pour l'instant.</p> : null}
          {names.length ? (
            <table>
              <tbody>
                {names.map((n) => {
                  const changed = before && before.func === step.func && before.vars[n] !== step.vars[n];
                  return (
                    <tr key={n} className={changed ? 'is-changed' : undefined}>
                      <th className="mono">{n}</th>
                      <td className="mono">{step.vars[n]}</td>
                      <td className="stepper-was">{changed ? (before?.vars[n] === undefined ? 'nouvelle' : `avant : ${before.vars[n]}`) : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </div>

        <ConsoleView output={res.stdout.slice(0, step.out)} error={last ? res.error : null} timeout={last ? res.timeout : false} emptyText="(rien pour l'instant)" />

        <div className="stepper-controls">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setK(0)} disabled={k === 0} aria-label="Première étape">
            ⏮
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setK(k - 1)} disabled={k === 0} style={{ flex: 1 }}>
            ◀ Avant
          </button>
          <button type="button" className="btn btn-primary btn-small" onClick={() => setK(k + 1)} disabled={last} style={{ flex: 1 }}>
            Après ▶
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setK(steps.length - 1)} disabled={last} aria-label="Dernière étape">
            ⏭
          </button>
        </div>
        <p className="stepper-keys">Astuce : les flèches ← et → du clavier font avancer et reculer.</p>
      </div>
    </div>
  );
}
