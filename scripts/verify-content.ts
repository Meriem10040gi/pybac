// Checks the whole course with real Python (Pyodide in Node), using the same Python helper and the
// same checking code as the app. Run: npm run verify
//
// - card: the code runs and prints exactly `output`
// - demo: the code runs without error
// - choice with code: the right option is what the code prints, and no other option is
// - order / fill: the solution passes the output / tests
// - bug: the corrected program runs (and prints `output`), and differs from the buggy one on `line`
// - table: the last row matches the final values of the variables
// - code: the solution passes everything, the starter does not
// - sql: the solution runs and gives at least one row (or changes a table), the starter does not pass
// - figures: graph edges join existing nodes, coordinates between 0 and 100
import { loadPyodide } from 'pyodide';

import { COURSE, LESSONS } from '../src/content/course';
import type { Figure, Step } from '../src/content/types';
import { checkProgram, checkSql, fillCode, normCell, normOut, parseFill, type Runner } from '../src/lesson/check';
import { PY_HELPER } from '../src/python/helper-py';
import type { RunResult } from '../src/python/protocol';

async function main() {
  const py = await loadPyodide();
  py.runPython(PY_HELPER);
  // sqlite3 is in the standard library since Pyodide 314 (it was a separate package before)
  try {
    py.runPython('import sqlite3');
  } catch {
    await py.loadPackage('sqlite3');
  }
  const runPy = py.globals.get('__run');
  const sqlPy = py.globals.get('__sql');
  const run: Runner = async (req) => {
    if (req.sql) {
      const sql = JSON.parse(sqlPy(req.sql.schema, req.sql.query, !!req.sql.tables));
      return { stdout: '', error: null, tests: [], trace: null, sql } as RunResult;
    }
    return JSON.parse(runPy(req.code, JSON.stringify(req.tests ?? []), !!req.trace, JSON.stringify(req.inputs ?? []))) as RunResult;
  };

  const problems: string[] = [];
  let checked = 0;

  const ids = new Set<string>();
  for (const { lesson } of LESSONS) {
    if (ids.has(lesson.id)) problems.push(`id de leçon en double : ${lesson.id}`);
    ids.add(lesson.id);
  }
  const unitIds = COURSE.flatMap((m) => m.units.map((u) => u.id));
  if (new Set(unitIds).size !== unitIds.length) problems.push('id d\'unité en double');

  for (const { lesson } of LESSONS) {
    for (const [i, step] of lesson.steps.entries()) {
      const where = `${lesson.id} · étape ${i + 1} (${step.kind})`;
      const fail = (msg: string) => problems.push(`${where} : ${msg}`);
      try {
        if ('figure' in step && step.figure) checkFigures(step.figure, fail);
        await checkStep(step, run, fail);
      } catch (e) {
        fail(`exception ${String(e)}`);
      }
      checked++;
    }
  }

  console.log(`${checked} étapes vérifiées avec Python ${py.version}.`);
  if (problems.length) {
    console.error(`\n${problems.length} problème(s) :\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log('Tout est juste.');
}

async function checkStep(step: Step, run: Runner, fail: (msg: string) => void) {
  switch (step.kind) {
    case 'card': {
      if (!step.code) return;
      const r = await run({ code: step.code });
      if (r.error) return fail(`erreur ${r.error.type}: ${r.error.message}`);
      if (step.output !== undefined && normOut(r.stdout) !== normOut(step.output)) fail(`affiche ${JSON.stringify(r.stdout)} au lieu de ${JSON.stringify(step.output)}`);
      return;
    }
    case 'demo': {
      const r = await run({ code: step.code, trace: true });
      if (r.error) fail(`erreur ${r.error.type}: ${r.error.message}`);
      if (r.traceTruncated) fail('trace trop longue');
      return;
    }
    case 'choice': {
      if (step.answer < 0 || step.answer >= step.options.length) return fail('indice de la bonne réponse hors des options');
      if (!step.code || step.noOutputCheck) return;
      const r = await run({ code: step.code });
      if (r.error) return fail(`erreur ${r.error.type}: ${r.error.message}`);
      const out = normOut(r.stdout);
      if (out !== normOut(step.options[step.answer])) fail(`le programme affiche ${JSON.stringify(out)}, pas l'option ${step.answer}`);
      step.options.forEach((o, k) => k !== step.answer && normOut(o) === out && fail(`l'option ${k} est aussi juste`));
      return;
    }
    case 'order': {
      if (step.lines.length < 2) fail('moins de 2 lignes');
      if (step.mode !== 'code') return;
      if (step.output === undefined && !step.tests?.length) return fail('ni output ni tests pour vérifier le programme');
      const c = await checkProgram(run, step.lines.join('\n'), { output: step.output, tests: step.tests });
      if (!c.ok) fail(`la solution échoue : ${c.reason}`);
      return;
    }
    case 'fill': {
      const { answers } = parseFill(step.code);
      if (!answers.length) return fail('aucun trou {{…}}');
      if (step.distractors.some((d) => answers.includes(d))) fail('un intrus est aussi une bonne réponse');
      if (step.output === undefined && !step.tests?.length) return;
      const c = await checkProgram(run, fillCode(step.code, answers), { output: step.output, tests: step.tests });
      if (!c.ok) fail(`la solution échoue : ${c.reason}`);
      return;
    }
    case 'bug': {
      const lines = step.code.split('\n');
      if (step.line < 1 || step.line > lines.length) return fail('numéro de ligne hors du programme');
      if (lines[step.line - 1] === step.fixed.split('\n')[step.line - 1]) fail('la ligne fautive est identique dans la version corrigée');
      const r = await run({ code: step.fixed });
      if (r.error) return fail(`la version corrigée a une erreur ${r.error.type}: ${r.error.message}`);
      if (step.output !== undefined && normOut(r.stdout) !== normOut(step.output)) fail(`la version corrigée affiche ${JSON.stringify(r.stdout)}`);
      return;
    }
    case 'table': {
      if (step.answer.length !== step.rows.length || step.answer.some((row) => row.length !== step.columns.length)) return fail('taille du tableau incohérente');
      if (!step.code || step.noFinalCheck) return;
      const r = await run({ code: step.code, trace: true });
      if (r.error) return fail(`erreur ${r.error.type}: ${r.error.message}`);
      const final = r.trace?.[r.trace.length - 1]?.vars ?? {};
      const last = step.answer[step.answer.length - 1];
      step.columns.forEach((col, k) => {
        const cell = last[k].replace(/^=/, '');
        if (cell === '–') return;
        if (final[col] === undefined) return fail(`la variable ${col} n'existe pas à la fin`);
        if (normCell(final[col]) !== normCell(cell)) fail(`à la fin, ${col} vaut ${final[col]} et non ${cell}`);
      });
      return;
    }
    case 'code': {
      const spec = { output: step.output, tests: step.tests, variants: step.variants };
      if (!step.tests.length && step.output === undefined) fail('ni tests ni output');
      const good = await checkProgram(run, step.solution, spec);
      if (!good.ok) fail(`la solution échoue : ${good.reason}`);
      const starter = await checkProgram(run, step.starter, spec);
      if (starter.ok) fail('le code de départ réussit déjà les tests');
      for (const v of step.variants ?? []) if (!step.starter.includes(v.replace[0])) fail(`le code de départ ne contient pas « ${v.replace[0]} »`);
      return;
    }
    case 'sql': {
      const r = await run({ code: '', sql: { schema: step.schema, query: step.solution, tables: true } });
      const res = r.sql!;
      if (res.error) return fail(`erreur SQL : ${res.error}`);
      if (!Object.keys(res.tables ?? {}).length) fail('le schéma ne crée aucune table');
      if (!res.rows.length) fail('la solution ne donne aucune ligne');
      if (step.starter) {
        const c = await checkSql(run, step.schema, step.starter, step.solution, step.ordered);
        if (c.ok) fail('la requête de départ réussit déjà');
      }
      return;
    }
  }
}

function checkFigures(f: Figure | Figure[], fail: (msg: string) => void) {
  for (const x of Array.isArray(f) ? f : [f]) {
    if (x.kind === 'graph') {
      const ids = new Set(x.nodes.map((n) => n.id));
      if (ids.size !== x.nodes.length) fail('figure : sommet en double');
      x.nodes.forEach((n) => (n.x < 0 || n.x > 100 || n.y < 0 || n.y > 100) && fail(`figure : sommet ${n.id} hors du cadre`));
      x.edges.forEach(([a, b]) => (!ids.has(a) || !ids.has(b)) && fail(`figure : arête ${a}-${b} vers un sommet inconnu`));
    }
    if (x.kind === 'table') x.rows.forEach((r, i) => r.length !== x.columns.length && fail(`figure : ligne ${i + 1} du tableau de la mauvaise taille`));
  }
}

main();
