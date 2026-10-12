import '@fontsource-variable/recursive/full.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/lesson.css';
import './styles/account.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { Shell } from './components/shell';
import { Home } from './pages/home';
import { LoginPage, Splash } from './pages/login';
import { NotFound } from './pages/not-found';
import { UnitPage } from './pages/unit';
import { PythonProvider } from './python/engine';
import { AuthProvider, useAuth } from './state/auth';
import { ProgressProvider } from './state/progress';

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/unite/:id', element: <UnitPage /> },
      // the pages with the code editor are loaded when first opened (lighter first visit on a phone)
      { path: '/bac-a-sable', lazy: () => import('./pages/playground').then((m) => ({ Component: m.Playground })) },
      // admins only (checked by the page and by the server)
      { path: '/suivi', lazy: () => import('./pages/admin').then((m) => ({ Component: m.AdminPage })) },
      { path: '/suivi/:id', lazy: () => import('./pages/admin').then((m) => ({ Component: m.AdminStudentPage })) },
    ],
  },
  // a lesson takes the whole screen, without the menu
  { path: '/lecon/:id', lazy: () => import('./pages/lesson').then((m) => ({ Component: m.LessonPage })) },
  { path: '*', element: <NotFound /> },
]);

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
