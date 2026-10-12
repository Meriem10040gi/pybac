// Frame of the course pages.
// Computer: a menu on the left: who is logged in, the overall progress, the pages, the lesson to do
// now, the modules of the course (with their progress, a click goes to the module), and at the
// bottom the settings and logging out.
// Phone: a bar at the top (logo, XP) and the pages at the bottom of the screen.
import { Link, NavLink, Outlet, ScrollRestoration, useNavigate } from 'react-router';

import { COURSE, LESSONS } from '@/content/course';
import { setStudentView } from '@/state/admin-view';
import { useAuth } from '@/state/auth';
import { useProgress, type SyncState } from '@/state/progress';

import { IconAdmin, IconCourse, IconLogout, IconPlay, IconSettings, IconTerminal } from './icons';
import { Settings } from './settings';
import { Profile, Ring } from './side';
import { Stats } from './ui';

function Brand({ sub = true }: { sub?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="PyBac, accueil">
      <img src="/logo-96.png" alt="" width={40} height={40} />
      <span>
        <span className="brand-name">PyBac</span>
        {sub ? <span className="brand-sub">Python et NSI</span> : null}
      </span>
    </Link>
  );
}

const PAGES = [
  { to: '/', label: 'Le parcours', Icon: IconCourse, end: true },
  { to: '/bac-a-sable', label: 'Bac à sable', Icon: IconTerminal, end: false },
];

/** "Terminale : structures de données" becomes "Structures de données" (the menu is narrow). */
const shortTitle = (t: string) => {
  const s = t.replace(/^Terminales*:s*/, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const SYNC: Record<SyncState, string> = {
  loading: 'Connexion…',
  saving: 'Enregistrement…',
  saved: 'Progression enregistrée',
  offline: 'Hors ligne, gardée ici',
};

export function Shell() {
  const progress = useProgress();
  const auth = useAuth();
  const navigate = useNavigate();
  const backOffice = () => {
    setStudentView(false);
    navigate('/admin');
  };
  const done = LESSONS.filter((l) => progress.isDone(l.lesson.id)).length;
  const current = progress.current();
  const next = current ?? progress.next();

  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />

        {auth.user ? <Profile email={auth.user.email} sub={SYNC[progress.sync]} subClass={`is-${progress.sync}`} /> : null}

        <div className="side-progress">
          <Ring value={done / LESSONS.length} />
          <div className="side-progress-text">
            <span className="side-progress-main">
              {done} leçon{done > 1 ? 's' : ''} sur {LESSONS.length}
            </span>
            <span className="side-progress-stats">
              <span title="Points d'expérience">⚡ {progress.xp} XP</span>
              <span title="Jours d'affilée avec au moins une leçon">
                🔥 {progress.streakNow} jour{progress.streakNow > 1 ? 's' : ''}
              </span>
            </span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Pages">
          {PAGES.map((p) => (
            <NavLink key={p.to} to={p.to} end={p.end} className="sidebar-link">
              <p.Icon />
              {p.label}
            </NavLink>
          ))}
          {auth.user?.isAdmin ? (
            <button type="button" className="sidebar-link" onClick={backOffice}>
              <IconAdmin />
              Retour au back-office
            </button>
          ) : null}
        </nav>

        {next ? (
          <Link to={`/lecon/${next.lesson.id}`} className="side-next">
            <span className="side-next-icon">
              <IconPlay size={16} />
            </span>
            <span className="side-next-text">
              <span className="side-next-kicker">{current ? `Reprendre, étape ${current.pos + 1} sur ${current.total}` : 'Leçon suivante'}</span>
              <span className="side-next-title">{next.lesson.title}</span>
            </span>
          </Link>
        ) : null}

        <section className="side-modules" aria-label="Les modules du cours">
          <h2 className="side-heading">Les modules</h2>
          <ul>
            {COURSE.map((m) => {
              const ids = m.units.flatMap((u) => u.lessons.map((l) => l.id));
              const d = ids.filter((id) => progress.isDone(id)).length;
              const complete = d === ids.length;
              return (
                <li key={m.id}>
                  <Link to={{ pathname: '/', hash: `#module-${m.id}` }} className={`side-module${complete ? ' is-complete' : ''}`}>
                    <span className="side-module-title" title={m.title}>
                      {shortTitle(m.title)}
                    </span>
                    <span className="side-module-bar" aria-hidden>
                      <span style={{ width: `${(d / ids.length) * 100}%` }} />
                    </span>
                    <span className="side-module-count">{complete ? '✓' : `${d}/${ids.length}`}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="sidebar-foot">
          <details className="side-settings">
            <summary>
              <IconSettings />
              Réglages
            </summary>
            <Settings />
          </details>
          <button type="button" className="sidebar-link side-logout" onClick={() => void auth.logout()}>
            <IconLogout />
            Se déconnecter
          </button>
        </div>
      </aside>

      <header className="topbar">
        <Brand sub={false} />
        <div className="topbar-stats">
          {auth.user?.isAdmin ? (
            <button type="button" className="btn btn-gold btn-small" onClick={backOffice}>
              Back-office
            </button>
          ) : (
            <Stats xp={progress.xp} streak={progress.streakNow} />
          )}
        </div>
      </header>

      <main className="main" id="contenu">
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Pages">
        {PAGES.map((p) => (
          <NavLink key={p.to} to={p.to} end={p.end} className="tabbar-link">
            <span className="nav-icon" aria-hidden>
              <p.Icon />
            </span>
            {p.label}
          </NavLink>
        ))}
      </nav>
      <ScrollRestoration />
    </div>
  );
}
