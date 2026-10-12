// "Mode libre" (all lessons open), erasing the progress (with a confirmation), and the account:
// who is logged in, whether the progress is saved on the server, and logging out.
import { useState } from 'react';

import { useAuth } from '@/state/auth';
import { useProgress, type SyncState } from '@/state/progress';

import { Button } from './ui';

export function Settings() {
  const progress = useProgress();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="settings">
      <label className="switch-row">
        <span>
          <span className="switch-title">Mode libre</span>
          <span className="switch-sub">Ouvrir toutes les leçons, sans suivre l'ordre</span>
        </span>
        <input type="checkbox" role="switch" className="switch" checked={progress.freeAccess} onChange={(e) => progress.setFreeAccess(e.target.checked)} />
      </label>
      {confirm ? (
        <div className="confirm" role="alertdialog" aria-label="Effacer la progression ?">
          <p>Les leçons terminées et les XP de votre compte seront effacés, sur tous vos appareils.</p>
          <div className="row">
            <Button small variant="ghost" label="Annuler" onClick={() => setConfirm(false)} style={{ flex: 1 }} />
            <Button
              small
              variant="bad"
              label="Effacer"
              onClick={() => {
                void progress.reset();
                setConfirm(false);
              }}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      ) : (
        <button type="button" className="link-button" onClick={() => setConfirm(true)}>
          Effacer la progression
        </button>
      )}
    </div>
  );
}

const SYNC: Record<SyncState, string> = {
  loading: 'Connexion au serveur…',
  saving: 'Enregistrement…',
  saved: 'Progression enregistrée sur votre compte',
  offline: 'Hors ligne : progression gardée sur cet appareil, envoyée dès le retour d\'internet',
};

export function Account() {
  const auth = useAuth();
  const progress = useProgress();
  if (!auth.user) return null;
  return (
    <div className="account">
      <p className="account-email" title={auth.user.email}>
        {auth.user.email}
      </p>
      <p className={`account-sync is-${progress.sync}`}>{SYNC[progress.sync]}</p>
      <button type="button" className="link-button" onClick={() => void auth.logout()}>
        Se déconnecter
      </button>
    </div>
  );
}
