// Dark box showing what a program printed, with an optional error explained in French.
import { explainError, pythonSays } from '@/python/errors-fr';
import type { PyError } from '@/python/protocol';

import { RichText } from './rich-text';

export function ConsoleView({
  output,
  error,
  timeout,
  label = 'Affichage',
  emptyText = '(rien ne s\'affiche)',
}: {
  output: string;
  error?: PyError | null;
  timeout?: boolean;
  label?: string;
  emptyText?: string;
}) {
  return (
    <div className="console-wrap">
      <div className="console">
        <div className="console-label">{label}</div>
        <pre className={`console-out${output ? '' : ' is-empty'}`}>{output ? output.replace(/\n$/, '') : emptyText}</pre>
      </div>
      {timeout ? (
        <div className="alert alert-bad">
          <RichText>{'**Le programme ne s\'arrête pas.** Une boucle infinie ? Vérifiez que la condition du `while` finit par devenir fausse.'}</RichText>
        </div>
      ) : null}
      {error ? (
        <div className="alert alert-bad">
          <RichText>{`**Erreur.** ${explainError(error)}`}</RichText>
          <p className="alert-detail mono">Python dit : {pythonSays(error)}</p>
        </div>
      ) : null}
    </div>
  );
}
