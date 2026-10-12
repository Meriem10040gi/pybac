import type { Unit } from '../types';

// Morceaux de code repris dans plusieurs étapes. Chacun finit par '\n' ; le code qui suit commence par '\n'
// (ligne vide).
const NOEUD = 'class Noeud:\n    def __init__(self, valeur, gauche, droit):\n        self.valeur = valeur\n        self.gauche = gauche\n        self.droit = droit\n';

// L'arbre du début du chapitre : [8, [3, [1], [6]], [10, null, [14]]].
const CONSTRUIT_A = 'f1 = Noeud(1, None, None)\nf6 = Noeud(6, None, None)\nf14 = Noeud(14, None, None)\na = Noeud(8, Noeud(3, f1, f6), Noeud(10, None, f14))\n';
const EXEMPLE_A = 'def exemple():\n    f1 = Noeud(1, None, None)\n    f6 = Noeud(6, None, None)\n    f14 = Noeud(14, None, None)\n    return Noeud(8, Noeud(3, f1, f6), Noeud(10, None, f14))\n';

// L'ABR de la leçon 2 : [8, [3, [1], [6, [4], [7]]], [10, null, [14]]].
const EXEMPLE_ABR = 'def exemple():\n    f1 = Noeud(1, None, None)\n    f4 = Noeud(4, None, None)\n    f7 = Noeud(7, None, None)\n    f14 = Noeud(14, None, None)\n    return Noeud(8, Noeud(3, f1, Noeud(6, f4, f7)), Noeud(10, None, f14))\n';

// L'arbre du défi : [6, [2, null, [4, [3], [5]]], [8, [7], [9]]] (4 feuilles : 3, 5, 7, 9).
const EXEMPLE_DEFI = 'def exemple():\n    f3 = Noeud(3, None, None)\n    f5 = Noeud(5, None, None)\n    f7 = Noeud(7, None, None)\n    f9 = Noeud(9, None, None)\n    return Noeud(6, Noeud(2, None, Noeud(4, f3, f5)), Noeud(8, f7, f9))\n';

export const arbres: Unit = {
  id: 'arbres',
  title: 'Les arbres',
  subtitle: 'arbres binaires, parcours, arbres de recherche',
  chapter: 'Chapitre 5',
  lessons: [
    {
      id: 'arbres-1',
      title: 'Les arbres binaires',
      steps: [
        {
          kind: 'card',
          title: 'Un arbre',
          body: [
            'Un **arbre** range des valeurs en branches, comme les dossiers et sous-dossiers d\'un ordinateur. Chaque rond du dessin est un **nœud** : il contient une valeur.',
            'Le nœud du haut est la **racine** (ici 8). Les nœuds reliés juste sous un nœud sont ses **fils**, et lui est leur **père** : 3 et 10 sont les fils de 8. Un nœud sans fils est une **feuille** : ici 1, 6 et 14.',
            'Dans un **arbre binaire**, chaque nœud a au plus deux fils : un **fils gauche** et un **fils droit**. Ici, 10 n\'a qu\'un fils droit, 14.',
          ],
          figure: { kind: 'tree', tree: [8, [3, [1], [6]], [10, null, [14]]] },
          tip: 'En informatique, on dessine les arbres à l\'envers : la racine en haut, les feuilles en bas.',
        },
        {
          kind: 'choice',
          prompt: 'Quelles sont les **feuilles** de cet arbre ?',
          figure: { kind: 'tree', tree: [5, [2, [7]], [9, [4], [6, null, [3]]]] },
          options: ['5', '2, 9 et 6', '7, 4 et 3', '7, 4, 6 et 3'],
          answer: 2,
          explain: '7, 4 et 3 n\'ont aucun fils. 6 n\'est pas une feuille : il a un fils droit, 3. De même, 2 a un fils gauche, 7.',
        },
        {
          kind: 'card',
          title: 'Sous-arbres, taille et hauteur',
          body: [
            'Le **sous-arbre gauche** d\'un nœud, c\'est son fils gauche avec tout ce qui est en dessous de lui. Pareil à droite avec le **sous-arbre droit**. Ici, le sous-arbre gauche de 8 contient 3, 1 et 6.',
            'La **taille** d\'un arbre est son nombre de nœuds : ici 6. L\'**arbre vide** n\'a aucun nœud : sa taille est 0.',
            'La **hauteur** est le nombre de nœuds du plus long chemin qui descend de la racine à une feuille : ici 3 (par exemple 8, 3, 1). Dans ce cours, un arbre d\'un seul nœud a la hauteur 1, et l\'arbre vide la hauteur 0.',
          ],
          figure: { kind: 'tree', tree: [8, [3, [1], [6]], [10, null, [14]]] },
          tip: 'Attention : certains sujets du bac comptent autrement (un seul nœud : hauteur 0). Le sujet dit toujours quelle convention il utilise : lisez-le bien.',
        },
        {
          kind: 'choice',
          prompt: 'Quels nœuds forment le **sous-arbre droit** de la racine ?',
          figure: { kind: 'tree', tree: [5, [2, [7]], [9, [4], [6, null, [3]]]] },
          options: ['9', '9, 4 et 6', '9, 4, 6 et 3', '2 et 7'],
          answer: 2,
          explain: 'Le sous-arbre droit de 5, c\'est son fils droit 9 avec **tout** ce qui est en dessous : 4, 6 et 3. Il a 4 nœuds.',
        },
        {
          kind: 'choice',
          prompt: 'Quelle est la **taille** de cet arbre ?',
          figure: { kind: 'tree', tree: [5, [2, [7]], [9, [4], [6, null, [3]]]] },
          options: ['7', '4', '6', '3'],
          answer: 0,
          explain: 'On compte tous les nœuds : 5, 2, 7, 9, 4, 6 et 3. Cela fait 7.',
        },
        {
          kind: 'choice',
          prompt: 'Quelle est la **hauteur** de cet arbre ? (Rappel : un seul nœud a la hauteur 1.)',
          figure: { kind: 'tree', tree: [5, [2, [7]], [9, [4], [6, null, [3]]]] },
          options: ['3', '4', '5', '7'],
          answer: 1,
          explain: 'Le plus long chemin de la racine à une feuille est 5, 9, 6, 3 : il a 4 nœuds. Avec l\'autre convention (on compte les traits entre les nœuds), on trouverait 3.',
        },
        {
          kind: 'card',
          title: 'La classe Noeud',
          body: [
            'En Python, un nœud est un objet de la classe `Noeud`, avec trois attributs : `valeur`, `gauche` (le sous-arbre gauche) et `droit` (le sous-arbre droit).',
            'L\'arbre vide s\'écrit `None`. Une feuille a donc `None` à gauche et à droite : `Noeud(1, None, None)`.',
            'On construit l\'arbre en partant du bas, comme les maillons d\'une liste chaînée. La variable `a` désigne la racine.',
          ],
          code: NOEUD + '\n' + CONSTRUIT_A + 'print(a.valeur)\nprint(a.gauche.valeur)\nprint(a.droit.droit.valeur)',
          output: '8\n3\n14',
          figure: { kind: 'tree', tree: [8, [3, [1], [6]], [10, null, [14]]] },
        },
        {
          kind: 'choice',
          prompt: 'Avec le même arbre `a`, qu\'affiche ce programme ?',
          code: NOEUD + '\n' + CONSTRUIT_A + 'print(a.gauche.droit.valeur)\nprint(a.droit.gauche)',
          figure: { kind: 'tree', tree: [8, [3, [1], [6]], [10, null, [14]]] },
          options: ['1\n14', '6\nNone', '6\n14', '1\nNone'],
          answer: 1,
          mono: true,
          explain: '`a.gauche` est le nœud 3, et son fils droit est 6. `a.droit` est le nœud 10, qui n\'a pas de fils gauche : `a.droit.gauche` vaut `None`, l\'arbre vide.',
        },
        {
          kind: 'demo',
          title: 'La taille, par récursivité',
          body: 'Rappel : une fonction **récursive** s\'appelle elle-même. **Cas de base** : l\'arbre vide (`None`) a 0 nœud. Sinon, la taille vaut 1 (la racine) + la taille du sous-arbre gauche + la taille du sous-arbre droit. Suivez les appels sur un arbre de 3 nœuds.',
          code: NOEUD + '\ndef taille(a):\n    if a is None:\n        return 0\n    return 1 + taille(a.gauche) + taille(a.droit)\n\na = Noeud(5, Noeud(2, None, None), Noeud(9, None, None))\nprint(taille(a))',
        },
        {
          kind: 'fill',
          prompt: 'Complétez `hauteur(a)`. Même idée que `taille` : l\'arbre vide a la hauteur 0 ; sinon, c\'est 1 (la racine) + la **plus grande** des hauteurs des deux sous-arbres.',
          code: NOEUD + '\ndef hauteur(a):\n    if a is None:\n        return {{0}}\n    hg = hauteur(a.{{gauche}})\n    hd = hauteur(a.{{droit}})\n    return 1 + {{max}}(hg, hd)',
          distractors: ['1', 'min', 'valeur'],
          tests: [
            { call: 'hauteur(None)', expected: '0' },
            { call: 'hauteur(Noeud(7, None, None))', expected: '1' },
            { call: 'hauteur(Noeud(5, Noeud(2, Noeud(7, None, None), None), Noeud(9, None, None)))', expected: '3' },
          ],
          figure: { kind: 'tree', tree: [5, [2, [7]], [9]], caption: 'L\'arbre du dernier test : sa hauteur est 3.' },
          explain: '`max(hg, hd)` garde la plus grande des deux hauteurs : la hauteur suit la branche la plus **longue**. Avec `min`, on suivrait la plus courte.',
        },
        {
          kind: 'code',
          prompt: 'Écrivez `somme(a)` qui renvoie la somme des valeurs de l\'arbre `a`. La fonction `exemple()` construit l\'arbre du dessin. L\'arbre vide a une somme égale à 0.',
          figure: { kind: 'tree', tree: [8, [3, [1], [6]], [10, null, [14]]] },
          starter: NOEUD + '\n' + EXEMPLE_A + '\ndef somme(a):\n    ',
          tests: [
            { call: 'somme(exemple())', expected: '42' },
            { call: 'somme(None)', expected: '0' },
            { call: 'somme(Noeud(7, None, None))', expected: '7' },
          ],
          solution: NOEUD + '\n' + EXEMPLE_A + '\ndef somme(a):\n    if a is None:\n        return 0\n    return a.valeur + somme(a.gauche) + somme(a.droit)',
          hints: [
            'Même schéma que `taille` : d\'abord `if a is None:` puis `return 0`.',
            'Au lieu de compter 1 pour la racine, on ajoute sa valeur : `return a.valeur + somme(a.gauche) + somme(a.droit)`.',
          ],
          explain: 'Pour l\'arbre du dessin : 8 + (3 + 1 + 6) + (10 + 14) = 8 + 10 + 24 = 42. Chaque appel récursif s\'occupe d\'un sous-arbre plus petit, jusqu\'à l\'arbre vide.',
        },
      ],
    },
    {
      id: 'arbres-2',
      title: 'Parcours et arbres de recherche',
      steps: [
        {
          kind: 'card',
          title: 'Parcourir en profondeur',
          body: [
            'Un **parcours** visite tous les nœuds, un par un. En **profondeur**, on descend tout en bas d\'une branche avant de passer à la suivante, toujours la gauche avant la droite.',
            'Il y a trois ordres, selon le moment où l\'on note la racine. **Préfixe** : racine, sous-arbre gauche, sous-arbre droit. **Infixe** : gauche, racine, droit. **Suffixe** : gauche, droit, racine.',
            'Sur cet arbre : préfixe 8, 3, 1, 6, 10, 14. Infixe 1, 3, 6, 8, 10, 14. Suffixe 1, 6, 3, 14, 10, 8.',
          ],
          figure: { kind: 'tree', tree: [8, [3, [1], [6]], [10, null, [14]]] },
          tip: 'Pour retenir : **pré** = avant (la racine d\'abord), **in** = au milieu, **suf** = après (la racine à la fin). Chaque sous-arbre est parcouru de la même façon : c\'est récursif.',
        },
        {
          kind: 'order',
          prompt: 'Donnez le parcours **préfixe** de cet arbre (racine, gauche, droit). Touchez les nœuds dans l\'ordre de visite.',
          mode: 'text',
          figure: { kind: 'tree', tree: [5, [9, [2], [7]], [4, null, [6]]] },
          lines: ['5', '9', '2', '7', '4', '6'],
          explain: 'D\'abord la racine 5. Puis tout le sous-arbre gauche, lui aussi en préfixe : 9, 2, 7. Puis le sous-arbre droit : 4, 6.',
        },
        {
          kind: 'choice',
          prompt: 'Quel est le parcours **suffixe** de cet arbre (gauche, droit, racine) ?',
          figure: { kind: 'tree', tree: [5, [9, [2], [7]], [4, null, [6]]] },
          options: ['5, 9, 2, 7, 4, 6', '2, 9, 7, 5, 4, 6', '2, 7, 9, 6, 4, 5', '2, 7, 9, 4, 6, 5'],
          answer: 2,
          explain: 'Le sous-arbre gauche en suffixe : 2, 7, puis 9. Le sous-arbre droit : 6, puis 4. Et la racine 5 **à la fin**. Le 2ᵉ choix est le parcours infixe.',
        },
        {
          kind: 'fill',
          prompt: 'Complétez `prefixe(a)`, qui renvoie la **liste** des valeurs dans l\'ordre préfixe. Rappel : `+` met deux listes bout à bout, `[1] + [2, 3]` donne `[1, 2, 3]`.',
          figure: { kind: 'tree', tree: [5, [9, [2], [7]], [4, null, [6]]] },
          code: NOEUD + '\ndef prefixe(a):\n    if a is None:\n        return {{[]}}\n    return {{[a.valeur]}} + {{prefixe(a.gauche)}} + {{prefixe(a.droit)}}',
          distractors: ['0', 'a.valeur', 'None'],
          tests: [
            { call: 'prefixe(None)', expected: '[]' },
            { call: 'prefixe(Noeud(5, Noeud(9, Noeud(2, None, None), Noeud(7, None, None)), Noeud(4, None, Noeud(6, None, None))))', expected: '[5, 9, 2, 7, 4, 6]' },
          ],
          explain: 'L\'arbre vide donne la liste vide `[]`. Sinon : la racine d\'abord (`[a.valeur]`, entre crochets pour en faire une liste), puis le préfixe du sous-arbre gauche, puis celui du sous-arbre droit.',
        },
        {
          kind: 'card',
          title: 'Parcourir en largeur',
          body: [
            'Le parcours en **largeur** visite l\'arbre **niveau par niveau**. Un **niveau**, ce sont les nœuds situés à la même distance de la racine. On lit chaque niveau de gauche à droite.',
            'On le programme avec une **file** (FIFO) : on enfile la racine. Puis, tant que la file n\'est pas vide, on défile un nœud, on le note, et on enfile ses fils (le gauche, puis le droit).',
            'Sur cet arbre : 8 ; puis 3, 10 ; puis 1, 6, 14.',
          ],
          figure: { kind: 'tree', tree: [8, [3, [1], [6]], [10, null, [14]]] },
          tip: 'Les parcours en profondeur utilisent eux aussi une structure, sans qu\'on la voie : la pile des appels récursifs. Le parcours en largeur, lui, a besoin d\'une file.',
        },
        {
          kind: 'order',
          prompt: 'Donnez le parcours en **largeur** de cet arbre (niveau par niveau, de gauche à droite).',
          mode: 'text',
          figure: { kind: 'tree', tree: [5, [9, [2], [7]], [4, null, [6]]] },
          lines: ['5', '9', '4', '2', '7', '6'],
          explain: 'Premier niveau : la racine 5. Niveau suivant : 9 puis 4. Dernier niveau : 2 et 7 (les fils de 9), puis 6 (le fils de 4).',
        },
        {
          kind: 'card',
          title: 'Arbre binaire de recherche',
          body: [
            'Un **arbre binaire de recherche** (**ABR**) est un arbre binaire où, pour **chaque** nœud, les valeurs du sous-arbre gauche sont **plus petites** que lui, et celles du sous-arbre droit sont **plus grandes**.',
            '**Chercher** une valeur v : on part de la racine. Si v est plus petite que le nœud, on descend à gauche ; si elle est plus grande, à droite ; si elle est égale, on a trouvé. Si on arrive sur l\'arbre vide, v n\'est pas dans l\'arbre.',
            '**Insérer** une valeur : on descend de la même façon jusqu\'à une place vide, et on y accroche une nouvelle feuille.',
          ],
          figure: { kind: 'tree', tree: [8, [3, [1], [6, [4], [7]]], [10, null, [14]]] },
          tip: 'On ne suit qu\'**un** chemin, sans regarder tout l\'arbre : la recherche est beaucoup plus rapide que dans une liste en désordre.',
        },
        {
          kind: 'choice',
          prompt: 'On cherche 7 dans cet ABR. Combien de nœuds regarde-t-on, en comptant celui qui contient 7 ?',
          figure: { kind: 'tree', tree: [8, [3, [1], [6, [4], [7]]], [10, null, [14]]] },
          options: ['2', '3', '4', '8'],
          answer: 2,
          explain: '8 : 7 est plus petit, on va à gauche. 3 : 7 est plus grand, on va à droite. 6 : plus grand, à droite. 7 : trouvé ! On a regardé 4 nœuds sur 8.',
        },
        {
          kind: 'choice',
          prompt: 'On part d\'un ABR vide et on insère, dans cet ordre : 5, 3, 8, 1, 4. Quel arbre obtient-on ?',
          figure: [
            { kind: 'tree', tree: [5, [3, [4], [1]], [8]], caption: 'Arbre 1' },
            { kind: 'tree', tree: [5, [3, [1], [4]], [8]], caption: 'Arbre 2' },
            { kind: 'tree', tree: [5, [3, [1]], [8, [4]]], caption: 'Arbre 3' },
          ],
          options: ['Arbre 1', 'Arbre 2', 'Arbre 3'],
          answer: 1,
          explain: '5 devient la racine. 3 < 5 : à gauche. 8 > 5 : à droite. 1 < 5 puis 1 < 3 : à gauche de 3. 4 < 5 puis 4 > 3 : à droite de 3. L\'arbre 1 n\'est pas un ABR (1 et 4 sont inversés) ; dans l\'arbre 3, 4 est à droite de 5 alors qu\'il est plus petit.',
        },
        {
          kind: 'order',
          prompt: 'Donnez le parcours **infixe** de cet ABR (gauche, racine, droit). Regardez bien le résultat.',
          mode: 'text',
          figure: { kind: 'tree', tree: [8, [3, [1], [6, [4], [7]]], [10, null, [14]]] },
          lines: ['1', '3', '4', '6', '7', '8', '10', '14'],
          explain: 'Les valeurs sortent **triées** dans l\'ordre croissant ! C\'est vrai pour tout ABR : d\'abord le sous-arbre gauche (les plus petites), puis le nœud, puis le sous-arbre droit (les plus grandes).',
        },
        {
          kind: 'code',
          prompt: 'Écrivez `infixe(a)`, qui renvoie la liste des valeurs dans l\'ordre infixe. La fonction `exemple()` construit l\'ABR du dessin : la liste obtenue doit être triée.',
          figure: { kind: 'tree', tree: [8, [3, [1], [6, [4], [7]]], [10, null, [14]]] },
          starter: NOEUD + '\n' + EXEMPLE_ABR + '\ndef infixe(a):\n    ',
          tests: [
            { call: 'infixe(exemple())', expected: '[1, 3, 4, 6, 7, 8, 10, 14]' },
            { call: 'infixe(None)', expected: '[]' },
            { call: 'infixe(Noeud(5, Noeud(2, None, None), None))', expected: '[2, 5]' },
          ],
          solution: NOEUD + '\n' + EXEMPLE_ABR + '\ndef infixe(a):\n    if a is None:\n        return []\n    return infixe(a.gauche) + [a.valeur] + infixe(a.droit)',
          hints: [
            'Reprenez l\'idée de `prefixe` : `if a is None:` puis `return []`.',
            'Seul l\'ordre change : `infixe(a.gauche) + [a.valeur] + infixe(a.droit)`.',
          ],
          explain: 'La racine est au **milieu** : d\'abord toutes les valeurs plus petites (à gauche), puis la racine, puis les plus grandes. C\'est pour cela que le résultat est trié.',
        },
      ],
    },
    {
      id: 'arbres-defi',
      title: 'Défi : compter les feuilles',
      type: 'defi',
      steps: [
        {
          kind: 'card',
          title: 'Le problème',
          body: [
            'Écrire `nb_feuilles(a)` qui renvoie le nombre de **feuilles** de l\'arbre `a`. Rappel : une feuille est un nœud sans fils, avec `None` à gauche **et** à droite.',
            'Idée : comme pour `taille`, on découpe en sous-arbres. Mais il y a **deux** cas de base : l\'arbre vide (0 feuille) et la feuille elle-même (1 feuille).',
          ],
          figure: { kind: 'tree', tree: [8, [3, [1], [6]], [10, null, [14]]], caption: 'Cet arbre a 3 feuilles : 1, 6 et 14.' },
        },
        {
          kind: 'choice',
          prompt: '**Comprendre.** Combien de feuilles a cet arbre ?',
          figure: { kind: 'tree', tree: [6, [2, null, [4, [3], [5]]], [8, [7], [9]]] },
          options: ['3', '4', '5', '8'],
          answer: 1,
          explain: '3, 5, 7 et 9 n\'ont aucun fils : ce sont les 4 feuilles. 2 n\'est pas une feuille : il a un fils droit, 4.',
        },
        {
          kind: 'order',
          prompt: '**Découper.** Remettez les étapes dans l\'ordre. Une étape est en trop.',
          mode: 'text',
          lines: [
            'Si l\'arbre est vide (None) : renvoyer 0',
            'Si le nœud n\'a ni fils gauche ni fils droit : renvoyer 1',
            'Sinon : renvoyer les feuilles du sous-arbre gauche + les feuilles du sous-arbre droit',
          ],
          distractors: ['Sinon : renvoyer 1 + les feuilles du sous-arbre gauche + les feuilles du sous-arbre droit'],
          explain: 'L\'ordre des deux cas de base compte : il faut d\'abord vérifier que `a` n\'est pas `None`, sinon `a.gauche` provoque une erreur. Et dans le cas général, on n\'ajoute pas 1 : un nœud qui a des fils n\'est pas une feuille.',
        },
        {
          kind: 'code',
          prompt: '**Coder.** Écrivez `nb_feuilles(a)`. La fonction `exemple()` construit l\'arbre du dessin.',
          figure: { kind: 'tree', tree: [6, [2, null, [4, [3], [5]]], [8, [7], [9]]] },
          starter: NOEUD + '\n' + EXEMPLE_DEFI + '\ndef nb_feuilles(a):\n    ',
          tests: [
            { call: 'nb_feuilles(exemple())', expected: '4' },
            { call: 'nb_feuilles(None)', expected: '0' },
            { call: 'nb_feuilles(Noeud(1, None, None))', expected: '1' },
            { call: 'nb_feuilles(Noeud(5, Noeud(2, None, None), None))', expected: '1' },
          ],
          solution: NOEUD + '\n' + EXEMPLE_DEFI + '\ndef nb_feuilles(a):\n    if a is None:\n        return 0\n    if a.gauche is None and a.droit is None:\n        return 1\n    return nb_feuilles(a.gauche) + nb_feuilles(a.droit)',
          hints: [
            'Premier cas de base : `if a is None:` puis `return 0`.',
            'Deuxième cas de base : `if a.gauche is None and a.droit is None:` puis `return 1`.',
            'Sinon : `return nb_feuilles(a.gauche) + nb_feuilles(a.droit)`.',
          ],
          explain: 'Le test avec `Noeud(5, Noeud(2, None, None), None)` vérifie qu\'un nœud avec un seul fils n\'est pas compté : seul 2 est une feuille.',
        },
      ],
    },
  ],
};
