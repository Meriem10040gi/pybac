// Read-only code block with line numbers. Lines can be highlighted (step-by-step viewer) or
// chosen (exercise "find the line with the error").
import { HighlightedLine, type Lang } from './highlight';

export type LineState = 'active' | 'selected' | 'good' | 'bad';

export function CodeView({
  code,
  lineState,
  onLinePress,
  lang = 'python',
  large,
}: {
  code: string;
  /** Style of some lines, keyed by line number (1-based). */
  lineState?: Record<number, LineState>;
  onLinePress?: (line: number) => void;
  lang?: Lang;
  large?: boolean;
}) {
  const lines = code.split('\n');
  return (
    <div className={`codeview${large ? ' codeview-large' : ''}`}>
      <div className="codeview-lines">
        {lines.map((line, i) => {
          const n = i + 1;
          const state = lineState?.[n];
          const content = (
            <>
              <span className="codeview-num" aria-hidden>
                {n}
              </span>
              <code className="codeview-code">
                <HighlightedLine line={line || ' '} lang={lang} />
              </code>
              {state === 'active' ? <span className="codeview-arrow" aria-hidden>◀</span> : null}
            </>
          );
          const cls = `codeview-line${state ? ` is-${state}` : ''}`;
          return onLinePress ? (
            <button key={i} type="button" aria-pressed={state === 'selected'} className={`${cls} is-pressable`} onClick={() => onLinePress(n)} aria-label={`Ligne ${n} : ${line.trim()}`}>
              {content}
            </button>
          ) : (
            <div key={i} className={cls}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
