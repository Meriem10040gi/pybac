// The Python engine for the whole app: one worker, a queue of jobs (one runs at a time) and a time
// limit per job. When a job takes too long, the worker is killed and a new one is started.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { EngineStatus, RunRequest, RunResult } from './protocol';

type Engine = {
  status: EngineStatus;
  message?: string;
  run: (req: RunRequest) => Promise<RunResult>;
  /** Start the engine again (after a download error, for example). */
  restart: () => void;
};

type Job = { req: RunRequest; resolve: (r: RunResult) => void };

const EngineContext = createContext<Engine | null>(null);

export function usePython(): Engine {
  const e = useContext(EngineContext);
  if (!e) throw new Error('usePython() must be used inside <PythonProvider>');
  return e;
}

const restarted: RunResult = { stdout: '', error: { type: 'EngineRestart', message: 'Python a redémarré', line: null }, tests: [], trace: null };

export function PythonProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<EngineStatus>('loading');
  const [message, setMessage] = useState<string>();
  const worker = useRef<Worker | null>(null);
  const ready = useRef(false);
  const queue = useRef<Job[]>([]);
  const current = useRef<Job | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const pump = useCallback(() => {
    if (!ready.current || current.current || !queue.current.length) return;
    const job = queue.current.shift()!;
    current.current = job;
    timer.current = setTimeout(() => {
      current.current = null;
      job.resolve({ stdout: '', error: null, tests: [], trace: null, timeout: true });
      start();
    }, job.req.timeoutMs ?? 4000);
    worker.current!.postMessage(job.req);
  }, []);

  const start = useCallback(() => {
    worker.current?.terminate();
    ready.current = false;
    setStatus('loading');
    setMessage(undefined);
    const w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'ready') {
        ready.current = true;
        setStatus('ready');
        pump();
      } else if (m.type === 'loaderror') {
        setStatus('error');
        setMessage(m.message);
      } else if (m.type === 'result' && current.current) {
        clearTimeout(timer.current);
        const job = current.current;
        current.current = null;
        job.resolve(m.result);
        pump();
      }
    };
    // e.g. pyodide.mjs could not be downloaded (no internet on the first visit)
    w.onerror = (e) => {
      setStatus('error');
      setMessage(e.message || 'le moteur Python n\'a pas pu être téléchargé');
    };
  }, [pump]);

  useEffect(() => {
    start();
    return () => worker.current?.terminate();
  }, [start]);

  const run = useCallback(
    (req: RunRequest) =>
      new Promise<RunResult>((resolve) => {
        queue.current.push({ req, resolve });
        pump();
      }),
    [pump],
  );

  const restart = useCallback(() => {
    clearTimeout(timer.current);
    current.current?.resolve(restarted);
    current.current = null;
    for (const job of queue.current) job.resolve(restarted);
    queue.current = [];
    start();
  }, [start]);

  const engine = useMemo<Engine>(() => ({ status, message, run, restart }), [status, message, run, restart]);
  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>;
}
