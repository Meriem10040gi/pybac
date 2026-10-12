// Small shared UI pieces: buttons, progress bar, XP and streak counters.
import type { CSSProperties, ReactNode } from 'react';

type Variant = 'primary' | 'ok' | 'bad' | 'ghost' | 'gold';

export function Button({
  label,
  onClick,
  variant = 'primary',
  disabled,
  busy,
  small,
  block,
  style,
}: {
  label: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  disabled?: boolean;
  busy?: boolean;
  small?: boolean;
  block?: boolean;
  style?: CSSProperties;
}) {
  const cls = ['btn', `btn-${variant}`, small && 'btn-small', block && 'btn-block'].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled || busy} aria-busy={busy || undefined} style={style}>
      {busy ? <span className="spinner" aria-label="En cours" /> : label}
    </button>
  );
}

export function ProgressBar({ value, color, label }: { value: number; color?: string; label?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} aria-label={label}>
      <span style={{ width: `${v * 100}%`, background: color }} />
    </div>
  );
}

export function Stats({ xp, streak }: { xp: number; streak: number }) {
  return (
    <>
      <span className="stat stat-xp" title="Points d'expérience">
        ⚡ {xp} XP
      </span>
      <span className="stat stat-streak" title="Jours d'affilée avec au moins une leçon">
        🔥 {streak} jour{streak > 1 ? 's' : ''}
      </span>
    </>
  );
}
