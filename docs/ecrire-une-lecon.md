# Écrire une leçon

Guide pour ajouter du contenu à l'application. Le modèle exact est dans `src/content/types.ts` ;
des exemples complets sont dans `src/content/bases/` (lire `u5-fonctions.ts` et `u7-parcours.ts`).

## Public et ton

- Un élève de Terminale NSI **très faible** (« plus que débutant »). Phrases courtes, un seul nouveau mot à la fois,
  chaque terme défini à l'endroit où il apparaît. On vouvoie l'élève.
- Tout est en **français**, avec la typographie française dans les textes affichés : `«  »`, espaces avant `: ; ? !`
  quand c'est naturel (ne pas en mettre dans le code).
- Exemples tirés de l'**informatique** ou du **lycée** (fichiers, ports, températures du processeur, notes, salles,
  élèves, réseaux…). **Interdits** : cartes à jouer, jeux d'argent, paris, dés pour de l'argent, et prêts ou
  placements avec intérêts (les élèves sont au lycée Victor Hugo de Marrakech).
- On suit le programme et le vocabulaire du **bac NSI** (« renvoie », « paramètre », « tableau de variables »…).

## Structure d'une unité

```ts
import type { Unit } from '../types';

export const nomUnite: Unit = {
  id: 'id-unique',            // en minuscules, unique dans tout le cours
  title: 'Titre court',
  subtitle: 'mots-clés, séparés, par des virgules',
  chapter: 'Chapitre 2',      // chapitre du ROADMAP (facultatif)
  lessons: [ /* leçons, puis le défi */ ],
};
```

- Une **leçon** (`type` absent) : 8 à 11 étapes, dont au moins 6 exercices. On alterne explication et exercice :
  jamais plus de 2 cartes `card` à la suite.
- Les chapitres lourds ont **2 leçons** puis le défi.
- Le **défi** (`type: 'defi'`) suit toujours la méthode en 4 étapes : `card` (le problème) → `choice`
  (**Comprendre** : un exemple à faire à la main) → `order` en mode `'text'` (**Découper** : les étapes en français,
  avec 1 intrus) → `code` ou `sql` (**Coder**, avec des tests).
- Les identifiants de leçon sont `id-unite-1`, `id-unite-2`, `id-unite-defi`.

## Le balisage des textes

Dans tous les textes (`body`, `prompt`, `explain`, `hints`, options non `mono`) : `**gras**` et `` `code` ``. Rien d'autre
(pas de listes, pas de liens, pas de balisage imbriqué).

## Les types d'étapes et leurs règles de vérification

`npm run verify` exécute tout avec du vrai Python. **Chaque valeur attendue doit être exacte au caractère près.**
Pour la trouver sans ordinateur, déroulez le programme à la main, ligne par ligne, avec un tableau de variables.
Gardez les programmes **courts** et les données **petites** pour que ce soit facile.

| Type | À quoi ça sert | Ce qui est vérifié |
|---|---|---|
| `card` | Expliquer, avec du code et son affichage | `output` est exactement ce qu'affiche `code` |
| `demo` | Suivre un programme pas à pas (variables) | `code` s'exécute sans erreur, en moins de 400 étapes |
| `choice` | QCM | si `code` est donné (et pas `noOutputCheck`), l'option `answer` est **exactement** ce que le code affiche, et aucune autre option ne l'est |
| `order` | Remettre dans l'ordre | mode `'code'` : `lines` jointes par `\n` doivent produire `output` ou réussir `tests` |
| `fill` | Compléter les trous `{{…}}` | le code rempli avec les bonnes réponses réussit `output` / `tests` ; aucun intrus n'est une bonne réponse |
| `bug` | Toucher la ligne fautive | `line` (à partir de 1) est différente dans `fixed` ; `fixed` s'exécute et affiche `output` |
| `table` | Tableau de variables, ou tableau du cours sans code | avec `code` : la **dernière ligne** = valeurs finales des variables (sauf `noFinalCheck: true`) |
| `code` | Écrire du code | `solution` réussit `tests`, `output` et `variants` ; `starter` échoue |
| `sql` | Écrire une requête SQL | `solution` s'exécute sur `schema` et donne au moins une ligne ; `starter` échoue |

### Détails importants

- **`choice` avec code** : si la question ne porte pas sur l'affichage (par exemple « que se passe-t-il ? »,
  « combien de comparaisons ? »), mettez `noOutputCheck: true`. Un programme qui provoque une erreur doit toujours
  avoir `noOutputCheck: true`. `mono: true` affiche les options en police de code (pour des affichages).
  L'affichage de plusieurs lignes s'écrit avec `\n` dans l'option.
- **`tests` de `code` / `order` / `fill`** : `expected` est le **`repr()`** de la valeur renvoyée :
  `'13.5'`, `'True'`, `'None'`, `'[1, 2]'`, `"'abc'"` (une chaîne s'écrit **avec ses guillemets simples**),
  `"{'a': 1}"`, `'(2, 3)'`. Jamais un objet d'une classe (son `repr` contient une adresse mémoire) : testez un
  attribut ou le résultat d'une méthode, par exemple `Pile().est_vide()` ou `creer().valeur`.
  Un test peut enchaîner plusieurs choses avec une expression, par exemple
  `(lambda p: (p.empiler(3), p.depiler())[1])(Pile())`, mais préférez une fonction de test écrite dans le starter.
- **`variants`** (programmes sans fonction) : `replace: ['total = 200', 'total = 130']` remplace la première
  occurrence ; la chaîne de gauche doit être **dans le `starter`**.
- **`starter` de `code`** : il doit **échouer** aux tests. Pour une fonction, laissez le corps vide :
  `'def f(x):\n    '` (Python lève alors une erreur d'indentation, donc échec). `...` est aussi accepté.
- **`table`** : `answer[ligne][colonne]` ; une case commençant par `=` est donnée à l'élève (`'=0'` affiche 0).
  `'=–'` (tiret demi-cadratin) = la variable n'existe pas encore. Les valeurs sont écrites comme Python les
  afficherait avec `repr` : `[3, 4]`, `'a'` pour une chaîne. Les espaces, les guillemets et les majuscules ne
  comptent pas dans la comparaison (`isn`, `'isn'` et `ISN` sont acceptés pour `'isn'` ; `r2` pour `R2`).
  Sans `code`, c'est un tableau du cours (table de routage, ordonnancement…) : rien n'est exécuté.
- **`fill`** : les trous s'écrivent `{{réponse}}` dans `code`. Les jetons proposés sont les réponses + `distractors`
  (sans doublon). Un même jeton peut servir deux fois.
- **`order` en mode `'code'`** : chaque ligne contient son indentation (4 espaces par niveau). Les `distractors`
  doivent être **faux** à coup sûr (par exemple une ligne mal décalée, `=` au lieu de `==`).
- **`sql`** : `schema` est du SQLite (`CREATE TABLE … ; INSERT INTO … VALUES …;`). Gardez 2 à 3 tables et
  5 à 8 lignes par table. Comparaison : mêmes colonnes (en nombre), mêmes lignes ; l'ordre ne compte que si
  `ordered: true` (questions avec `ORDER BY`). Les noms de colonnes ne comptent pas. Pour `INSERT`, `UPDATE`
  et `DELETE`, le résultat comparé est la table modifiée.
- **`figure`** (sur toutes les étapes sauf `demo`) : un dessin ou une liste de dessins.
  - Arbre binaire : `{ kind: 'tree', tree: [8, [3, [1], [6]], [10, null, [14]]] }` (`[valeur, gauche, droite]`).
  - Graphe : `{ kind: 'graph', nodes: [{ id: 'A', x: 10, y: 20 }, …], edges: [['A', 'B'], ['B', 'C', '5']], directed: true }`
    (x et y entre 0 et 100 ; le 3ᵉ élément d'une arête est son poids).
  - Tableau de données : `{ kind: 'table', title: 'eleves', columns: ['id', 'nom'], rows: [[1, 'Nadia']] }`.

### Ce que Python ne peut pas faire ici

- Pas de `input()` (aucune valeur à lire), pas de fichiers, pas de réseau, pas de hasard (`random`) : les
  résultats doivent toujours être les mêmes.
- Pas de boucle infinie, pas de récursion profonde (moins de 100 appels).
- `print` de flottants : évitez les calculs qui donnent `0.30000000000000004` ; préférez des entiers ou `.5`.

### Pièges d'écriture TypeScript

- Les chaînes TypeScript sont entre apostrophes `'…'` : une apostrophe française s'écrit `\'` (« l\'élève »).
- Dans le code Python, `\n` (dans une chaîne TypeScript) est un **retour à la ligne** du programme. Pour un
  `\n` *dans* une chaîne Python, il faudrait `\\n` : **évitez-le** (faites plusieurs `print`).
- Les chaînes Python du code utilisent des guillemets doubles `"…"` (pas besoin d'échapper dans du TypeScript `'…'`).

## Avant de rendre une leçon

1. Chaque `output` et chaque `expected` a été déroulé à la main, ligne par ligne.
2. Chaque `starter` échoue vraiment (corps vide, ou `...`).
3. Pas de mot nouveau sans explication ; pas plus de 2 cartes de suite.
4. `npm run verify` ne signale aucun problème.
