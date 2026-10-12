// Write an SQL query on a small database (SQLite inside Pyodide). The tables are shown first.
import { useEffect, useState } from 'react';

import { CodeEditor } from '@/components/code-editor';
import { DataTable, Figures } from '@/components/figure';
import { RichText } from '@/components/rich-text';
import { Button } from '@/components/ui';
import type { SqlStep } from '@/content/types';
import { usePython } from '@/python/engine';
import type { SqlResult } from '@/python/protocol';

import { checkSql, type SqlCheck } from '../check';
import { Hints } from './code';
import type { Kind, KindProps } from './types';

export const sql: Kind<SqlStep, string> = {
  init: (s) => s.starter ?? '',
  ready: (_s, a) => a.trim().length > 0,
  check: async (s, a, run) => {
    const c = await checkSql(run, s.schema, a, s.solution, s.ordered);
    return { correct: c.ok, message: c.reason, detail: c };
  },
  solution: (s) => s.solution,
  View: SqlExercise,
  wide: true,
};

function SqlExercise({ step, answer, setAnswer, locked, feedback }: KindProps<SqlStep, string>) {
  const py = usePython();
  const [tables, setTables] = useState<SqlResult['tables'] | null>(null);
  const [ran, setRan] = useState<SqlResult | null>(null);
  const [running, setRunning] = useState(false);
  const [hints, setHints] = useState(0);
  const check = feedback?.detail as SqlCheck | undefined;

  useEffect(() => {
    if (py.status !== 'ready') return;
    let alive = true;
    py.run({ code: '', sql: { schema: step.schema, query: '', tables: true }, timeoutMs: 30000 }).then((r) => alive && setTables(r.sql?.tables ?? {}));
    return () => {
      alive = false;
    };
  }, [py.status, py.run, step.schema]);

  const run = async () => {
    setRunning(true);
    const r = await py.run({ code: '', sql: { schema: step.schema, query: answer }, timeoutMs: 30000 });
    setRan(r.sql ?? null);
    setRunning(false);
  };

  const shown = check ? check.got : ran;

  return (
    <div className="workbench">
      <div className="brief">
        <RichText className="prompt">{step.prompt}</RichText>
        <Figures f={step.figure} />
        {tables ? (
          Object.entries(tables).map(([name, t]) => <DataTable key={name} title={name} columns={t.columns} rows={t.rows} />)
        ) : (
          <div className="alert alert-info alert-row" role="status">
            <span className="spinner" />
            <p>Chargement de la base de données…</p>
          </div>
        )}
        <Hints hints={step.hints} shown={hints} />
      </div>

      <div className="bench">
        <CodeEditor
          lang="sql"
          label="Éditeur de requête SQL"
          minLines={4}
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
        {shown ? (
          <section className="results">
            <h4 className="label">Résultat de votre requête</h4>
            {shown.error ? (
              <div className="alert alert-bad">
                <p>Erreur SQL : {shown.error}</p>
              </div>
            ) : (
              <DataTable columns={shown.columns} rows={shown.rows} />
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
