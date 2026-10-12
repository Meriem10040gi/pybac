// Python and SQL syntax colouring, same colours as the printed worksheets.
const KW = new Set(['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'and', 'or', 'not', 'True', 'False', 'None', 'import', 'from', 'as', 'pass', 'break', 'continue', 'class', 'lambda', 'is']);
const BUILTIN = new Set(['print', 'range', 'len', 'int', 'str', 'float', 'input', 'list', 'sum', 'max', 'min', 'abs', 'round', 'bool', 'dict', 'type']);

const SQL_KW = new Set(['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'ORDER', 'BY', 'ASC', 'DESC', 'JOIN', 'INNER', 'ON', 'AS', 'DISTINCT', 'GROUP', 'HAVING', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'LIKE', 'IN', 'IS', 'NULL', 'LIMIT', 'BETWEEN']);
const SQL_FN = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'INTEGER', 'TEXT', 'REAL']);

export type Lang = 'python' | 'sql';

type Tok = { t: string; c?: 'kw' | 'str' | 'num' | 'builtin' | 'comment' };

export function tokenize(line: string, lang: Lang = 'python'): Tok[] {
  const re =
    lang === 'sql'
      ? /(--.*$)|('(?:[^']|'')*'?)|([A-Za-z_À-ÿ][A-Za-z_0-9À-ÿ]*)|(\d+(?:\.\d+)?)|([^'A-Za-z_À-ÿ\d-]+|-)/g
      : /(#.*$)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|([A-Za-z_À-ÿ][A-Za-z_0-9À-ÿ]*)|(\d+(?:\.\d+)?)|([^#"'A-Za-z_À-ÿ\d]+)/g;
  const out: Tok[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1]) out.push({ t: m[1], c: 'comment' });
    else if (m[2]) out.push({ t: m[2], c: 'str' });
    else if (m[3]) {
      const w = m[3];
      if (lang === 'sql') out.push(SQL_KW.has(w.toUpperCase()) ? { t: w, c: 'kw' } : SQL_FN.has(w.toUpperCase()) ? { t: w, c: 'builtin' } : { t: w });
      else out.push(KW.has(w) ? { t: w, c: 'kw' } : BUILTIN.has(w) ? { t: w, c: 'builtin' } : { t: w });
    } else if (m[4]) out.push({ t: m[4], c: 'num' });
    else out.push({ t: m[5] });
  }
  return out;
}

/** One line of coloured code. */
export function HighlightedLine({ line, lang = 'python' }: { line: string; lang?: Lang }) {
  return (
    <>
      {tokenize(line, lang).map((tok, i) =>
        tok.c ? (
          <span key={i} className={`tok-${tok.c}`}>
            {tok.t}
          </span>
        ) : (
          tok.t
        ),
      )}
    </>
  );
}
