// Frame of the back-office: its own menu (dark, so it is never mistaken for the student site),
// the pages, and the way back to the student site. Only for admins; the server checks again.
import { Link, NavLink, Outlet, ScrollRestoration, useNavigate } from 'react-router';

import { IconDashboard, IconEye, IconLessons, IconLogout, IconStudents } from '@/components/icons';
import { Profile } from '@/components/side';
import { LESSONS } from '@/content/course';
import { NotFound } from '@/pages/not-found';
import { setStudentView } from '@/state/admin-view';
import { useAuth } from '@/state/auth';

import { AdminDataProvider, day, daysAgo, lastActive, useAdminData } from './data';

const PAGES = [
  { to: '/admin', label: 'Tableau de bord', Icon: IconDashboard, end: true, count: null },
  { to: '/admin/eleves', label: 'Élèves', Icon: IconStudents, end: false, count: 'students' },
  { to: '/admin/lecons', label: 'Leçons', Icon: IconLessons, end: false, count: 'lessons' },
] as const;

/** Number shown next to a link of the menu. */
function Count({ of }: { of: 'students' | 'lessons' | null }) {
  const { accounts, students } = useAdminData();
  if (!of) return null;
  if (of === 'students' && !accounts) return null;
  return <span className="bo-count">{of === 'students' ? students.length : LESSONS.length}</span>;
}

/** What happened today, at a glance. */
function Today() {
  const { students, accounts } = useAdminData();
  if (!accounts) return null;
  const today = day(new Date());
  const active = students.filter((s) => {
    const d = lastActive(s);
    return d !== null && daysAgo(d) === 0;
  }).length;
  const finished = students.reduce((n, s) => n + Object.values(s.progress.done).filter((r) => r.date === today).length, 0);
  const fresh = students.filter((s) => daysAgo(new Date(s.createdAt)) === 0).length;
  return (
    <section className="bo-today" aria-label="Aujourd'hui">
      <h2 className="side-heading">Aujourd'hui</h2>
      <dl>
        <div>
          <dt>Élèves actifs</dt>
          <dd>{active}</dd>
        </div>
        <div>
          <dt>Leçons terminées</dt>
          <dd>{finished}</dd>
        </div>
        <div>
          <dt>Nouveaux comptes</dt>
          <dd>{fresh}</dd>
        </div>
      </dl>
    </section>
  );
}

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
          <Profile email={auth.user.email} sub="Administrateur" subClass="is-admin" />
          <nav className="bo-nav" aria-label="Back-office">
            {PAGES.map((p) => (
              <NavLink key={p.to} to={p.to} end={p.end} className="bo-link">
                <p.Icon />
                {p.label}
                <Count of={p.count} />
              </NavLink>
            ))}
          </nav>
          <Today />
          <div className="bo-foot">
            <button type="button" className="bo-link" onClick={studentSite}>
              <IconEye />
              Voir le site élève
            </button>
            <button type="button" className="bo-link side-logout" onClick={() => void auth.logout()}>
              <IconLogout />
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
                <p.Icon />
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
