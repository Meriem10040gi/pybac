// Small line icons for the menus (20 × 20, the colour of the text).
type P = { size?: number };

function Svg({ size = 20, children }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      {children}
    </svg>
  );
}

/** The course: an open notebook. */
export const IconCourse = (p: P) => (
  <Svg {...p}>
    <path d="M3 5.5c2.5-1 5.5-1 9 1v13c-3.5-2-6.5-2-9-1z" />
    <path d="M21 5.5c-2.5-1-5.5-1-9 1v13c3.5-2 6.5-2 9-1z" />
  </Svg>
);

/** The sandbox: a terminal. */
export const IconTerminal = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="m7.5 9.5 3 2.5-3 2.5M13 15h4" />
  </Svg>
);

export const IconDashboard = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="8" rx="1.8" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.8" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.8" />
    <rect x="3.5" y="14.5" width="7" height="6" rx="1.8" />
  </Svg>
);

export const IconStudents = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
    <path d="M16 4.8a3.4 3.4 0 0 1 0 6.4M18.5 14.8c1.7.8 2.7 2.5 3 5.2" />
  </Svg>
);

export const IconLessons = (p: P) => (
  <Svg {...p}>
    <path d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v12.5H7.5A2.5 2.5 0 0 1 5 17z" />
    <path d="M5 17a2.5 2.5 0 0 1 2.5-2.5H19M9 8.5h6" />
  </Svg>
);

/** Back-office: a gauge. */
export const IconAdmin = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 17.5a8.5 8.5 0 1 1 15 0" />
    <path d="m12 13 3.5-4" />
    <circle cx="12" cy="13.5" r="1.3" />
  </Svg>
);

/** "Voir le site élève": an eye. */
export const IconEye = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconLogout = (p: P) => (
  <Svg {...p}>
    <path d="M14 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h7" />
    <path d="m16.5 8 4 4-4 4M20.5 12H10" />
  </Svg>
);

export const IconSettings = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Svg>
);

export const IconPlay = (p: P) => (
  <Svg {...p}>
    <path d="M8 5.5v13l10-6.5z" />
  </Svg>
);
