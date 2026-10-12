// Python code loaded once into Pyodide. __run() executes the student's program in a fresh namespace,
// then the test expressions, and returns everything as JSON. Also used by scripts/verify-content.ts,
// so the app and the content checks run exactly the same code.
export const PY_HELPER = String.raw`
import sys, io, json

_FILE = '<eleve>'
_MAX_OUT = 20000
_MAX_STEPS = 400


class _Out(io.StringIO):
    def write(self, s):
        if self.tell() > _MAX_OUT:
            raise RuntimeError("le programme affiche trop de texte")
        return super().write(s)


def _obj(v, depth):
    # objects of the student's classes, shown with their attributes: Maillon(valeur=3, suivant=None)
    if depth > 2:
        return type(v).__name__ + '(…)'
    inner = ', '.join(k + '=' + _rep(x, depth + 1) for k, x in vars(v).items())
    return type(v).__name__ + '(' + inner + ')'


def _rep(v, depth=0):
    t = type(v)
    if t.__module__ == '__main__' and hasattr(v, '__dict__') and t.__repr__ is object.__repr__:
        return _obj(v, depth)
    if isinstance(v, list) and depth < 3:
        return '[' + ', '.join(_rep(x, depth + 1) for x in v) + ']'
    return repr(v)


def _short(v):
    try:
        r = _rep(v)
    except Exception:
        r = '?'
    return r if len(r) <= 80 else r[:77] + '...'


def _err(e):
    line = None
    if isinstance(e, SyntaxError) and e.filename == _FILE:
        line = e.lineno
    tb = e.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == _FILE:
            line = tb.tb_lineno
        tb = tb.tb_next
    msg = e.msg if isinstance(e, SyntaxError) else str(e)
    return {'type': type(e).__name__, 'message': msg, 'line': line}


def _snapshot(frame):
    d = {}
    for k, v in frame.f_locals.items():
        if k.startswith('__') or callable(v) or type(v).__name__ == 'module':
            continue
        d[k] = _short(v)
    return d


def __run(code, tests_json, trace, inputs_json):
    tests = json.loads(tests_json)
    inputs = json.loads(inputs_json)
    res = {'stdout': '', 'error': None, 'tests': [], 'trace': None}
    out = _Out()
    steps = []
    state = {'cut': False}

    def _input(prompt=''):
        out.write(str(prompt))
        if not inputs:
            raise RuntimeError("input() : il n'y a pas de valeur à lire ici")
        v = str(inputs.pop(0))
        out.write(v + '\n')
        return v

    def _tracer(frame, event, arg):
        if frame.f_code.co_filename != _FILE:
            return None
        if len(steps) >= _MAX_STEPS:
            state['cut'] = True
            return None
        func = None if frame.f_code.co_name == '<module>' else frame.f_code.co_name
        if event == 'line':
            steps.append({'line': frame.f_lineno, 'func': func, 'vars': _snapshot(frame), 'out': out.tell()})
        elif event == 'return' and func is not None:
            steps.append({'line': frame.f_lineno, 'func': func, 'vars': _snapshot(frame), 'out': out.tell(), 'ret': _short(arg)})
        return _tracer

    g = {'__name__': '__main__', 'input': _input}
    old = sys.stdout
    sys.stdout = out
    try:
        prog = compile(code, _FILE, 'exec')
        if trace:
            sys.settrace(_tracer)
        try:
            exec(prog, g)
        finally:
            sys.settrace(None)
    except BaseException as e:
        res['error'] = _err(e)
    finally:
        sys.stdout = old
    res['stdout'] = out.getvalue()
    if trace:
        if res['error'] is None:
            snap = {k: _short(v) for k, v in g.items() if not k.startswith('__') and k != 'input' and not callable(v) and type(v).__name__ != 'module'}
            steps.append({'line': None, 'func': None, 'vars': snap, 'out': out.tell()})
        res['trace'] = steps
        res['traceTruncated'] = state['cut']

    if res['error'] is None:
        for t in tests:
            buf = _Out()
            sys.stdout = buf
            item = {'expr': t, 'stdout': ''}
            try:
                item['repr'] = repr(eval(t, g))
            except BaseException as e:
                item['error'] = _err(e)
            finally:
                sys.stdout = old
            item['stdout'] = buf.getvalue()
            res['tests'].append(item)
    return json.dumps(res)


def __sql(schema, query, with_tables):
    import sqlite3
    db = sqlite3.connect(':memory:')
    res = {'columns': [], 'rows': [], 'error': None}
    try:
        db.executescript(schema)
    except Exception as e:
        res['error'] = 'schéma : ' + str(e)
        return json.dumps(res)
    if with_tables:
        res['tables'] = {}
        names = [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY rowid")]
        for name in names:
            cur = db.execute('SELECT * FROM "' + name + '"')
            res['tables'][name] = {'columns': [d[0] for d in cur.description], 'rows': [list(r) for r in cur.fetchall()]}
    q = query.strip()
    if q:
        try:
            cur = db.execute(q)
            if cur.description:
                res['columns'] = [d[0] for d in cur.description]
                res['rows'] = [list(r) for r in cur.fetchall()]
            else:
                # INSERT / UPDATE / DELETE: show the table that was changed
                db.commit()
                words = q.replace('(', ' ').split()
                up = [w.upper() for w in words]
                target = None
                for kw in ('INTO', 'UPDATE', 'FROM'):
                    if kw in up and up.index(kw) + 1 < len(words):
                        target = words[up.index(kw) + 1]
                        break
                if target:
                    cur = db.execute('SELECT * FROM ' + target)
                    res['columns'] = [d[0] for d in cur.description]
                    res['rows'] = [list(r) for r in cur.fetchall()]
        except Exception as e:
            res['error'] = str(e)
    db.close()
    return json.dumps(res)
`;
