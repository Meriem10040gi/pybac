// Python error messages explained in simple French, for a beginner.
import type { PyError } from './protocol';

function explainSyntax(msg: string): string {
  if (/expected ':'/.test(msg)) return 'il manque les deux-points `:` à la fin de la ligne.';
  if (/was never closed/.test(msg)) return 'une parenthèse ou un crochet n\'est pas fermé.';
  if (/unmatched/.test(msg)) return 'une parenthèse ou un crochet fermant est en trop.';
  if (/unterminated string/.test(msg)) return 'un texte n\'est pas fermé : il manque un guillemet.';
  if (/cannot assign|Maybe you meant '=='/.test(msg)) return 'pour comparer, il faut `==` ; un seul `=` sert à ranger une valeur.';
  if (/expected an indented block/.test(msg)) return 'la ligne après les `:` doit être décalée de 4 espaces.';
  if (/unexpected indent/.test(msg)) return 'cette ligne est décalée alors qu\'elle ne devrait pas l\'être.';
  if (/unindent does not match/.test(msg)) return 'le décalage de cette ligne ne correspond à aucune ligne au-dessus.';
  if (/'return' outside function/.test(msg)) return '`return` ne peut s\'utiliser que dans une fonction (décalé sous le `def`).';
  if (/invalid decimal literal|invalid syntax/.test(msg)) return 'Python ne comprend pas cette ligne : vérifiez les symboles, les deux-points et les guillemets.';
  return 'Python ne comprend pas cette ligne.';
}

export function explainError(e: PyError): string {
  const where = e.line ? `Ligne ${e.line} : ` : '';
  const m = e.message;
  let fr: string;
  switch (e.type) {
    case 'SyntaxError':
    case 'IndentationError':
    case 'TabError':
      fr = explainSyntax(m);
      break;
    case 'NameError': {
      const name = /name '(\w+)'/.exec(m)?.[1];
      fr = name
        ? `\`${name}\` n'existe pas. Faute de frappe ? Majuscule ? Variable pas encore créée ?`
        : 'un nom utilisé n\'existe pas.';
      break;
    }
    case 'TypeError':
      if (/NoneType/.test(m)) fr = 'une valeur vaut `None` (rien). Une fonction utilise-t-elle `print` au lieu de `return` ?';
      else if (/missing \d+ required positional argument/.test(m)) fr = 'il manque une valeur lors de l\'appel de la fonction.';
      else if (/takes \d+ positional arguments? but \d+ (were|was) given/.test(m)) fr = 'la fonction reçoit trop de valeurs.';
      else if (/can only concatenate str/.test(m) || /'str' and 'int'|'int' and 'str'/.test(m)) fr = 'on ne peut pas mélanger un texte et un nombre dans ce calcul.';
      else if (/not subscriptable/.test(m)) fr = 'on utilise des crochets `[ ]` sur une valeur qui n\'est pas une liste.';
      else if (/not iterable/.test(m)) fr = 'on ne peut pas parcourir cette valeur avec `for` (ce n\'est pas une liste).';
      else fr = 'cette opération est impossible avec ces types de valeurs.';
      break;
    case 'IndexError':
      fr = 'cet indice n\'existe pas. Les indices vont de 0 à `len(L) - 1`.';
      break;
    case 'ZeroDivisionError':
      fr = 'division par zéro.';
      break;
    case 'AttributeError': {
      const name = /has no attribute '(\w+)'/.exec(m)?.[1];
      fr = name ? `la méthode \`.${name}\` n'existe pas pour cette valeur.` : 'cette méthode n\'existe pas.';
      if (name === 'add' || name === 'push') fr += ' Pour ajouter à une liste : `append`.';
      break;
    }
    case 'ValueError':
      fr = 'la valeur n\'a pas la bonne forme (par exemple `int("abc")`).';
      break;
    case 'KeyError':
      fr = 'cette clé n\'existe pas dans le dictionnaire.';
      break;
    case 'RecursionError':
      fr = 'la fonction s\'appelle elle-même sans jamais s\'arrêter.';
      break;
    case 'EngineRestart':
      fr = 'Python a dû redémarrer. Relancez le programme.';
      break;
    default:
      fr = m;
  }
  return `${where}${fr}`;
}

/** The original Python message, shown under the explanation. */
export function pythonSays(e: PyError): string {
  return `${e.type}: ${e.message}`;
}
