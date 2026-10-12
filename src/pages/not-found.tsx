import { Link } from 'react-router';

export function NotFound({ inShell }: { inShell?: boolean }) {
  return (
    <div className={inShell ? 'page' : 'page page-alone'}>
      <div className="paper notfound">
        <h1>Cette page n'existe pas</h1>
        <p className="muted">Le lien est peut-être ancien : la leçon a pu changer de nom.</p>
        <Link to="/" className="btn btn-primary">
          Revenir au sommaire
        </Link>
      </div>
    </div>
  );
}
