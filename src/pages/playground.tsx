// Free practice: write any program, run it, or follow it step by step. The code is kept in the browser.
// Computer: the editor on the left, the result on the right.
import { useState } from 'react';

import { CodeEditor } from '@/components/code-editor';
import { ConsoleView } from '@/components/console-view';
import { PythonStatus } from '@/components/python-status';
import { StepViewer } from '@/components/step-viewer';
import { Button } from '@/components/ui';
import { usePython } from '@/python/engine';
import type { RunResult } from '@/python/protocol';
import { getItem, setItem } from '@/state/storage';

const KEY = 'playground-code';
const DEFAULT = 'def carre(x):\n    return x * x\n\nfor i in range(1, 6):\n    print(i, carre(i))\n';

export function Playground() {
  const py = usePython();
  const [code, setCode] = useState(() => getItem(KEY) ?? DEFAULT);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [stepMode, setStepMode] = useState<string | null>(null);

  const change = (c: string) => {
    setCode(c);
    setResult(null);
    setStepMode(null);
    setItem(KEY, c);
  };

  const run = async () => {
    setStepMode(null);
    setRunning(true);
    setResult(await py.run({ code, timeoutMs: 6000 }));
    setRunning(false);
  };

  return (
    <div className="page playground">
      <header className="page-head">
        <h1>Bac à sable</h1>
        <p className="muted">Écrivez le programme que vous voulez, exécutez-le, ou suivez-le pas à pas. Il reste enregistré dans ce navigateur.</p>
      </header>
      <div className="playground-grid">
        <div className="playground-edit">
          <CodeEditor value={code} onChange={change} minLines={14} />
          <div className="row">
            <Button label="▶ Exécuter" onClick={run} busy={running} disabled={py.status !== 'ready'} style={{ flex: 1 }} />
            <Button label="Pas à pas" variant="ghost" onClick={() => setStepMode(code)} disabled={py.status !== 'ready'} style={{ flex: 1 }} />
          </div>
          <button type="button" className="link-button" onClick={() => change(DEFAULT)}>
            Remettre l'exemple
          </button>
        </div>
        <div className="playground-out">
          <PythonStatus />
          {stepMode ? <StepViewer code={stepMode} /> : result ? <ConsoleView output={result.stdout} error={result.error} timeout={result.timeout} /> : py.status === 'ready' ? <ConsoleView output="" emptyText="Le résultat du programme s'affichera ici." /> : null}
        </div>
      </div>
    </div>
  );
}
