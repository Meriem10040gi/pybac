import type { Unit } from '../types';

// One small database for the whole unit: a lycée with its classes, its students and their marks.
// The same data is used in the SQLite schemas and in the table figures: keep them identical.

const CLASSES = `CREATE TABLE classes (id INTEGER PRIMARY KEY, nom TEXT, salle TEXT);
INSERT INTO classes VALUES (1, 'TG1', 'B12'), (2, 'TG2', 'B14'), (3, 'TG3', 'C01'), (4, '1G1', 'A03'), (5, '1G2', 'A05');
`;

const ELEVES = `CREATE TABLE eleves (id INTEGER PRIMARY KEY, nom TEXT, prenom TEXT, classe_id INTEGER);
INSERT INTO eleves VALUES (1, 'Alami', 'Nadia', 1), (2, 'Tazi', 'Yanis', 2), (3, 'Chraibi', 'Ines', 1), (4, 'Bennani', 'Sami', 3), (5, 'Idrissi', 'Lina', 2), (6, 'Fassi', 'Omar', 4);
`;

const NOTES = `CREATE TABLE notes (id INTEGER PRIMARY KEY, eleve_id INTEGER, matiere TEXT, note INTEGER);
INSERT INTO notes VALUES (1, 1, 'NSI', 15), (2, 1, 'Maths', 12), (3, 2, 'NSI', 9), (4, 3, 'NSI', 18), (5, 4, 'Maths', 7), (6, 5, 'NSI', 13), (7, 6, 'Maths', 14), (8, 6, 'NSI', 10);
`;

const FIG_CLASSES = {
  kind: 'table' as const,
  title: 'classes',
  columns: ['id', 'nom', 'salle'],
  rows: [
    [1, 'TG1', 'B12'],
    [2, 'TG2', 'B14'],
    [3, 'TG3', 'C01'],
    [4, '1G1', 'A03'],
    [5, '1G2', 'A05'],
  ],
};

const FIG_ELEVES = {
  kind: 'table' as const,
  title: 'eleves',
  columns: ['id', 'nom', 'prenom', 'classe_id'],
  rows: [
    [1, 'Alami', 'Nadia', 1],
    [2, 'Tazi', 'Yanis', 2],
    [3, 'Chraibi', 'Ines', 1],
    [4, 'Bennani', 'Sami', 3],
    [5, 'Idrissi', 'Lina', 2],
    [6, 'Fassi', 'Omar', 4],
  ],
};

const FIG_NOTES = {
  kind: 'table' as const,
  title: 'notes',
  columns: ['id', 'eleve_id', 'matiere', 'note'],
  rows: [
    [1, 1, 'NSI', 15],
    [2, 1, 'Maths', 12],
    [3, 2, 'NSI', 9],
    [4, 3, 'NSI', 18],
    [5, 4, 'Maths', 7],
    [6, 5, 'NSI', 13],
    [7, 6, 'Maths', 14],
    [8, 6, 'NSI', 10],
  ],
};

export const sqlUnit: Unit = {
  id: 'sql',
  title: 'Bases de données et SQL',
  subtitle: 'tables, clés, requêtes SELECT, jointures',
  chapter: 'Chapitre 3',
  lessons: [
    {
      id: 'sql-1',
      title: 'Tables, clés et SELECT',
      steps: [
        {
          kind: 'card',
          title: 'Une base de données',
          body: [
            'Une **base de données** range des informations dans des **tables**. Dans le modèle **relationnel**, une table s\'appelle une **relation**.',
            'Chaque colonne est un **attribut** : `id`, `nom`, `prenom`, `classe_id`. Chaque ligne est un **enregistrement** : ici, un élève.',
            'Le **domaine** d\'un attribut est l\'ensemble des valeurs permises : des entiers pour `id`, du texte pour `nom`.',
          ],
          figure: FIG_ELEVES,
          tip: 'Attention : en base de données, un « attribut » est une colonne. Ce n\'est pas l\'attribut d\'un objet en Python.',
        },
        {
          kind: 'choice',
          prompt: 'Dans la relation `eleves`, combien y a-t-il d\'**enregistrements** ?',
          figure: FIG_ELEVES,
          options: ['4', '6', '24', '1'],
          answer: 1,
          explain: 'Un enregistrement est une **ligne** : 6 élèves, donc 6 enregistrements. Le 4 est le nombre d\'attributs (les colonnes).',
        },
        {
          kind: 'card',
          title: 'Clé primaire et clé étrangère',
          body: [
            'Une **clé primaire** est un attribut dont la valeur est **unique** : deux lignes ne peuvent pas avoir la même. Elle désigne une ligne sans erreur possible. Dans les deux tables, c\'est `id`.',
            'Une **clé étrangère** est un attribut qui contient la clé primaire d\'**une autre table**. Dans `eleves`, `classe_id` renvoie à `id` dans `classes`.',
            'Exemple : Nadia a `classe_id` = 1. Dans `classes`, l\'`id` 1 est la TG1, en salle B12. Nadia est donc en TG1.',
          ],
          figure: [FIG_CLASSES, FIG_ELEVES],
        },
        {
          kind: 'choice',
          prompt: 'Une **contrainte d\'intégrité** est une règle que la base fait toujours respecter. On veut ajouter dans `eleves` la ligne (3, Saidi, Rim, 2). Que se passe-t-il ?',
          figure: FIG_ELEVES,
          options: [
            'La ligne est ajoutée normalement',
            'C\'est refusé : l\'`id` 3 existe déjà, et `id` est la clé primaire',
            'C\'est refusé : il y a déjà des élèves dans la classe 2',
            'Rim remplace Ines',
          ],
          answer: 1,
          explain: 'Contrainte de **clé primaire** : chaque valeur de `id` est unique. Ines a déjà l\'`id` 3. Il faut donner un `id` libre, par exemple 7.',
        },
        {
          kind: 'choice',
          prompt: 'Suivez la clé étrangère. Dans quelle salle a cours la classe d\'Omar Fassi ?',
          figure: [FIG_ELEVES, FIG_CLASSES],
          options: ['B12', 'B14', 'C01', 'A03'],
          answer: 3,
          explain: 'Omar a `classe_id` = 4. Dans `classes`, la ligne d\'`id` 4 est la 1G1, en salle A03. Contrainte de **référence** : une clé étrangère doit toujours renvoyer à une ligne qui existe. On ne pourrait pas mettre `classe_id` = 9 : il n\'y a pas de classe 9.',
        },
        {
          kind: 'card',
          title: 'Interroger la base : SELECT',
          body: [
            'Une **requête** est une question posée à la base, écrite en langage **SQL**.',
            '`SELECT nom, prenom FROM eleves` donne les colonnes `nom` et `prenom` de la table `eleves`. `SELECT * FROM eleves` donne **toutes** les colonnes.',
            '`WHERE` garde seulement les lignes qui vérifient une condition. `SELECT nom, prenom FROM eleves WHERE classe_id = 1` donne les élèves de la classe 1 : voici le résultat.',
          ],
          figure: { kind: 'table', title: 'Résultat', columns: ['nom', 'prenom'], rows: [['Alami', 'Nadia'], ['Chraibi', 'Ines']] },
          tip: 'En SQL, on compare avec un seul `=` (et aussi `<`, `>`, `<=`, `>=`, et `<>` pour « différent »). Un texte s\'écrit entre apostrophes : `\'NSI\'`.',
        },
        {
          kind: 'sql',
          prompt: 'Écrivez une requête qui donne le `nom` puis le `prenom` de **tous** les élèves.',
          schema: ELEVES,
          solution: 'SELECT nom, prenom FROM eleves',
          hints: ['Commencez par `SELECT`, puis les deux colonnes séparées par une virgule.', 'Après les colonnes : `FROM`, puis le nom de la table, `eleves`.'],
          explain: 'Le résultat est une nouvelle table, avec 2 colonnes et 6 lignes. Les colonnes sont dans l\'ordre écrit après `SELECT`.',
        },
        {
          kind: 'sql',
          prompt: 'Donnez le `prenom` des élèves de la classe dont l\'`id` est 2.',
          schema: ELEVES,
          solution: 'SELECT prenom FROM eleves WHERE classe_id = 2',
          hints: ['La classe d\'un élève est dans la colonne `classe_id`.', 'Ajoutez à la fin : `WHERE classe_id = 2`.'],
          explain: 'Deux élèves ont `classe_id` = 2 : Yanis et Lina.',
        },
        {
          kind: 'fill',
          prompt: 'Complétez la requête : les notes de NSI **strictement inférieures** à 12. `AND` (« et ») garde les lignes qui vérifient **les deux** conditions.',
          figure: FIG_NOTES,
          code: "SELECT note\nFROM {{notes}}\nWHERE matiere {{=}} 'NSI' {{AND}} note {{<}} 12",
          distractors: ['eleves', '==', 'OR', '>'],
          explain: 'En SQL, l\'égalité s\'écrit avec un seul `=`. Résultat : 9 et 10. Avec `OR` (« ou »), on aurait aussi toutes les autres notes de NSI et toutes les notes sous 12.',
        },
        {
          kind: 'sql',
          prompt: '`ORDER BY note` range les lignes par note **croissante**. `ORDER BY note DESC` les range de la plus grande à la plus petite (DESC veut dire décroissant). Donnez les notes de NSI (colonne `note`), de la **plus grande** à la plus petite.',
          schema: NOTES,
          solution: "SELECT note FROM notes WHERE matiere = 'NSI' ORDER BY note DESC",
          ordered: true,
          hints: ['D\'abord : `SELECT note FROM notes WHERE matiere = \'NSI\'`.', '`ORDER BY note DESC` se met tout à la fin.'],
          explain: 'Résultat : 18, 15, 13, 10, 9. `ORDER BY` s\'écrit toujours **après** le `WHERE`.',
        },
        {
          kind: 'sql',
          prompt: '`SELECT DISTINCT` donne chaque valeur **une seule fois** (sans doublon). Donnez la liste des matières de la table `notes`, sans doublon.',
          schema: NOTES,
          solution: 'SELECT DISTINCT matiere FROM notes',
          hints: ['La colonne est `matiere`.', 'Écrivez `DISTINCT` juste après `SELECT`.'],
          explain: 'Sans `DISTINCT`, on aurait 8 lignes (une par note). Avec, il en reste 2 : NSI et Maths.',
        },
      ],
    },
    {
      id: 'sql-2',
      title: 'Calculs, jointures et modifications',
      steps: [
        {
          kind: 'card',
          title: 'Calculer sur une colonne',
          body: [
            'Une fonction d\'**agrégation** calcule **une seule valeur** à partir de plusieurs lignes.',
            '`COUNT(*)` compte les lignes. `SUM(note)` fait la somme, `AVG(note)` la moyenne. `MIN(note)` et `MAX(note)` donnent la plus petite et la plus grande valeur.',
            'Exemple : `SELECT COUNT(*) FROM notes WHERE matiere = \'NSI\'` donne 5 : il y a 5 notes de NSI.',
          ],
          figure: FIG_NOTES,
        },
        {
          kind: 'choice',
          prompt: 'Que donne la requête `SELECT AVG(note) FROM notes WHERE matiere = \'Maths\'` ?',
          figure: FIG_NOTES,
          options: ['11', '33', '14', '3'],
          answer: 0,
          explain: 'Les notes de Maths sont 12, 7 et 14. Leur somme vaut 33 (c\'est ce que donnerait `SUM`), et il y en a 3 (`COUNT(*)`). La moyenne : 33 / 3 = 11.',
        },
        {
          kind: 'sql',
          prompt: 'Combien d\'élèves y a-t-il dans la classe d\'`id` 1 ? Écrivez la requête avec `COUNT(*)`.',
          schema: ELEVES,
          solution: 'SELECT COUNT(*) FROM eleves WHERE classe_id = 1',
          hints: ['`SELECT COUNT(*) FROM eleves` compte tous les élèves.', 'Ajoutez un `WHERE` sur la colonne `classe_id`.'],
          explain: 'Le résultat a une seule ligne et une seule colonne : 2 (Nadia et Ines).',
        },
        {
          kind: 'card',
          title: 'La jointure',
          body: [
            'Les notes sont dans `notes`, mais les prénoms sont dans `eleves`. Pour les avoir ensemble, on fait une **jointure** : on recolle les lignes des deux tables grâce à la clé étrangère.',
            'On écrit : `SELECT eleves.prenom, notes.note FROM notes JOIN eleves ON notes.eleve_id = eleves.id`. Chaque note est recollée à l\'élève dont l\'`id` est égal à son `eleve_id`.',
            'Les deux tables ont une colonne `id` : on écrit donc le nom de la table devant, avec un point (`eleves.id`, `notes.note`). Voici le résultat de la même requête, avec en plus `WHERE notes.matiere = \'Maths\'`.',
          ],
          figure: { kind: 'table', title: 'Résultat', columns: ['prenom', 'note'], rows: [['Nadia', 12], ['Sami', 7], ['Omar', 14]] },
        },
        {
          kind: 'order',
          prompt: 'Remettez dans l\'ordre les morceaux de la requête qui donne le prénom des élèves de la TG1. Un morceau est en trop.',
          mode: 'text',
          lines: ['SELECT eleves.prenom', 'FROM eleves', 'JOIN classes', 'ON eleves.classe_id = classes.id', "WHERE classes.nom = 'TG1'"],
          distractors: ['ON eleves.id = classes.id'],
          explain: 'L\'ordre est toujours `SELECT`, `FROM`, `JOIN … ON`, puis `WHERE`. Le `ON` relie la clé étrangère `eleves.classe_id` à la clé primaire `classes.id`. `eleves.id = classes.id` comparerait un numéro d\'élève avec un numéro de classe : cela n\'a pas de sens.',
        },
        {
          kind: 'sql',
          prompt: 'Donnez le `prenom` de chaque élève et le `nom` de sa classe. Il faut une jointure entre `eleves` et `classes`.',
          schema: CLASSES + ELEVES,
          solution: 'SELECT eleves.prenom, classes.nom FROM eleves JOIN classes ON eleves.classe_id = classes.id',
          hints: ['La jointure : `FROM eleves JOIN classes ON eleves.classe_id = classes.id`.', 'Les colonnes : `SELECT eleves.prenom, classes.nom`.'],
          explain: 'Chaque élève est recollé à sa classe : Nadia avec TG1, Yanis avec TG2… La 1G2 n\'a pas d\'élève : elle n\'apparaît pas.',
        },
        {
          kind: 'card',
          title: 'Modifier la base',
          body: [
            '`INSERT INTO notes VALUES (9, 2, \'Maths\', 16)` **ajoute** une ligne. Les valeurs sont dans l\'ordre des colonnes.',
            '`UPDATE notes SET note = 16 WHERE id = 5` **modifie** une valeur : la note de la ligne d\'`id` 5 devient 16.',
            '`DELETE FROM notes WHERE id = 2` **supprime** la ligne d\'`id` 2.',
          ],
          tip: 'Attention : sans `WHERE`, `UPDATE` et `DELETE` touchent **toutes** les lignes de la table !',
        },
        {
          kind: 'sql',
          prompt: 'Sami (l\'élève d\'`id` 4) a eu 17 en NSI. Ajoutez cette note dans la table `notes`, avec l\'`id` 9.',
          schema: NOTES,
          solution: "INSERT INTO notes VALUES (9, 4, 'NSI', 17)",
          hints: ['`INSERT INTO notes VALUES (…)` avec 4 valeurs.', 'L\'ordre des colonnes : `id`, `eleve_id`, `matiere`, `note`. Le texte entre apostrophes : `\'NSI\'`.'],
          explain: 'La table `notes` a maintenant 9 lignes. Avec un `id` déjà pris, la base aurait refusé : `id` est la clé primaire.',
        },
        {
          kind: 'sql',
          prompt: 'Erreur du professeur : la note d\'`id` 3 est 11, et non 9. Corrigez-la avec `UPDATE`.',
          schema: NOTES,
          solution: 'UPDATE notes SET note = 11 WHERE id = 3',
          hints: ['`UPDATE notes SET note = 11 …`', 'N\'oubliez pas `WHERE id = 3`, sinon toutes les notes deviennent 11 !'],
          explain: 'Seule la ligne d\'`id` 3 a changé. Le résultat affiché est la table `notes` après la modification.',
        },
        {
          kind: 'choice',
          prompt: 'Un élève veut supprimer la note d\'`id` 5, mais il écrit seulement `DELETE FROM notes`. Que se passe-t-il ?',
          options: [
            'Seule la note d\'`id` 5 est supprimée',
            'Seule la dernière ligne est supprimée',
            '**Toutes** les lignes de `notes` sont supprimées',
            'Rien : c\'est une erreur',
          ],
          answer: 2,
          explain: 'Sans `WHERE`, rien ne limite la suppression : la table `notes` devient vide (ses colonnes restent). Il fallait `DELETE FROM notes WHERE id = 5`.',
        },
        {
          kind: 'sql',
          prompt: 'Supprimez de la table `notes` toutes les notes **strictement inférieures** à 10.',
          schema: NOTES,
          solution: 'DELETE FROM notes WHERE note < 10',
          hints: ['`DELETE FROM notes WHERE …`', 'La condition : `note < 10`.'],
          explain: 'Deux lignes sont supprimées : le 9 (`id` 3) et le 7 (`id` 5). Le 10 reste, car 10 n\'est pas strictement inférieur à 10. Il reste 6 lignes.',
        },
      ],
    },
    {
      id: 'sql-defi',
      title: 'Défi : les meilleures notes de NSI',
      type: 'defi',
      steps: [
        {
          kind: 'card',
          title: 'Le problème',
          body: [
            'Le professeur de NSI veut la liste des élèves qui ont **au moins 13** en NSI : leur `prenom` et leur `note`, de la meilleure note à la moins bonne.',
            'Les prénoms sont dans `eleves`, les notes dans `notes` : il faudra une **jointure**.',
          ],
          figure: [FIG_ELEVES, FIG_NOTES],
        },
        {
          kind: 'choice',
          prompt: '**Comprendre.** Faites-le à la main avec les deux tables. Quel est le résultat attendu ?',
          figure: [FIG_ELEVES, FIG_NOTES],
          options: [
            'Ines 18, Nadia 15, Lina 13',
            'Nadia 15, Ines 18, Lina 13',
            'Ines 18, Nadia 15, Omar 14, Lina 13',
            'Ines 18, Nadia 15, Lina 13, Omar 10',
          ],
          answer: 0,
          explain: 'Notes de NSI : 15 (élève 1, Nadia), 9 (Yanis), 18 (Ines), 13 (Lina) et 10 (Omar). Au moins 13 : 15, 18 et 13. Triées de la plus grande à la plus petite : Ines, Nadia, Lina. Le 14 d\'Omar est une note de Maths.',
        },
        {
          kind: 'order',
          prompt: '**Découper.** Remettez les étapes de la requête dans l\'ordre. Une étape est en trop.',
          mode: 'text',
          lines: [
            'SELECT : les colonnes eleves.prenom et notes.note',
            'FROM notes JOIN eleves ON notes.eleve_id = eleves.id : recoller chaque note à son élève',
            'WHERE : garder les notes de NSI qui valent au moins 13',
            'ORDER BY : trier par note, de la plus grande à la plus petite (DESC)',
          ],
          distractors: ['ORDER BY : trier les prénoms par ordre alphabétique'],
          explain: 'On veut les notes de la meilleure à la moins bonne : on trie par `notes.note` avec `DESC`, et non par prénom.',
        },
        {
          kind: 'sql',
          prompt: '**Coder.** Écrivez la requête : le `prenom` et la `note` des élèves qui ont au moins 13 en NSI, de la meilleure note à la moins bonne.',
          schema: ELEVES + NOTES,
          solution: "SELECT eleves.prenom, notes.note FROM notes JOIN eleves ON notes.eleve_id = eleves.id WHERE notes.matiere = 'NSI' AND notes.note >= 13 ORDER BY notes.note DESC",
          ordered: true,
          hints: [
            'Partez de la jointure : `SELECT eleves.prenom, notes.note FROM notes JOIN eleves ON notes.eleve_id = eleves.id`.',
            'Deux conditions avec `AND` : `notes.matiere = \'NSI\'` et `notes.note >= 13`. Puis `ORDER BY notes.note DESC` à la fin.',
          ],
          explain: 'Trois lignes : Ines (18), Nadia (15), Lina (13). L\'ordre des morceaux est toujours `SELECT`, `FROM … JOIN … ON`, `WHERE`, puis `ORDER BY`.',
        },
      ],
    },
  ],
};
