// Checks a program against what a step expects (output, tests, variants). Used by the lesson
// screens and by scripts/verify-content.ts, so the app and the content checks agree.
import type { Test } from '@/content/types';
import { explainError } from '@/python/errors-fr';
import type { PyError, RunRequest, RunResult, SqlResult } from '@/python/protocol';

export type Runner = (req: RunRequest) => Promise<RunResult>;

/** Compare outputs without caring about spaces at the end of lines or a final newline. */
export const normOut = (s: string) =>
  s
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');

export type TestOutcome = {
  call: string;
  expected: string;
  got?: string;
  error?: PyError;
  ok: boolean;
  /** The function printed the expected value instead of returning it. */
  printedInstead?: boolean;
};

export type VariantOutcome = {
  label: string;
  expected: string;
  got: string;
  ok: boolean;
  /** The line to replace was not found in the student's code. */
  missing?: boolean;
  error?: PyError | null;
  timeout?: boolean;
};

export type ProgramCheck = {
  ok: boolean;
  result: RunResult;
  expectedOutput?: string;
  outputOk?: boolean;
  tests: TestOutcome[];
  variants: VariantOutcome[];
  /** First problem, explained in French. */
  reason?: string;
};

export const TIMEOUT_MSG = 'Le programme ne s\'arrête pas : une boucle infinie ? Vérifiez que la condition du `while` finit par devenir fausse.';

export async function checkProgram(
  run: Runner,
  code: string,
  spec: { output?: string; tests?: Test[]; variants?: { replace: [string, string]; output: string }[] },
): Promise<ProgramCheck> {
  const tests = spec.tests ?? [];
  const result = await run({ code, tests: tests.map((t) => t.call) });
  const check: ProgramCheck = { ok: false, result, expectedOutput: spec.output, tests: [], variants: [] };

  if (result.timeout) return { ...check, reason: TIMEOUT_MSG };
  if (result.error) return { ...check, reason: explainError(result.error) };

  if (spec.output !== undefined) check.outputOk = normOut(result.stdout) === normOut(spec.output);

  check.tests = tests.map((t, i) => {
    const r = result.tests[i];
    if (!r) return { call: t.call, expected: t.expected, ok: false };
    if (r.error) return { call: t.call, expected: t.expected, error: r.error, ok: false };
    const ok = r.repr === t.expected;
    const printedInstead = !ok && r.repr === 'None' && normOut(r.stdout) === normOut(t.expected.replace(/^'(.*)'$/, '$1'));
    return { call: t.call, expected: t.expected, got: r.repr, ok, printedInstead };
  });

  for (const v of spec.variants ?? []) {
    const [from, to] = v.replace;
    const label = to;
    if (!code.includes(from)) {
      check.variants.push({ label, expected: v.output, got: '', ok: false, missing: true });
      continue;
    }
    const r = await run({ code: code.replace(from, to) });
    const got = r.stdout;
    check.variants.push({
      label,
      expected: v.output,
      got,
      ok: !r.timeout && !r.error && normOut(got) === normOut(v.output),
      error: r.error,
      timeout: r.timeout,
    });
  }

  const failedTest = check.tests.find((t) => !t.ok);
  const failedVariant = check.variants.find((v) => !v.ok);
  if (check.outputOk === false) check.reason = 'Le programme n\'affiche pas ce qui est attendu.';
  else if (failedTest?.printedInstead) check.reason = 'La fonction **affiche** le résultat avec `print` au lieu de le **renvoyer** avec `return`.';
  else if (failedTest?.error) check.reason = `Pour \`${failedTest.call}\` : ${explainError(failedTest.error)}`;
  else if (failedTest) check.reason = `\`${failedTest.call}\` devrait renvoyer \`${failedTest.expected}\`.`;
  else if (failedVariant?.missing) check.reason = `Gardez la ligne \`${spec.variants!.find((v) => v.replace[1] === failedVariant.label)!.replace[0]}\` telle quelle : elle sert aux tests.`;
  else if (failedVariant?.timeout) check.reason = `Avec \`${failedVariant.label}\` : ${TIMEOUT_MSG}`;
  else if (failedVariant?.error) check.reason = `Avec \`${failedVariant.label}\` : ${explainError(failedVariant.error)}`;
  else if (failedVariant) check.reason = `Avec \`${failedVariant.label}\`, le programme devrait afficher \`${normOut(failedVariant.expected)}\`. Votre programme marche-t-il pour toutes les valeurs ?`;
  check.ok = !check.reason;
  return check;
}

// ----- SQL -----

export type SqlCheck = {
  ok: boolean;
  got: SqlResult;
  expected: SqlResult;
  reason?: string;
};

const rowKey = (r: unknown[]) => JSON.stringify(r.map((v) => (typeof v === 'number' ? Number(v.toFixed(6)) : v)));

/** Runs the student's query and the solution on fresh copies of the database and compares the results. */
export async function checkSql(run: Runner, schema: string, query: string, solution: string, ordered = false): Promise<SqlCheck> {
  const sqlRun = async (q: string) => (await run({ code: '', sql: { schema, query: q }, timeoutMs: 30000 })).sql ?? { columns: [], rows: [], error: 'Python n\'a pas répondu' };
  const got = await sqlRun(query);
  const expected = await sqlRun(solution);
  const c: SqlCheck = { ok: false, got, expected };
  if (got.error) c.reason = `La requête a une erreur : ${got.error}`;
  else if (got.columns.length !== expected.columns.length) c.reason = `Le résultat doit avoir ${expected.columns.length} colonne(s), et non ${got.columns.length}. Vérifiez ce qui est écrit après \`SELECT\`.`;
  else if (got.rows.length !== expected.rows.length) c.reason = `Le résultat doit avoir ${expected.rows.length} ligne(s), et non ${got.rows.length}. Vérifiez la condition \`WHERE\`.`;
  else {
    const a = got.rows.map(rowKey);
    const b = expected.rows.map(rowKey);
    if (!ordered) {
      a.sort();
      b.sort();
    }
    if (a.some((r, i) => r !== b[i])) c.reason = ordered && [...a].sort().join() === [...b].sort().join() ? 'Les bonnes lignes, mais pas dans le bon ordre : pensez à `ORDER BY`.' : 'Le nombre de lignes est bon, mais pas leur contenu.';
  }
  c.ok = !c.reason;
  return c;
}

// ----- blanks in "fill" steps: {{answer}} -----

export type FillPart = { text: string } | { blank: number };

/** Splits the code into lines of parts, and returns the expected answer of each blank. */
export function parseFill(code: string): { lines: FillPart[][]; answers: string[] } {
  const answers: string[] = [];
  const lines = code.split('\n').map((line) => {
    const parts: FillPart[] = [];
    const re = /\{\{(.+?)\}\}/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      if (m.index > last) parts.push({ text: line.slice(last, m.index) });
      parts.push({ blank: answers.length });
      answers.push(m[1]);
      last = m.index + m[0].length;
    }
    if (last < line.length || parts.length === 0) parts.push({ text: line.slice(last) });
    return parts;
  });
  return { lines, answers };
}

/** The code with the blanks replaced by the chosen tokens. */
export function fillCode(code: string, chosen: (string | null)[]): string {
  let i = 0;
  return code.replace(/\{\{(.+?)\}\}/g, () => chosen[i++] ?? '');
}

/** Normalises a value typed in a table cell: spaces, quotes, capitals and the unicode minus do not
 * matter (a beginner may type isn for the string 'isn', or r2 for the router R2). */
export const normCell = (s: string) => s.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/['"]/g, '').toLowerCase();
