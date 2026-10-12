// Code editor (CodeMirror): line numbers, colours, automatic indentation (+4 spaces after ":"),
// Tab / Maj+Tab to indent, Ctrl+Z to undo. On a touch screen, two bars of Python (or SQL) symbols
// and words that are hard to reach on a phone keyboard.
import { defaultKeymap, history, historyKeymap, indentLess, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { sql, SQLite } from '@codemirror/lang-sql';
import { bracketMatching, HighlightStyle, indentOnInput, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import { drawSelection, EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { useEffect, useRef } from 'react';

type Key = { label: string; insert: string; back?: number };

const KEYS: Key[] = [
  { label: '⇥', insert: '    ' },
  { label: ':', insert: ':' },
  { label: '( )', insert: '()', back: 1 },
  { label: '[ ]', insert: '[]', back: 1 },
  { label: '=', insert: ' = ' },
  { label: '==', insert: ' == ' },
  { label: '" "', insert: '""', back: 1 },
  { label: '+', insert: ' + ' },
  { label: '-', insert: ' - ' },
  { label: '*', insert: ' * ' },
  { label: '/', insert: ' / ' },
  { label: '//', insert: ' // ' },
  { label: '%', insert: ' % ' },
  { label: '<', insert: ' < ' },
  { label: '>', insert: ' > ' },
  { label: '<=', insert: ' <= ' },
  { label: '>=', insert: ' >= ' },
  { label: '!=', insert: ' != ' },
  { label: ',', insert: ', ' },
  { label: '_', insert: '_' },
];

const WORDS: Key[] = [
  { label: 'def', insert: 'def ' },
  { label: 'return', insert: 'return ' },
  { label: 'if', insert: 'if ' },
  { label: 'elif', insert: 'elif ' },
  { label: 'else', insert: 'else:' },
  { label: 'for', insert: 'for ' },
  { label: 'in', insert: ' in ' },
  { label: 'range', insert: 'range()', back: 1 },
  { label: 'while', insert: 'while ' },
  { label: 'print', insert: 'print()', back: 1 },
  { label: 'len', insert: 'len()', back: 1 },
  { label: 'append', insert: '.append()', back: 1 },
  { label: 'True', insert: 'True' },
  { label: 'False', insert: 'False' },
];

const SQL_KEYS: Key[] = [
  { label: '*', insert: '*' },
  { label: ',', insert: ', ' },
  { label: '=', insert: ' = ' },
  { label: '<', insert: ' < ' },
  { label: '>', insert: ' > ' },
  { label: '<=', insert: ' <= ' },
  { label: '>=', insert: ' >= ' },
  { label: '<>', insert: ' <> ' },
  { label: "' '", insert: "''", back: 1 },
  { label: '( )', insert: '()', back: 1 },
  { label: '.', insert: '.' },
  { label: '_', insert: '_' },
  { label: ';', insert: ';' },
];

const SQL_WORDS: Key[] = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'ON', 'ORDER BY', 'DESC', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'AS', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM'].map((w) =>
  ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'].includes(w) ? { label: w, insert: `${w}()`, back: 1 } : { label: w, insert: `${w} ` },
);

// same colours as the read-only code blocks (highlight.tsx)
const colours = HighlightStyle.define([
  { tag: [t.keyword, t.bool, t.null, t.controlKeyword, t.definitionKeyword, t.operatorKeyword, t.moduleKeyword], color: '#a31621', fontWeight: '700' },
  { tag: [t.string, t.special(t.string)], color: '#1f7a4d' },
  { tag: [t.number], color: '#b5520a' },
  { tag: [t.standard(t.variableName), t.function(t.variableName), t.typeName], color: '#1f4b73' },
  { tag: [t.comment, t.lineComment], color: '#7c8b99', fontStyle: 'italic' },
]);

const theme = EditorView.theme({
  '&': { backgroundColor: 'var(--code-bg)', fontSize: '15px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-content': { fontFamily: 'var(--font)', fontVariationSettings: "'MONO' 1, 'CASL' 0", padding: '10px 0', caretColor: 'var(--encre)' },
  '.cm-line': { padding: '0 12px 0 6px', lineHeight: '1.6' },
  '.cm-gutters': { backgroundColor: 'var(--code-bg)', color: 'var(--encre-line)', border: 'none', fontFamily: 'var(--font)', fontVariationSettings: "'MONO' 1" },
  '.cm-activeLine': { backgroundColor: '#e8f0f880' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--encre)' },
  '.cm-cursor': { borderLeftColor: 'var(--encre)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: '#ffd43b66 !important' },
  '.cm-matchingBracket': { backgroundColor: 'var(--gold-soft)', outline: '1px solid var(--gold)' },
});

export function CodeEditor({
  value,
  onChange,
  minLines = 7,
  editable = true,
  lang = 'python',
  label = 'Éditeur de code',
}: {
  value: string;
  onChange: (code: string) => void;
  minLines?: number;
  editable?: boolean;
  lang?: 'python' | 'sql';
  label?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const editableConf = useRef(new Compartment());

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          drawSelection(),
          history(),
          indentOnInput(),
          bracketMatching(),
          indentUnit.of('    '),
          EditorState.tabSize.of(4),
          lang === 'sql' ? sql({ dialect: SQLite, upperCaseKeywords: true }) : python(),
          syntaxHighlighting(colours),
          // Ctrl+Entrée is kept for "Vérifier" (lesson page)
          keymap.of([...defaultKeymap.filter((b) => b.key !== 'Mod-Enter'), ...historyKeymap, indentWithTab]),
          theme,
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': label, autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' }),
          editableConf.current.of([EditorView.editable.of(editable), EditorState.readOnly.of(!editable)]),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current(u.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // the editor is created once; value and editable are synced below
  }, [lang]);

  // the value changed from outside (solution shown, example restored)
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: editableConf.current.reconfigure([EditorView.editable.of(editable), EditorState.readOnly.of(!editable)]) });
  }, [editable]);

  const insert = (k: Key) => {
    const v = view.current;
    if (!v) return;
    const tr = v.state.replaceSelection(k.insert);
    v.dispatch(tr);
    if (k.back) {
      const pos = v.state.selection.main.head - k.back;
      v.dispatch({ selection: { anchor: pos } });
    }
    v.focus();
  };

  const unindent = () => {
    const v = view.current;
    if (!v) return;
    indentLess(v);
    v.focus();
  };

  // keep the focus (and the phone keyboard) in the editor when a key of the bar is pressed
  const keep = (e: React.PointerEvent) => e.preventDefault();

  return (
    <div className={`editor${editable ? '' : ' is-locked'}`}>
      {editable ? (
        <div className="editor-bars" aria-label="Symboles à insérer">
          <div className="editor-bar">
            {lang === 'python' ? (
              <button type="button" className="editor-key" onPointerDown={keep} onClick={unindent} aria-label="Enlever un décalage">
                ⇤
              </button>
            ) : null}
            {(lang === 'sql' ? SQL_KEYS : KEYS).map((k) => (
              <button key={k.label} type="button" className="editor-key" onPointerDown={keep} onClick={() => insert(k)} aria-label={`Insérer ${k.label}`}>
                {k.label}
              </button>
            ))}
          </div>
          <div className="editor-bar">
            {(lang === 'sql' ? SQL_WORDS : WORDS).map((k) => (
              <button key={k.label} type="button" className="editor-key is-word" onPointerDown={keep} onClick={() => insert(k)} aria-label={`Insérer ${k.label}`}>
                {k.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div ref={host} className="editor-host" style={{ minHeight: `${minLines * 1.6 * 15 + 20}px` }} />
    </div>
  );
}
