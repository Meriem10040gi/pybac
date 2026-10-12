// Course content model. Texts use a tiny inline markup: **gras** and `code`.
// Every answer that depends on Python or SQL is checked by scripts/verify-content.ts (npm run verify).

export type Rich = string;

/** A call evaluated after the student's code; `expected` is the repr() of the expected value. */
export type Test = { call: string; expected: string };

/** A binary tree to draw: [value, left, right]. A missing or null child is an empty subtree. */
export type TreeFig = [string | number, (TreeFig | null)?, (TreeFig | null)?];

/** A drawing shown with a step. */
export type Figure =
  | { kind: 'tree'; tree: TreeFig; caption?: string }
  | {
      kind: 'graph';
      /** x and y between 0 and 100 (percentage of the width and of the height of the drawing). */
      nodes: { id: string; x: number; y: number }[];
      /** [from, to] or [from, to, label] (e.g. a weight). */
      edges: ([string, string] | [string, string, string])[];
      directed?: boolean;
      caption?: string;
    }
  | { kind: 'table'; title?: string; columns: string[]; rows: (string | number)[][]; caption?: string };

type WithFigure = { figure?: Figure | Figure[] };

/** Explanation screen. `output`, when given, must be exactly what `code` prints. */
export type CardStep = WithFigure & {
  kind: 'card';
  title: string;
  body: Rich[];
  code?: string;
  output?: string;
  tip?: Rich;
};

/** Watch a program run line by line, with the variables (step-by-step viewer). */
export type DemoStep = {
  kind: 'demo';
  title: string;
  body: Rich;
  code: string;
};

/** Multiple choice. With `code`, the right option must be what the code prints (checked). */
export type ChoiceStep = WithFigure & {
  kind: 'choice';
  prompt: Rich;
  code?: string;
  options: string[];
  answer: number;
  /** Show the options as console output (monospace). */
  mono?: boolean;
  /** Do not check the options against the program output (question about something else). */
  noOutputCheck?: boolean;
  explain: Rich;
};

/** Put the lines in the right order: Python lines (Parsons problem) or the steps of an algorithm in French. */
export type OrderStep = WithFigure & {
  kind: 'order';
  prompt: Rich;
  mode: 'code' | 'text';
  /** Lines in the right order. For code, the indentation is part of the line. */
  lines: string[];
  /** Extra lines that do not belong to the solution. */
  distractors?: string[];
  /** For code: what the ordered program must print, or tests it must pass. */
  output?: string;
  tests?: Test[];
  explain: Rich;
};

/** Code with blanks written {{answer}}; the student taps tokens to fill them. */
export type FillStep = WithFigure & {
  kind: 'fill';
  prompt: Rich;
  code: string;
  /** Wrong tokens offered together with the right ones. */
  distractors: string[];
  output?: string;
  tests?: Test[];
  explain: Rich;
};

/** Tap the line that contains the error. `fixed` is the corrected program (checked). */
export type BugStep = WithFigure & {
  kind: 'bug';
  prompt: Rich;
  code: string;
  line: number;
  fixed: string;
  /** What the corrected program prints, when it prints something. */
  output?: string;
  explain: Rich;
};

/** Fill a table (one column per variable, one row per moment of the program). Also used without
 * code for tables of the course (routing table, scheduling…): then `code` is omitted. */
export type TableStep = WithFigure & {
  kind: 'table';
  prompt: Rich;
  code?: string;
  columns: string[];
  rows: string[];
  /** answer[row][col]; a cell starting with '=' is given to the student ('=0' shows 0). */
  answer: string[][];
  /** With code: the last row is not the final state of the program (no check against the final variables). */
  noFinalCheck?: boolean;
  explain: Rich;
};

/** Write code; it is run with the tests. */
export type CodeStep = WithFigure & {
  kind: 'code';
  prompt: Rich;
  /** The method, shown before coding: understand, cut into steps… */
  plan?: Rich[];
  starter: string;
  tests: Test[];
  /** Instead of tests (or as well): what the program must print. */
  output?: string;
  /** The same program run again with one line changed (e.g. another starting value), and what it must print. */
  variants?: { replace: [string, string]; output: string }[];
  solution: string;
  hints: Rich[];
  explain: Rich;
};

/** Write an SQL query; its result is compared with the result of `solution` on the same database. */
export type SqlStep = WithFigure & {
  kind: 'sql';
  prompt: Rich;
  /** SQLite statements that create and fill the tables. The tables are shown to the student. */
  schema: string;
  starter?: string;
  solution: string;
  /** The order of the rows matters (the question asks for ORDER BY). */
  ordered?: boolean;
  hints: Rich[];
  explain: Rich;
};

export type Step = CardStep | DemoStep | ChoiceStep | OrderStep | FillStep | BugStep | TableStep | CodeStep | SqlStep;

export type Lesson = {
  id: string;
  title: string;
  /** 'defi' = a problem to solve with the method (understand, cut, code, test). */
  type?: 'lecon' | 'defi';
  steps: Step[];
};

export type Unit = {
  id: string;
  title: string;
  subtitle: string;
  /** Chapter of the roadmap, shown on the unit card (e.g. "Chapitre 2"). */
  chapter?: string;
  lessons: Lesson[];
};

export type Module = {
  id: string;
  title: string;
  subtitle: string;
  units: Unit[];
  /** Units announced but not written yet. */
  soon?: { title: string; subtitle: string }[];
};
