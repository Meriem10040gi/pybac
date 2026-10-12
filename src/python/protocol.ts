// Messages exchanged between the app and the Python engine (Pyodide running in a Web Worker).

export const PYODIDE_VERSION = '314.0.7';
export const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export type RunRequest = {
  code: string;
  /** Python expressions evaluated after the program, e.g. "plus_grand(4, 9)". */
  tests?: string[];
  /** Record every executed line with the variables (step-by-step viewer). */
  trace?: boolean;
  /** Values returned one by one by input(). */
  inputs?: string[];
  timeoutMs?: number;
  /** Run an SQL query instead of Python: `schema` creates the tables, then `query` runs.
   * With `tables`, the content of every table is returned too. */
  sql?: { schema: string; query: string; tables?: boolean };
};

export type SqlTable = { columns: string[]; rows: (string | number | null)[][] };

export type SqlResult = SqlTable & {
  error: string | null;
  tables?: Record<string, SqlTable>;
};

export type PyError = {
  type: string;
  message: string;
  /** Line in the student's code (1-based), when known. */
  line: number | null;
};

export type TestResult = {
  expr: string;
  /** repr() of the value, when the call succeeded. */
  repr?: string;
  /** What the call printed. */
  stdout: string;
  error?: PyError;
};

export type TraceStep = {
  /** Line about to run (null for the final state). */
  line: number | null;
  /** Name of the function being run, null at top level. */
  func: string | null;
  vars: Record<string, string>;
  /** Number of characters of stdout printed so far. */
  out: number;
  /** Value returned, on a function return. */
  ret?: string;
};

export type RunResult = {
  stdout: string;
  error: PyError | null;
  tests: TestResult[];
  trace: TraceStep[] | null;
  /** The trace was cut after too many steps. */
  traceTruncated?: boolean;
  timeout?: boolean;
  sql?: SqlResult;
};

export type EngineStatus = 'loading' | 'ready' | 'error';

export type HostMessage =
  | { type: 'status'; status: EngineStatus; message?: string; version?: string }
  | ({ type: 'result'; id: number } & RunResult);
