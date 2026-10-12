// Log in or create an account. Shown instead of the app while nobody is logged in.
import { useState } from 'react';

import { useAuth } from '@/state/auth';

export function LoginPage() {
  const auth = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signup = mode === 'signup';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (signup) await auth.signup(email, password, auth.signupCode ? code : undefined);
      else await auth.login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Le serveur a rencontré un problème.');
      setBusy(false);
    }
  };

  const switchTo = (m: 'login' | 'signup') => {
    setMode(m);
    setError(null);
  };

  return (
    <div className="login">
      <div className="login-card paper">
        <div className="login-brand">
          <img src="/logo-96.png" alt="" width={56} height={56} />
          <div>
            <h1>PyBac</h1>
            <p className="muted">Python et NSI, jusqu'au bac</p>
          </div>
        </div>

        <div className="login-tabs" role="tablist" aria-label="Compte">
          <button type="button" role="tab" aria-selected={!signup} className={!signup ? 'is-on' : undefined} onClick={() => switchTo('login')}>
            Se connecter
          </button>
          <button type="button" role="tab" aria-selected={signup} className={signup ? 'is-on' : undefined} onClick={() => switchTo('signup')}>
            Créer un compte
          </button>
        </div>

        <form className="login-form" onSubmit={submit} noValidate>
          <label className="field">
            <span>Adresse e-mail</span>
            <input type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Mot de passe</span>
            <span className="field-row">
              <input
                type={show ? 'text' : 'password'}
                autoComplete={signup ? 'new-password' : 'current-password'}
                required
                minLength={signup ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="field-toggle" onClick={() => setShow(!show)} aria-pressed={show}>
                {show ? 'Cacher' : 'Afficher'}
              </button>
            </span>
            {signup ? <span className="field-hint">Au moins 8 caractères.</span> : null}
          </label>
          {signup && auth.signupCode ? (
            <label className="field">
              <span>Code de la classe</span>
              <input autoComplete="off" autoCapitalize="characters" required value={code} onChange={(e) => setCode(e.target.value)} />
              <span className="field-hint">Votre professeur vous le donne.</span>
            </label>
          ) : null}

          {error ? (
            <div className="alert alert-bad" role="alert">
              <p>{error}</p>
            </div>
          ) : null}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy || !email || !password}>
            {busy ? <span className="spinner" aria-label="En cours" /> : signup ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        <p className="login-note muted">
          {signup
            ? 'Votre progression est enregistrée sur votre compte : vous la retrouvez sur l\'ordinateur et sur le téléphone.'
            : 'Mot de passe oublié ? Demandez à votre professeur de vous en donner un nouveau.'}
        </p>
      </div>
    </div>
  );
}

export function Splash() {
  return (
    <div className="login" aria-busy>
      <span className="spinner" style={{ color: 'var(--encre)', width: 28, height: 28 }} aria-label="Chargement" />
    </div>
  );
}
