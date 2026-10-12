// Pieces of the side menus (student site and back-office): who is logged in, and a progress ring.

/** First letter of the email, in a circle. */
export function Avatar({ email }: { email: string }) {
  return (
    <span className="avatar" aria-hidden>
      {email.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

export function Profile({ email, sub, subClass }: { email: string; sub: string; subClass?: string }) {
  return (
    <div className="side-profile">
      <Avatar email={email} />
      <div className="side-profile-text">
        <span className="side-profile-email" title={email}>
          {email}
        </span>
        <span className={`side-profile-sub${subClass ? ` ${subClass}` : ''}`}>{sub}</span>
      </div>
    </div>
  );
}

/** A ring filled to `value` (0 to 1), with the percentage in the middle. */
export function Ring({ value, size = 56 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(1, value));
  const r = (size - 7) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.18} strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-label">{Math.round(v * 100)}%</span>
    </span>
  );
}
