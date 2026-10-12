import type { Unit } from '../types';

export const u7: Unit = {
  id: 'parcours',
  title: 'Parcourir une liste',
  subtitle: 'somme, compteur, maximum, recherche',
  lessons: [
    {
      id: 'parcours-1',
      title: 'Passer en revue les éléments',
      steps: [
        {
          kind: 'card',
          title: 'Parcourir par valeur',
          body: [
            'Avec `for x in L:`, la variable `x` prend **chaque élément** de la liste, du premier au dernier.',
            'C\'est le plus simple quand on a seulement besoin des valeurs.',
          ],
          code: 'L = [3, 7, 2]\nfor x in L:\n    print(x)',
          output: '3\n7\n2',
        },
        {
          kind: 'card',
          title: 'Parcourir par indice',
          body: [
            'Avec `for i in range(len(L)):`, la variable `i` prend chaque **indice** : 0, 1, …, `len(L) − 1`. L\'élément est `L[i]`.',
            'Utile quand on a besoin de la **position**, ou pour modifier la liste.',
          ],
          code: 'L = [3, 7, 2]\nfor i in range(len(L)):\n    print(i, L[i])',
          output: '0 3\n1 7\n2 2',
        },
        {
          kind: 'demo',
          title: 'La somme d\'une liste',
          body: 'Le schéma de l\'**accumulateur** : `s` part de 0 **avant** la boucle, reçoit chaque élément **dans** la boucle, et est renvoyée **après** la boucle.',
          code: 'def somme(L):\n    s = 0\n    for x in L:\n        s = s + x\n    return s\n\nprint(somme([4, 10, 3]))',
        },
        {
          kind: 'table',
          prompt: 'Ce programme cherche le **maximum** de la liste. Remplissez le tableau de variables à la fin de chaque tour.',
          code: 'L = [41, 55, 38, 70, 63]\nm = L[0]\nfor x in L:\n    if x > m:\n        m = x',
          columns: ['x', 'm'],
          rows: ['avant', 'tour 1', 'tour 2', 'tour 3', 'tour 4', 'tour 5'],
          answer: [
            ['=–', '=41'],
            ['41', '41'],
            ['55', '55'],
            ['38', '55'],
            ['70', '70'],
            ['63', '70'],
          ],
          explain: '`m` garde le plus grand nombre vu jusqu\'ici. Au tour 3, 38 > 55 est faux : `m` ne change pas. On part de `m = L[0]` et pas de 0 : avec des nombres négatifs, 0 serait faux.',
        },
        {
          kind: 'bug',
          prompt: 'Cette fonction doit renvoyer la somme des éléments (17), mais elle renvoie 4. Touchez la ligne fautive.',
          code: 'def somme(L):\n    s = 0\n    for x in L:\n        s = s + x\n        return s\n\nprint(somme([4, 10, 3]))',
          line: 5,
          fixed: 'def somme(L):\n    s = 0\n    for x in L:\n        s = s + x\n    return s\n\nprint(somme([4, 10, 3]))',
          output: '17',
          explain: 'Le `return` est décalé **dans** la boucle : la fonction s\'arrête au premier tour. Il doit être aligné avec le `for`, pour s\'exécuter **après** la boucle.',
        },
        {
          kind: 'order',
          prompt: 'Remettez dans l\'ordre la fonction `nb_negatifs(L)`, qui renvoie le nombre d\'éléments négatifs. Une ligne est en trop.',
          mode: 'code',
          lines: ['def nb_negatifs(L):', '    n = 0', '    for x in L:', '        if x < 0:', '            n = n + 1', '    return n'],
          distractors: ['        return n'],
          tests: [
            { call: 'nb_negatifs([3, -1, 4, -5])', expected: '2' },
            { call: 'nb_negatifs([1, 2])', expected: '0' },
            { call: 'nb_negatifs([])', expected: '0' },
          ],
          explain: 'C\'est un **compteur** : il part de 0 et augmente de 1 à chaque élément négatif. Le `return` à 8 espaces (dans la boucle) était le piège.',
        },
        {
          kind: 'fill',
          prompt: 'Complétez : la fonction renvoie une **nouvelle liste** avec seulement les températures strictement supérieures à `seuil`.',
          code: 'def trop_chaudes(L, seuil):\n    res = {{[]}}\n    for t in L:\n        if {{t > seuil}}:\n            res.{{append}}(t)\n    return res',
          distractors: ['0', 't < seuil', 'add'],
          tests: [
            { call: 'trop_chaudes([41, 65, 58, 72], 60)', expected: '[65, 72]' },
            { call: 'trop_chaudes([41, 55], 60)', expected: '[]' },
          ],
          explain: 'On part d\'une liste **vide** `[]` et on ajoute à la fin chaque température qui dépasse le seuil. C\'est aussi un accumulateur, mais il accumule une liste.',
        },
        {
          kind: 'code',
          prompt: 'Écrivez une fonction `maximum(L)` qui renvoie le plus grand élément d\'une liste non vide, **sans** utiliser `max`.',
          starter: 'def maximum(L):\n    ',
          tests: [
            { call: 'maximum([41, 55, 38, 70, 63])', expected: '70' },
            { call: 'maximum([-5, -2, -9])', expected: '-2' },
            { call: 'maximum([7])', expected: '7' },
          ],
          solution: 'def maximum(L):\n    m = L[0]\n    for x in L:\n        if x > m:\n            m = x\n    return m',
          hints: ['Reprenez le programme du tableau de variables : `m = L[0]`, puis une boucle `for x in L:`.', 'Le `return m` est aligné avec le `for`.'],
          explain: 'Le test avec `[-5, -2, -9]` vérifie que `m` part bien de `L[0]` : en partant de `m = 0`, la fonction renverrait 0.',
        },
      ],
    },
    {
      id: 'parcours-defi',
      title: 'Défi : chercher un élément',
      type: 'defi',
      steps: [
        {
          kind: 'card',
          title: 'Le problème',
          body: [
            'Écrire `contient(L, v)` qui renvoie `True` si la valeur `v` est dans la liste `L`, et `False` sinon.',
            'C\'est la **recherche séquentielle**, un algorithme du programme de Première. Il y a un piège classique : voyons-le d\'abord.',
          ],
        },
        {
          kind: 'choice',
          prompt: '**Comprendre.** Cette version a l\'air juste. Qu\'affiche le programme ?',
          code: 'def contient(L, v):\n    for x in L:\n        if x == v:\n            return True\n        else:\n            return False\n\nprint(contient([4, 8, 15], 8))',
          options: ['True', 'False', 'Erreur'],
          answer: 1,
          mono: true,
          explain: 'Au premier tour, 4 == 8 est faux : on va dans le `else` et `return False` **arrête** la fonction. On n\'a jamais regardé le 8 ! On ne peut dire « pas trouvé » qu\'après avoir **tout** parcouru.',
        },
        {
          kind: 'order',
          prompt: '**Découper.** Remettez les étapes dans l\'ordre. Une étape est en trop.',
          mode: 'text',
          lines: [
            'Pour chaque élément x de la liste :',
            'si x est égal à la valeur cherchée, renvoyer True (on a trouvé)',
            'Après la boucle (tout parcouru sans trouver) : renvoyer False',
          ],
          distractors: ['sinon, renvoyer False'],
          explain: 'Le `return False` est **après** la boucle, aligné avec le `for`. On n\'y arrive que si aucun élément n\'était égal à `v`.',
        },
        {
          kind: 'code',
          prompt: '**Coder.** Écrivez `contient(L, v)` avec une boucle, sans utiliser `in` pour le test (seulement dans le `for`).',
          starter: 'def contient(L, v):\n    ',
          tests: [
            { call: 'contient([4, 8, 15], 8)', expected: 'True' },
            { call: 'contient([4, 8, 15], 15)', expected: 'True' },
            { call: 'contient([4, 8, 15], 3)', expected: 'False' },
            { call: 'contient([], 1)', expected: 'False' },
          ],
          solution: 'def contient(L, v):\n    for x in L:\n        if x == v:\n            return True\n    return False',
          hints: ['Dans la boucle : `if x == v:` puis `return True`, sans `else`.', '`return False` est aligné avec le `for` (4 espaces).'],
          explain: 'Le test `contient([], 1)` vérifie le cas de la liste vide : la boucle ne fait aucun tour et on renvoie `False`.',
        },
      ],
    },
  ],
};
