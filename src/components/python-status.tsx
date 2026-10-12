// State of the Python engine, shown wherever Python is needed: a spinner while it loads, and on
// error the reason (from Pyodide) with a button to try again.
import { usePython } from '@/python/engine';

import { Button } from './ui';

export function PythonStatus() {
  const py = usePython();
  if (py.status === 'ready') return null;
  if (py.status === 'loading') {
    return (
      <div className="alert alert-info alert-row" role="status">
        <span className="spinner" />
        <p>Python se prépare… La première fois, il faut une connexion internet (environ 10 Mo).</p>
      </div>
    );
  }
  return (
    <div className="alert alert-bad" role="alert">
      <p>
        <strong>Python n'a pas pu démarrer.</strong> Vérifiez la connexion internet, puis réessayez.
      </p>
      {py.message ? <p className="alert-detail mono">Détail : {py.message}</p> : null}
      <div>
        <Button small label="Réessayer" onClick={py.restart} />
      </div>
    </div>
  );
}
