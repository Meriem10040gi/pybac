// Frame of the back-office: its own menu (dark, so it is never mistaken for the student site),
// the pages, and the way back to the student site. Only for admins; the server checks again.
import { Link, NavLink, Outlet, ScrollRestoration, useNavigate } from 'react-router';

import { NotFound } from '@/pages/not-found';
import { setStudentView } from '@/state/admin-view';
import { useAuth } from '@/state/auth';

import { AdminDataProvider } from './data';

const PAGES = [
  { to: '/admin', label: 'Tableau de bord', icon: '◧', end: true },
  { to: '/admin/eleves', label: 'Élèves', icon: '☺', end: false },
  { to: '/admin/lecons', label: 'Leçons', icon: '☰', end: false },
];

export function AdminShell() {
  const auth = useAuth();
  const navigate = useNavigate();
  if (!auth.user?.isAdmin) return <NotFound />;

  const studentSite = () => {
    setStudentView(true);
    navigate('/');
  };

  return (
    <AdminDataProvider>
      <div className="bo">
        <aside className="bo-side">
          <Link to="/admin" className="brand" aria-label="Back-office PyBac">
            <img src="/logo-96.png" alt="" width={40} height={40} />
            <span>
              <span className="brand-name">PyBac</span>
              <span className="brand-sub">Back-office</span>
            </span>
          </Link>
          <nav className="bo-nav" aria-label="Back-office">
            {PAGES.map((p) => (
              <NavLink key={p.to} to={p.to} end={p.end} className="bo-link">
                <span className="nav-icon" aria-hidden>
                  {p.icon}
                </span>
                {p.label}
              </NavLink>
            ))}
          </nav>
          <div className="bo-foot">
            <button type="button" className="btn btn-gold btn-small btn-block" onClick={studentSite}>
              Voir le site élève
            </button>
            <p className="account-email" title={auth.user.email}>
              {auth.user.email}
            </p>
            <button type="button" className="link-button" onClick={() => void auth.logout()}>
              Se déconnecter
            </button>
          </div>
        </aside>

        <header className="bo-top">
          <Link to="/admin" className="brand" aria-label="Back-office PyBac">
            <img src="/logo-96.png" alt="" width={34} height={34} />
            <span>
              <span className="brand-name">Back-office</span>
            </span>
          </Link>
          <div className="bo-top-actions">
            <button type="button" className="btn btn-gold btn-small" onClick={studentSite}>
              Site élève
            </button>
            <button type="button" className="bo-top-logout" onClick={() => void auth.logout()}>
              Déconnexion
            </button>
          </div>
        </header>

        <main className="bo-main">
          <Outlet />
        </main>

        <nav className="bo-tabbar" aria-label="Back-office">
          {PAGES.map((p) => (
            <NavLink key={p.to} to={p.to} end={p.end} className="tabbar-link">
              <span className="nav-icon" aria-hidden>
                {p.icon}
              </span>
              {p.label}
            </NavLink>
          ))}
        </nav>
        <ScrollRestoration />
      </div>
    </AdminDataProvider>
  );
}

/** Top of every back-office page: title, a line of context, and the date of the data with "Actualiser". */
export function BoHead({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="bo-head">
      <div>
        <h1>{title}</h1>
        {sub ? <p className="muted">{sub}</p> : null}
      </div>
      {children ? <div className="row">{children}</div> : null}
    </header>
  );
}
