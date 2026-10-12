import '@fontsource-variable/recursive/full.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/sidebar.css';
import './styles/components.css';
import './styles/lesson.css';
import './styles/account.css';
import './styles/backoffice.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';

import { Shell } from './components/shell';
import { Home } from './pages/home';
import { LoginPage, Splash } from './pages/login';
import { NotFound } from './pages/not-found';
import { UnitPage } from './pages/unit';
import { PythonProvider } from './python/engine';
import { studentView } from './state/admin-view';
import { AuthProvider, useAuth } from './state/auth';
import { ProgressProvider } from './state/progress';

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <Start /> },
      { path: '/unite/:id', element: <UnitPage /> },
      // the pages with the code editor are loaded when first opened (lighter first visit on a phone)
      { path: '/bac-a-sable', lazy: () => import('./pages/playground').then((m) => ({ Component: m.Playground })) },
    ],
  },
  // the back-office: admins only (checked by the pages and by the server)
  {
    path: '/admin',
    lazy: () => import('./admin/shell').then((m) => ({ Component: m.AdminShell })),
    children: [
      { index: true, lazy: () => import('./admin/dashboard').then((m) => ({ Component: m.Dashboard })) },
      { path: 'eleves', lazy: () => import('./admin/students').then((m) => ({ Component: m.StudentsPage })) },
      { path: 'eleves/:id', lazy: () => import('./admin/students').then((m) => ({ Component: m.StudentPage })) },
      { path: 'lecons', lazy: () => import('./admin/lessons').then((m) => ({ Component: m.LessonsPage })) },
    ],
  },
  { path: '/suivi/*', element: <Navigate to="/admin/eleves" replace /> },
  // a lesson takes the whole screen, without the menu
  { path: '/lecon/:id', lazy: () => import('./pages/lesson').then((m) => ({ Component: m.LessonPage })) },
  { path: '*', element: <NotFound /> },
]);

/** The home page; an admin goes to the back-office, unless they chose "Voir le site élève". */
function Start() {
  const auth = useAuth();
  if (auth.user?.isAdmin && !studentView()) return <Navigate to="/admin" replace />;
  return <Home />;
}

/** The app for the logged-in student, or the login page. */
function Gate() {
  const auth = useAuth();
  if (auth.status === 'loading') return <Splash />;
  if (!auth.user) return <LoginPage />;
  // key: another account starts from its own progress
  return (
    <ProgressProvider key={auth.user.id} userId={auth.user.id} onExpired={auth.expire}>
      <RouterProvider router={router} />
    </ProgressProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      {/* outside the gate: Python is downloaded while the student logs in */}
      <PythonProvider>
        <Gate />
      </PythonProvider>
    </AuthProvider>
  </StrictMode>,
);
