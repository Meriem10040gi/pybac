// Frame of the course pages. Computer: a menu on the left (logo, XP, pages, settings).
// Phone: a bar at the top (logo, XP) and the pages at the bottom of the screen.
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';

import { useAuth } from '@/state/auth';
import { useProgress } from '@/state/progress';

import { Account, Settings } from './settings';
import { Stats } from './ui';

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="PyBac, accueil">
      <img src="/logo-96.png" alt="" width={40} height={40} />
      <span>
        <span className="brand-name">PyBac</span>
        <span className="brand-sub">Python et NSI, jusqu'au bac</span>
      </span>
    </Link>
  );
}

const PAGES = [
  { to: '/', label: 'Le parcours', icon: '☰', end: true },
  { to: '/bac-a-sable', label: 'Bac à sable', icon: '>_', end: false },
];
const ADMIN_PAGE = { to: '/suivi', label: 'Suivi des élèves', icon: '▤', end: false };

export function Shell() {
  const progress = useProgress();
  const auth = useAuth();
  const pages = auth.user?.isAdmin ? [...PAGES, ADMIN_PAGE] : PAGES;
  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-stats">
          <Stats xp={progress.xp} streak={progress.streakNow} />
        </div>
        <nav className="sidebar-nav" aria-label="Pages">
          {pages.map((p) => (
            <NavLink key={p.to} to={p.to} end={p.end} className="sidebar-link">
              <span className="nav-icon mono" aria-hidden>
                {p.icon}
              </span>
              {p.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Settings />
          <Account />
        </div>
      </aside>

      <header className="topbar">
        <Brand />
        <div className="topbar-stats">
          <Stats xp={progress.xp} streak={progress.streakNow} />
        </div>
      </header>

      <main className="main" id="contenu">
        <Outlet />
      </main>

      <nav className={`tabbar${pages.length > 2 ? ' is-3' : ''}`} aria-label="Pages">
        {pages.map((p) => (
          <NavLink key={p.to} to={p.to} end={p.end} className="tabbar-link">
            <span className="nav-icon mono" aria-hidden>
              {p.icon}
            </span>
            {p.label}
          </NavLink>
        ))}
      </nav>
      <ScrollRestoration />
    </div>
  );
}
