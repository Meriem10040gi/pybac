// Pyodide runs in this Web Worker, so that a program that never stops (infinite loop) can be killed:
// the page terminates the worker after the time limit and starts a new one (see engine.tsx).
// Since version 314, Pyodide refuses classic workers: this must be a module worker.
import { PY_HELPER } from './helper-py';
import { PYODIDE_URL, type RunRequest } from './protocol';

type PyProxyFn = (...args: unknown[]) => string;
type Pyodide = {
  version: string;
  runPython: (code: string) => unknown;
  loadPackage: (name: string) => Promise<unknown>;
  globals: { get: (name: string) => PyProxyFn };
};

let py: Pyodide | null = null;
let sqliteLoaded = false;

const ready = (async () => {
  const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_URL}pyodide.mjs`);
  py = (await loadPyodide({ indexURL: PYODIDE_URL })) as Pyodide;
  py.runPython(PY_HELPER);
  postMessage({ type: 'ready', version: py.version });
})().catch((e) => postMessage({ type: 'loaderror', message: String(e) }));

self.onmessage = async (e: MessageEvent<RunRequest>) => {
  await ready;
  const job = e.data;
  let result;
  try {
    if (!py) throw new Error('Python n\'est pas chargé');
    if (job.sql) {
      // sqlite3 is in the standard library since Pyodide 314; older versions had it as a separate
      // package, downloaded the first time an SQL exercise runs
      if (!sqliteLoaded) {
        try {
          py.runPython('import sqlite3');
        } catch {
          await py.loadPackage('sqlite3');
        }
        sqliteLoaded = true;
      }
      const sql = JSON.parse(py.globals.get('__sql')(job.sql.schema, job.sql.query, !!job.sql.tables));
      result = { stdout: '', error: null, tests: [], trace: null, sql };
    } else {
      const run = py.globals.get('__run');
      result = JSON.parse(run(job.code, JSON.stringify(job.tests || []), !!job.trace, JSON.stringify(job.inputs || [])));
    }
  } catch (err) {
    result = { stdout: '', error: { type: 'InternalError', message: String(err), line: null }, tests: [], trace: null };
  }
  postMessage({ type: 'result', result });
};
