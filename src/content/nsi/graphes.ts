import type { Unit } from '../types';

// Le graphe des routeurs, utilisé dans tout le chapitre (dessiné dans les figures « graphe G »).
// Voisins dans l'ordre alphabétique. Largeur depuis A : A, C, E, B, D, F. Profondeur depuis A : A, C, B, D, E, F.
const G = '{"A": ["C", "E"], "B": ["C", "D", "F"], "C": ["A", "B", "E"], "D": ["B", "E"], "E": ["A", "C", "D"], "F": ["B"]}';

// Le parcours en largeur (12 lignes, finit par '\n').
const LARGEUR = 'def largeur(g, depart):\n    vus = [depart]\n    file = [depart]\n    ordre = []\n    while len(file) > 0:\n        s = file.pop(0)\n        ordre.append(s)\n        for v in g[s]:\n            if v not in vus:\n                vus.append(v)\n                file.append(v)\n    return ordre\n';

// La même fonction avec l'erreur de l'étape « bug » : pop() au lieu de pop(0).
const LARGEUR_PILE = LARGEUR.replace('file.pop(0)', 'file.pop()');

export const graphes: Unit = {
  id: 'graphes',
  title: 'Les graphes',
  subtitle: 'sommets, arêtes, parcours',
  chapter: 'Chapitre 6',
  lessons: [
    {
      id: 'graphes-1',
      title: 'Sommets, arêtes et représentations',
      steps: [
        {
          kind: 'card',
          title: 'Un graphe',
          body: [
            'Un **graphe** est fait de points reliés par des traits. Les points sont les **sommets** (rien à voir avec le sommet d\'une pile), et les traits sont les **arêtes**.',
            'Exemple : un réseau de 6 routeurs reliés par des câbles. Deux sommets reliés par une arête sont **voisins** : ici, les voisins de A sont C et E.',
            'Le **degré** d\'un sommet est son nombre de voisins : A a le degré 2, et B a le degré 3 (ses voisins sont C, D et F).',
          ],
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 65, y: 15 }, { id: 'C', x: 35, y: 15 }, { id: 'D', x: 65, y: 85 }, { id: 'E', x: 35, y: 85 }, { id: 'F', x: 90, y: 50 }],
            edges: [['A', 'C'], ['A', 'E'], ['C', 'E'], ['B', 'C'], ['D', 'E'], ['B', 'D'], ['B', 'F']],
            caption: 'Un réseau de 6 routeurs',
          },
          tip: 'Autres exemples : le plan du lycée (les salles reliées par les couloirs), ou le réseau social de la classe (une arête relie deux amis).',
        },
        {
          kind: 'choice',
          prompt: 'Quel est le **degré** du sommet E ?',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 65, y: 15 }, { id: 'C', x: 35, y: 15 }, { id: 'D', x: 65, y: 85 }, { id: 'E', x: 35, y: 85 }, { id: 'F', x: 90, y: 50 }],
            edges: [['A', 'C'], ['A', 'E'], ['C', 'E'], ['B', 'C'], ['D', 'E'], ['B', 'D'], ['B', 'F']],
          },
          options: ['1', '2', '3', '4'],
          answer: 2,
          explain: 'E est relié à A, C et D : il a 3 voisins, donc son degré est 3.',
        },
        {
          kind: 'card',
          title: 'Chemins et cycles',
          body: [
            'Un **chemin** est une suite de sommets où chacun est voisin du suivant : A, C, B, F est un chemin de A à F.',
            'La **longueur** d\'un chemin est son nombre d\'arêtes : A, C, B, F a la longueur 3.',
            'Un **cycle** est un chemin qui revient à son point de départ sans reprendre deux fois la même arête : A, C, E, A est un cycle.',
          ],
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 65, y: 15 }, { id: 'C', x: 35, y: 15 }, { id: 'D', x: 65, y: 85 }, { id: 'E', x: 35, y: 85 }, { id: 'F', x: 90, y: 50 }],
            edges: [['A', 'C'], ['A', 'E'], ['C', 'E'], ['B', 'C'], ['D', 'E'], ['B', 'D'], ['B', 'F']],
          },
          tip: 'Un message envoyé du routeur A au routeur F suit un chemin, de routeur en routeur.',
        },
        {
          kind: 'choice',
          prompt: 'Lequel de ces chemins est un **cycle** ?',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 65, y: 15 }, { id: 'C', x: 35, y: 15 }, { id: 'D', x: 65, y: 85 }, { id: 'E', x: 35, y: 85 }, { id: 'F', x: 90, y: 50 }],
            edges: [['A', 'C'], ['A', 'E'], ['C', 'E'], ['B', 'C'], ['D', 'E'], ['B', 'D'], ['B', 'F']],
          },
          options: ['A, C, B, F', 'C, B, D, E, C', 'B, D, F, B', 'A, E, A'],
          answer: 1,
          explain: 'C, B, D, E, C revient à C en suivant 4 arêtes différentes. A, C, B, F ne revient pas au départ. Dans B, D, F, B, il n\'y a pas d\'arête entre D et F. A, E, A reprend deux fois la même arête.',
        },
        {
          kind: 'card',
          title: 'Graphes orientés et pondérés',
          body: [
            'Dans un graphe **orienté**, chaque trait est une flèche, appelée **arc** : on ne peut la suivre que dans son sens. Exemple : sur un réseau social, « X suit Y » ne veut pas dire que « Y suit X ».',
            'Dans un graphe **pondéré**, chaque arête porte un nombre, son **poids** : une distance, une durée… Sur le 2ᵉ dessin, c\'est le temps en millisecondes entre deux routeurs.',
            'Le **poids d\'un chemin** est la somme des poids de ses arêtes : sur le 2ᵉ dessin, A, C, D pèse 1 + 6 = 7.',
          ],
          figure: [
            {
              kind: 'graph',
              directed: true,
              nodes: [{ id: 'A', x: 10, y: 25 }, { id: 'B', x: 50, y: 10 }, { id: 'C', x: 90, y: 25 }, { id: 'D', x: 70, y: 85 }, { id: 'E', x: 30, y: 85 }],
              edges: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['E', 'A'], ['B', 'E']],
              caption: 'Un graphe orienté',
            },
            {
              kind: 'graph',
              nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 50, y: 10 }, { id: 'C', x: 50, y: 90 }, { id: 'D', x: 90, y: 50 }],
              edges: [['A', 'B', '2'], ['B', 'D', '3'], ['A', 'C', '1'], ['C', 'D', '6'], ['B', 'C', '4']],
              caption: 'Un graphe pondéré',
            },
          ],
        },
        {
          kind: 'choice',
          prompt: 'Dans ce graphe orienté, quel chemin respecte le sens des flèches ?',
          figure: {
            kind: 'graph',
            directed: true,
            nodes: [{ id: 'A', x: 10, y: 25 }, { id: 'B', x: 50, y: 10 }, { id: 'C', x: 90, y: 25 }, { id: 'D', x: 70, y: 85 }, { id: 'E', x: 30, y: 85 }],
            edges: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['E', 'A'], ['B', 'E']],
          },
          options: ['A, E, D', 'B, E, A', 'C, B, A', 'D, C, B'],
          answer: 1,
          explain: 'B → E et E → A sont bien des arcs. Les autres chemins prennent au moins une flèche à l\'envers : par exemple, l\'arc entre A et E va de E vers A, pas de A vers E.',
        },
        {
          kind: 'choice',
          prompt: 'Les poids sont des temps en millisecondes. Quel chemin de A à D est le plus **rapide** (le plus petit poids) ?',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 50, y: 10 }, { id: 'C', x: 50, y: 90 }, { id: 'D', x: 90, y: 50 }],
            edges: [['A', 'B', '2'], ['B', 'D', '3'], ['A', 'C', '1'], ['C', 'D', '6'], ['B', 'C', '4']],
          },
          options: ['A, C, D', 'A, B, D', 'A, C, B, D', 'A, B, C, D'],
          answer: 1,
          explain: 'On additionne : A, C, D pèse 1 + 6 = 7 ; A, B, D pèse 2 + 3 = 5 ; A, C, B, D pèse 1 + 4 + 3 = 8 ; A, B, C, D pèse 2 + 4 + 6 = 12. Le plus léger est A, B, D, même si A, C commence par l\'arête la plus légère.',
        },
        {
          kind: 'card',
          title: 'Représenter un graphe en Python',
          body: [
            'La **liste d\'adjacence** : un dictionnaire qui associe à chaque sommet la liste de ses voisins. Le degré de B est la longueur de sa liste : `len(g["B"])`.',
            'La **matrice d\'adjacence** : un tableau de 0 et de 1, écrit comme une liste de listes. On numérote les sommets : A = 0, B = 1, C = 2, D = 3. La case `m[i][j]` vaut 1 si les sommets i et j sont voisins, et 0 sinon.',
            'Pour un graphe non orienté, la matrice est **symétrique** : `m[i][j]` et `m[j][i]` sont toujours égaux.',
          ],
          code: 'g = {"A": ["B", "C"], "B": ["A", "C", "D"], "C": ["A", "B"], "D": ["B"]}\nprint(g["B"])\nprint(len(g["B"]))\nm = [[0, 1, 1, 0],\n     [1, 0, 1, 1],\n     [1, 1, 0, 0],\n     [0, 1, 0, 0]]\nprint(m[1][3])',
          output: "['A', 'C', 'D']\n3\n1",
          figure: [
            {
              kind: 'graph',
              nodes: [{ id: 'A', x: 15, y: 20 }, { id: 'B', x: 85, y: 20 }, { id: 'C', x: 15, y: 80 }, { id: 'D', x: 85, y: 80 }],
              edges: [['A', 'B'], ['A', 'C'], ['B', 'C'], ['B', 'D']],
            },
            {
              kind: 'table',
              title: 'm',
              columns: ['', 'A (0)', 'B (1)', 'C (2)', 'D (3)'],
              rows: [
                ['A (0)', 0, 1, 1, 0],
                ['B (1)', 1, 0, 1, 1],
                ['C (2)', 1, 1, 0, 0],
                ['D (3)', 0, 1, 0, 0],
              ],
            },
          ],
          tip: '`m[1][3]` : ligne 1 (B), colonne 3 (D). B et D sont voisins, donc la case vaut 1.',
        },
        {
          kind: 'table',
          prompt: 'La liste d\'adjacence d\'un graphe est `{"A": ["C", "D"], "B": ["D"], "C": ["A", "D"], "D": ["A", "B", "C"]}`. Remplissez sa matrice d\'adjacence : 1 si les deux sommets sont voisins, 0 sinon. La ligne de A est donnée.',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 15, y: 20 }, { id: 'C', x: 85, y: 20 }, { id: 'B', x: 15, y: 85 }, { id: 'D', x: 50, y: 85 }],
            edges: [['A', 'C'], ['A', 'D'], ['C', 'D'], ['B', 'D']],
            caption: 'Le même graphe, dessiné',
          },
          columns: ['A', 'B', 'C', 'D'],
          rows: ['A', 'B', 'C', 'D'],
          answer: [
            ['=0', '=0', '=1', '=1'],
            ['0', '=0', '0', '1'],
            ['1', '0', '=0', '1'],
            ['1', '1', '1', '=0'],
          ],
          explain: 'Ligne B : B n\'a qu\'un voisin, D, donc 0, 0, 0, 1. Ligne D : D est voisin de A, B et C, donc 1, 1, 1, 0. La matrice est symétrique : la ligne D se lit aussi dans la colonne D.',
        },
        {
          kind: 'fill',
          prompt: 'Complétez les deux fonctions. `degre(g, s)` renvoie le degré du sommet `s`. `sont_voisins(g, s, t)` renvoie `True` si `t` est un voisin de `s`. Rappel : `x in L` vaut `True` si `x` est dans la liste `L`.',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 15, y: 20 }, { id: 'B', x: 85, y: 20 }, { id: 'C', x: 15, y: 80 }, { id: 'D', x: 85, y: 80 }],
            edges: [['A', 'B'], ['A', 'C'], ['B', 'C'], ['B', 'D']],
          },
          code: 'def degre(g, s):\n    return {{len}}(g[{{s}}])\n\ndef sont_voisins(g, s, t):\n    return t {{in}} g[s]\n\ng = {"A": ["B", "C"], "B": ["A", "C", "D"], "C": ["A", "B"], "D": ["B"]}',
          distractors: ['sum', '"s"', '=='],
          tests: [
            { call: 'degre(g, "B")', expected: '3' },
            { call: 'degre(g, "D")', expected: '1' },
            { call: 'sont_voisins(g, "A", "C")', expected: 'True' },
            { call: 'sont_voisins(g, "A", "D")', expected: 'False' },
          ],
          explain: '`g[s]` est la liste des voisins de `s` (sans guillemets : `s` est une variable). Sa longueur est le degré, et `t in g[s]` teste si `t` en fait partie.',
        },
        {
          kind: 'code',
          prompt: 'Écrivez `degre_matrice(m, i)` qui renvoie le degré du sommet numéro `i` à partir de la matrice d\'adjacence `m` : c\'est le nombre de 1 sur la ligne `i`.',
          figure: [
            {
              kind: 'graph',
              nodes: [{ id: 'A', x: 15, y: 20 }, { id: 'B', x: 85, y: 20 }, { id: 'C', x: 15, y: 80 }, { id: 'D', x: 85, y: 80 }],
              edges: [['A', 'B'], ['A', 'C'], ['B', 'C'], ['B', 'D']],
            },
            {
              kind: 'table',
              title: 'm',
              columns: ['', 'A (0)', 'B (1)', 'C (2)', 'D (3)'],
              rows: [
                ['A (0)', 0, 1, 1, 0],
                ['B (1)', 1, 0, 1, 1],
                ['C (2)', 1, 1, 0, 0],
                ['D (3)', 0, 1, 0, 0],
              ],
            },
          ],
          starter: 'm = [[0, 1, 1, 0],\n     [1, 0, 1, 1],\n     [1, 1, 0, 0],\n     [0, 1, 0, 0]]\n\ndef degre_matrice(m, i):\n    ',
          tests: [
            { call: 'degre_matrice(m, 0)', expected: '2' },
            { call: 'degre_matrice(m, 1)', expected: '3' },
            { call: 'degre_matrice(m, 3)', expected: '1' },
          ],
          solution: 'm = [[0, 1, 1, 0],\n     [1, 0, 1, 1],\n     [1, 1, 0, 0],\n     [0, 1, 0, 0]]\n\ndef degre_matrice(m, i):\n    d = 0\n    for x in m[i]:\n        if x == 1:\n            d = d + 1\n    return d',
          hints: [
            'La ligne `i` est la liste `m[i]`. Parcourez-la avec `for x in m[i]:`.',
            'C\'est un compteur : `d = 0` avant la boucle, `d = d + 1` quand `x == 1`, et `return d` après la boucle.',
          ],
          explain: 'C\'est le même compteur que dans les bases. On pourrait aussi écrire `return sum(m[i])`, puisque la ligne ne contient que des 0 et des 1.',
        },
      ],
    },
    {
      id: 'graphes-2',
      title: 'Parcourir un graphe',
      steps: [
        {
          kind: 'card',
          title: 'Le parcours en largeur',
          body: [
            'Un **parcours** visite tous les sommets que l\'on peut atteindre depuis un sommet de départ. Pour ne pas tourner en rond à cause des cycles, on retient les sommets déjà **vus**.',
            'Parcours en **largeur** : le départ, puis ses voisins, puis les voisins de ses voisins… Il utilise une **file** (FIFO) : on défile un sommet, puis on enfile ses voisins pas encore vus.',
            'Règle de ce chapitre : les voisins sont pris dans l\'**ordre alphabétique**. Depuis A : A, puis C et E, puis B et D, puis F.',
          ],
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 65, y: 15 }, { id: 'C', x: 35, y: 15 }, { id: 'D', x: 65, y: 85 }, { id: 'E', x: 35, y: 85 }, { id: 'F', x: 90, y: 50 }],
            edges: [['A', 'C'], ['A', 'E'], ['C', 'E'], ['B', 'C'], ['D', 'E'], ['B', 'D'], ['B', 'F']],
          },
          tip: 'Le parcours en largeur visite les sommets du plus proche au plus lointain : C et E sont à 1 arête de A, B et D à 2 arêtes, F à 3 arêtes.',
        },
        {
          kind: 'table',
          prompt: 'Déroulez le parcours en largeur depuis A. Au départ, la file contient seulement A. À chaque étape, on défile le premier sommet, puis on enfile ses voisins **pas encore vus**, dans l\'ordre alphabétique. Écrivez la file avec des virgules, comme sur la première ligne.',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 65, y: 15 }, { id: 'C', x: 35, y: 15 }, { id: 'D', x: 65, y: 85 }, { id: 'E', x: 35, y: 85 }, { id: 'F', x: 90, y: 50 }],
            edges: [['A', 'C'], ['A', 'E'], ['C', 'E'], ['B', 'C'], ['D', 'E'], ['B', 'D'], ['B', 'F']],
          },
          columns: ['défilé', 'file'],
          rows: ['étape 1', 'étape 2', 'étape 3', 'étape 4', 'étape 5', 'étape 6'],
          answer: [
            ['=A', '=C, E'],
            ['C', 'E, B'],
            ['E', 'B, D'],
            ['B', 'D, F'],
            ['D', 'F'],
            ['F', '=vide'],
          ],
          explain: 'L\'ordre de visite est l\'ordre des sommets défilés : A, C, E, B, D, F. À l\'étape 2, A et E ne sont pas enfilés : ils ont déjà été vus.',
        },
        {
          kind: 'order',
          prompt: 'Donnez l\'ordre de visite du parcours en **largeur** depuis **D** (voisins dans l\'ordre alphabétique).',
          mode: 'text',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 65, y: 15 }, { id: 'C', x: 35, y: 15 }, { id: 'D', x: 65, y: 85 }, { id: 'E', x: 35, y: 85 }, { id: 'F', x: 90, y: 50 }],
            edges: [['A', 'C'], ['A', 'E'], ['C', 'E'], ['B', 'C'], ['D', 'E'], ['B', 'D'], ['B', 'F']],
          },
          lines: ['D', 'B', 'E', 'C', 'F', 'A'],
          explain: 'D, puis ses voisins B et E. Puis les nouveaux voisins de B : C et F. Puis le nouveau voisin de E : A (C a déjà été vu).',
        },
        {
          kind: 'card',
          title: 'Le parcours en profondeur',
          body: [
            'Parcours en **profondeur** : on avance le plus loin possible, de voisin en voisin. Quand tous les voisins sont déjà vus, on revient en arrière.',
            'Il s\'écrit en **récursif** : visiter s, c\'est noter s comme vu, puis visiter chaque voisin pas encore vu.',
            'Depuis A : A, C, B, D, E. En E, tout est vu : on revient en arrière jusqu\'à B, qui a encore un voisin libre, F.',
          ],
          code: 'g = ' + G + '\n\ndef profondeur(g, s, vus):\n    vus.append(s)\n    for v in g[s]:\n        if v not in vus:\n            profondeur(g, v, vus)\n    return vus\n\nprint(profondeur(g, "A", []))',
          output: "['A', 'C', 'B', 'D', 'E', 'F']",
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 65, y: 15 }, { id: 'C', x: 35, y: 15 }, { id: 'D', x: 65, y: 85 }, { id: 'E', x: 35, y: 85 }, { id: 'F', x: 90, y: 50 }],
            edges: [['A', 'C'], ['A', 'E'], ['C', 'E'], ['B', 'C'], ['D', 'E'], ['B', 'D'], ['B', 'F']],
          },
        },
        {
          kind: 'order',
          prompt: 'Donnez l\'ordre de visite du parcours en **profondeur** depuis **D** (voisins dans l\'ordre alphabétique).',
          mode: 'text',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 65, y: 15 }, { id: 'C', x: 35, y: 15 }, { id: 'D', x: 65, y: 85 }, { id: 'E', x: 35, y: 85 }, { id: 'F', x: 90, y: 50 }],
            edges: [['A', 'C'], ['A', 'E'], ['C', 'E'], ['B', 'C'], ['D', 'E'], ['B', 'D'], ['B', 'F']],
          },
          lines: ['D', 'B', 'C', 'A', 'E', 'F'],
          explain: 'D → B → C → A → E : on s\'enfonce tant qu\'il y a un voisin pas encore vu. En E, tout est vu : on revient en arrière (A, puis C, puis B). B a encore un voisin libre : F.',
        },
        {
          kind: 'choice',
          prompt: 'Pourquoi les parcours retiennent-ils les sommets déjà **vus** ?',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 65, y: 15 }, { id: 'C', x: 35, y: 15 }, { id: 'D', x: 65, y: 85 }, { id: 'E', x: 35, y: 85 }, { id: 'F', x: 90, y: 50 }],
            edges: [['A', 'C'], ['A', 'E'], ['C', 'E'], ['B', 'C'], ['D', 'E'], ['B', 'D'], ['B', 'F']],
          },
          options: [
            'Pour ranger les sommets dans l\'ordre alphabétique',
            'Pour ne pas visiter deux fois le même sommet, et ne pas tourner en rond dans un cycle',
            'Pour compter les arêtes du graphe',
            'Pour aller plus vite vers les sommets lointains',
          ],
          answer: 1,
          explain: 'Sans les sommets vus, depuis A on irait en C, puis de C on reviendrait en A, puis encore en C… à cause du cycle A, C, E, A. Le parcours ne s\'arrêterait jamais.',
        },
        {
          kind: 'demo',
          title: 'Le parcours en largeur en Python',
          body: '`file` est une liste utilisée comme file : `append` pour enfiler, `pop(0)` pour défiler. `vus` retient les sommets déjà enfilés, et `ordre` les sommets dans l\'ordre de visite. Suivez la file et comparez avec votre tableau.',
          code: 'g = ' + G + '\n\n' + LARGEUR + '\nprint(largeur(g, "A"))',
        },
        {
          kind: 'fill',
          prompt: 'Complétez le parcours en largeur. Il renvoie la liste des sommets dans l\'ordre de visite.',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 65, y: 15 }, { id: 'C', x: 35, y: 15 }, { id: 'D', x: 65, y: 85 }, { id: 'E', x: 35, y: 85 }, { id: 'F', x: 90, y: 50 }],
            edges: [['A', 'C'], ['A', 'E'], ['C', 'E'], ['B', 'C'], ['D', 'E'], ['B', 'D'], ['B', 'F']],
          },
          code: 'g = ' + G + '\n\ndef largeur(g, depart):\n    vus = [depart]\n    file = [depart]\n    ordre = []\n    while len(file) > 0:\n        s = file.{{pop(0)}}\n        ordre.append(s)\n        for v in g[s]:\n            if v {{not in}} vus:\n                vus.append(v)\n                file.{{append}}(v)\n    return ordre',
          distractors: ['pop()', 'in', 'remove'],
          tests: [
            { call: 'largeur(g, "A")', expected: "['A', 'C', 'E', 'B', 'D', 'F']" },
            { call: 'largeur(g, "F")', expected: "['F', 'B', 'C', 'D', 'A', 'E']" },
          ],
          explain: '`pop(0)` défile le **premier** sommet : c\'est ce qui fait une file. `not in vus` évite d\'enfiler deux fois le même sommet.',
        },
        {
          kind: 'bug',
          prompt: 'Ce parcours devrait être en **largeur**, mais depuis A il donne A, E, D, B, F, C. Touchez la ligne fautive.',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 50 }, { id: 'B', x: 65, y: 15 }, { id: 'C', x: 35, y: 15 }, { id: 'D', x: 65, y: 85 }, { id: 'E', x: 35, y: 85 }, { id: 'F', x: 90, y: 50 }],
            edges: [['A', 'C'], ['A', 'E'], ['C', 'E'], ['B', 'C'], ['D', 'E'], ['B', 'D'], ['B', 'F']],
          },
          code: 'g = ' + G + '\n\n' + LARGEUR_PILE + '\nprint(largeur(g, "A"))',
          line: 8,
          fixed: 'g = ' + G + '\n\n' + LARGEUR + '\nprint(largeur(g, "A"))',
          output: "['A', 'C', 'E', 'B', 'D', 'F']",
          explain: '`pop()` retire le **dernier** sommet enfilé : la liste sert de pile, et non de file. Avec `pop(0)`, on retire le premier : c\'est bien une file, et on obtient le parcours en largeur.',
        },
        {
          kind: 'code',
          prompt: 'Deux réseaux de routeurs ne sont pas reliés entre eux. Écrivez `existe_chemin(g, s, t)` qui renvoie `True` s\'il existe un chemin de `s` à `t`, et `False` sinon. La fonction `largeur` est déjà écrite : utilisez-la.',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 25 }, { id: 'B', x: 45, y: 25 }, { id: 'C', x: 80, y: 25 }, { id: 'D', x: 25, y: 80 }, { id: 'E', x: 70, y: 80 }],
            edges: [['A', 'B'], ['B', 'C'], ['D', 'E']],
            caption: 'reseau',
          },
          starter: LARGEUR + '\nreseau = {"A": ["B"], "B": ["A", "C"], "C": ["B"], "D": ["E"], "E": ["D"]}\n\ndef existe_chemin(g, s, t):\n    ',
          tests: [
            { call: 'existe_chemin(reseau, "A", "C")', expected: 'True' },
            { call: 'existe_chemin(reseau, "A", "E")', expected: 'False' },
            { call: 'existe_chemin(reseau, "E", "D")', expected: 'True' },
          ],
          solution: LARGEUR + '\nreseau = {"A": ["B"], "B": ["A", "C"], "C": ["B"], "D": ["E"], "E": ["D"]}\n\ndef existe_chemin(g, s, t):\n    return t in largeur(g, s)',
          hints: [
            'Il existe un chemin de `s` à `t` si le parcours depuis `s` **visite** `t`.',
            '`largeur(g, s)` renvoie la liste des sommets visités. `t in ...` teste si `t` est dedans.',
          ],
          explain: 'Un parcours depuis `s` visite **tous** les sommets que l\'on peut atteindre depuis `s`, et seulement eux. Depuis A, on visite A, B et C, mais jamais D ni E.',
        },
      ],
    },
    {
      id: 'graphes-defi',
      title: 'Défi : l\'élève le plus connecté',
      type: 'defi',
      steps: [
        {
          kind: 'card',
          title: 'Le problème',
          body: [
            'Le réseau social de la classe est un graphe : chaque sommet est un élève, et une arête relie deux amis. On cherche l\'élève qui a **le plus d\'amis** : le sommet de plus grand degré.',
            'Écrire `sommet_max_degre(g)` qui renvoie ce sommet. `g` est une liste d\'adjacence (un dictionnaire). En cas d\'égalité, on garde le **premier** rencontré.',
            'Rappel : `for s in g:` parcourt les **clés** du dictionnaire (les sommets), dans l\'ordre où elles sont écrites. Le degré de `s` est `len(g[s])`.',
          ],
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 20 }, { id: 'B', x: 35, y: 60 }, { id: 'C', x: 10, y: 90 }, { id: 'D', x: 50, y: 10 }, { id: 'E', x: 70, y: 55 }, { id: 'F', x: 92, y: 85 }],
            edges: [['A', 'B'], ['A', 'D'], ['B', 'C'], ['B', 'D'], ['B', 'E'], ['D', 'E'], ['E', 'F']],
            caption: 'Le réseau social de la classe',
          },
        },
        {
          kind: 'choice',
          prompt: '**Comprendre.** On regarde les sommets dans l\'ordre A, B, C, D, E, F, en retenant celui qui a le plus grand degré vu jusqu\'ici. Que retient-on à la fin ?',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 20 }, { id: 'B', x: 35, y: 60 }, { id: 'C', x: 10, y: 90 }, { id: 'D', x: 50, y: 10 }, { id: 'E', x: 70, y: 55 }, { id: 'F', x: 92, y: 85 }],
            edges: [['A', 'B'], ['A', 'D'], ['B', 'C'], ['B', 'D'], ['B', 'E'], ['D', 'E'], ['E', 'F']],
          },
          options: ['A', 'B', 'D', 'E'],
          answer: 1,
          explain: 'A a le degré 2 : on retient A. B a le degré 4 (A, C, D, E) : on retient B. Ensuite C (1), D (3), E (3) et F (1) ne dépassent pas 4 : on garde B.',
        },
        {
          kind: 'order',
          prompt: '**Découper.** Remettez les étapes dans l\'ordre. Une étape est en trop.',
          mode: 'text',
          lines: [
            'Partir de meilleur = None et dmax = -1 (plus petit que tous les degrés)',
            'Pour chaque sommet s du dictionnaire :',
            'calculer d, le degré de s (la longueur de sa liste de voisins)',
            'si d est plus grand que dmax : dmax devient d, et meilleur devient s',
            'Après la boucle : renvoyer meilleur',
          ],
          distractors: ['si d est plus grand que dmax : renvoyer s'],
          explain: 'C\'est le schéma du maximum, vu dans les bases. On ne renvoie le résultat qu\'**après** la boucle, quand tous les sommets ont été vus. On teste « plus grand » (et pas « plus grand ou égal ») pour garder le premier en cas d\'égalité.',
        },
        {
          kind: 'code',
          prompt: '**Coder.** Écrivez `sommet_max_degre(g)`. Le dictionnaire `classe` décrit le graphe du dessin.',
          figure: {
            kind: 'graph',
            nodes: [{ id: 'A', x: 10, y: 20 }, { id: 'B', x: 35, y: 60 }, { id: 'C', x: 10, y: 90 }, { id: 'D', x: 50, y: 10 }, { id: 'E', x: 70, y: 55 }, { id: 'F', x: 92, y: 85 }],
            edges: [['A', 'B'], ['A', 'D'], ['B', 'C'], ['B', 'D'], ['B', 'E'], ['D', 'E'], ['E', 'F']],
          },
          starter: 'classe = {"A": ["B", "D"], "B": ["A", "C", "D", "E"], "C": ["B"], "D": ["A", "B", "E"], "E": ["B", "D", "F"], "F": ["E"]}\n\ndef sommet_max_degre(g):\n    ',
          tests: [
            { call: 'sommet_max_degre(classe)', expected: "'B'" },
            { call: 'sommet_max_degre({"P": ["Q"], "Q": ["P", "R"], "R": ["Q"]})', expected: "'Q'" },
            { call: 'sommet_max_degre({"X": ["Y", "Z"], "Y": ["X", "Z"], "Z": ["X", "Y"]})', expected: "'X'" },
          ],
          solution: 'classe = {"A": ["B", "D"], "B": ["A", "C", "D", "E"], "C": ["B"], "D": ["A", "B", "E"], "E": ["B", "D", "F"], "F": ["E"]}\n\ndef sommet_max_degre(g):\n    meilleur = None\n    dmax = -1\n    for s in g:\n        d = len(g[s])\n        if d > dmax:\n            dmax = d\n            meilleur = s\n    return meilleur',
          hints: [
            'Commencez par `meilleur = None` et `dmax = -1`, puis `for s in g:`.',
            'Dans la boucle : `d = len(g[s])`, puis `if d > dmax:` avec deux lignes décalées dessous.',
            '`return meilleur` est aligné avec le `for`.',
          ],
          explain: 'Le dernier test (X, Y et Z ont tous le degré 2) vérifie l\'égalité : avec `>=` au lieu de `>`, la fonction renverrait le dernier, Z, au lieu du premier, X.',
        },
      ],
    },
  ],
};
