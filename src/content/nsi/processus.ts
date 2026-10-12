import type { Unit } from '../types';

// Output of the `ps` command (lesson 1).
const PS = [
  [1, 0, 'systemd'],
  [812, 1, 'bash'],
  [950, 812, 'python3'],
  [951, 812, 'firefox'],
];

// States of a process and the possible changes.
const ETATS = [
  { id: 'Prêt', x: 12, y: 20 },
  { id: 'Élu', x: 88, y: 20 },
  { id: 'Bloqué', x: 50, y: 88 },
];
const PASSAGES: [string, string][] = [
  ['Prêt', 'Élu'],
  ['Élu', 'Prêt'],
  ['Élu', 'Bloqué'],
  ['Bloqué', 'Prêt'],
];

// Deadlock: R -> P means "P holds R", P -> R means "P waits for R".
const BLOCAGE = [
  { id: 'P1', x: 12, y: 50 },
  { id: 'R1', x: 50, y: 10 },
  { id: 'P2', x: 88, y: 50 },
  { id: 'R2', x: 50, y: 90 },
];
const ATTENTES: [string, string][] = [
  ['R1', 'P1'],
  ['P1', 'R2'],
  ['R2', 'P2'],
  ['P2', 'R1'],
];

export const processus: Unit = {
  id: 'processus',
  title: 'Processus et architecture',
  subtitle: 'états, ordonnancement, interblocage, SoC',
  chapter: 'Chapitre 11',
  lessons: [
    {
      id: 'processus-1',
      title: 'Processus et ordonnancement',
      steps: [
        {
          kind: 'card',
          title: 'Programme et processus',
          body: [
            'Un **programme** est un fichier d\'instructions, rangé sur le disque. Il ne fait rien tout seul.',
            'Un **processus** est un programme **en cours d\'exécution**, chargé en mémoire. Ouvrir deux fois le navigateur crée deux processus, à partir du même programme.',
            'Chaque processus a un numéro unique, le **PID** (identifiant de processus). Il a aussi un **PPID** : le PID de son **parent**, le processus qui l\'a créé. Sous Linux, la commande `ps` les affiche.',
          ],
          figure: { kind: 'table', title: 'ps', columns: ['PID', 'PPID', 'commande'], rows: PS },
        },
        {
          kind: 'choice',
          prompt: 'D\'après le tableau de `ps`, quel est le **parent** du processus `python3` ?',
          figure: { kind: 'table', title: 'ps', columns: ['PID', 'PPID', 'commande'], rows: PS },
          options: ['systemd', 'bash', 'firefox', 'Il n\'a pas de parent'],
          answer: 1,
          explain: 'Le PPID de `python3` est 812. Le processus de PID 812 est `bash` (le terminal) : c\'est lui qui a lancé `python3`. `bash` a lui-même pour parent `systemd`, de PID 1 : le tout premier processus.',
        },
        {
          kind: 'card',
          title: 'Les états d\'un processus',
          body: [
            'Un processus passe par trois états. **Élu** : il utilise le processeur, il s\'exécute. **Prêt** : il attend son tour pour le processeur. **Bloqué** : il attend une ressource (un fichier à lire, une touche, des données du réseau…).',
            'Prêt → Élu : le système le choisit. Élu → Prêt : son temps est fini, il laisse la place. Élu → Bloqué : il attend une ressource. Bloqué → Prêt : la ressource est arrivée.',
            'Un processus bloqué ne repasse **jamais** directement à élu : il redevient d\'abord prêt, et attend son tour.',
          ],
          figure: { kind: 'graph', nodes: ETATS, edges: PASSAGES, directed: true, caption: 'Les états d\'un processus. Une flèche = un passage possible.' },
        },
        {
          kind: 'choice',
          prompt: 'Un processus attend que l\'utilisateur appuie sur une touche du clavier. Dans quel état est-il ?',
          options: ['Prêt', 'Élu', 'Bloqué', 'Terminé'],
          answer: 2,
          explain: 'Il attend une **ressource** (la touche) : il est bloqué. Inutile de lui donner le processeur tant que la touche n\'est pas appuyée.',
        },
        {
          kind: 'choice',
          prompt: 'Quel passage entre deux états est **impossible** ?',
          figure: { kind: 'graph', nodes: ETATS, edges: PASSAGES, directed: true },
          options: ['Prêt → Élu', 'Élu → Bloqué', 'Bloqué → Prêt', 'Bloqué → Élu'],
          answer: 3,
          explain: 'Quand la ressource arrive, le processus bloqué devient **prêt**. Il doit attendre que le système le choisisse pour devenir élu.',
        },
        {
          kind: 'order',
          prompt: 'Un processus lit un fichier sur le disque. Remettez sa vie dans l\'ordre. Une étape est en trop.',
          mode: 'text',
          lines: [
            'Il est créé et attend son tour : il est prêt',
            'Le système le choisit : il est élu',
            'Il demande à lire le fichier : il est bloqué',
            'Le fichier est lu : il redevient prêt',
            'Il est de nouveau élu, puis il se termine',
          ],
          distractors: ['Le fichier est lu : il passe directement à élu'],
          explain: 'Prêt, élu, bloqué, prêt, élu. Après un blocage, on repasse toujours par l\'état prêt.',
        },
        {
          kind: 'card',
          title: 'L\'ordonnancement',
          body: [
            'Un processeur n\'exécute qu\'un processus à la fois. L\'**ordonnanceur**, une partie du système d\'exploitation (Linux, Windows, Android…), choisit quel processus prêt devient élu. Il change très vite : on a l\'impression que tout tourne en même temps.',
            '**FIFO** (premier arrivé, premier servi) : chaque processus s\'exécute jusqu\'au bout, dans l\'ordre d\'arrivée. **Priorités** : le processus le plus important passe d\'abord.',
            '**Tourniquet** (Round Robin) : chaque processus s\'exécute pendant un petit temps fixe, le **quantum**. Puis il retourne à la fin de la file d\'attente, et le suivant prend sa place.',
          ],
        },
        {
          kind: 'table',
          prompt: 'Tourniquet, quantum de 2. Trois processus arrivent à t = 0, dans l\'ordre A, B, C. A a besoin de 3 unités de temps, B de 2, C de 4. Pour chaque instant, écrivez le processus élu (A, B ou C, en majuscule), et le temps qu\'il lui reste **après** cette unité.',
          columns: ['élu', 'reste'],
          rows: ['t = 0', 't = 1', 't = 2', 't = 3', 't = 4', 't = 5', 't = 6', 't = 7', 't = 8'],
          answer: [
            ['=A', '=2'],
            ['A', '1'],
            ['B', '1'],
            ['B', '0'],
            ['C', '3'],
            ['C', '2'],
            ['A', '0'],
            ['C', '1'],
            ['C', '0'],
          ],
          explain: 'A tourne 2 unités (t = 0 et 1), puis retourne en fin de file : B, C, A. B tourne 2 unités (t = 2 et 3) et se termine. C tourne 2 unités (t = 4 et 5) : la file devient A, C. A n\'a plus besoin que d\'1 unité (t = 6). Enfin, C finit (t = 7 et 8).',
        },
        {
          kind: 'choice',
          prompt: 'Mêmes processus (A : 3 unités, B : 2, C : 4), mais avec **FIFO**. Quel processus est élu à t = 4 ?',
          options: ['A', 'B', 'C'],
          answer: 1,
          explain: 'Avec FIFO, A tourne jusqu\'au bout (t = 0, 1, 2), puis B (t = 3, 4), puis C (t = 5 à 8). À t = 4, c\'est B. Avec le tourniquet, c\'était C.',
        },
        {
          kind: 'choice',
          prompt: 'Quel est l\'avantage du tourniquet par rapport à FIFO ?',
          options: [
            'Il termine toujours les processus plus vite',
            'Il n\'a jamais besoin de changer de processus',
            'Il exécute deux processus en même temps sur un seul processeur',
            'Chaque processus avance régulièrement : aucun n\'attend très longtemps',
          ],
          answer: 3,
          explain: 'Avec FIFO, un processus très long bloque tous les autres derrière lui. Avec le tourniquet, chacun reçoit le processeur à son tour, très souvent : c\'est ce qui rend un ordinateur **réactif**.',
        },
      ],
    },
    {
      id: 'processus-2',
      title: 'Interblocage et architecture',
      steps: [
        {
          kind: 'card',
          title: 'L\'interblocage',
          body: [
            'Une **ressource** est ce dont un processus a besoin : imprimante, fichier, mémoire… Certaines ne peuvent servir qu\'à un seul processus à la fois.',
            'Exemple : P1 tient l\'imprimante (R1) et attend le scanner (R2). P2 tient le scanner et attend l\'imprimante. Chacun attend l\'autre, pour toujours !',
            'C\'est un **interblocage** (en anglais, deadlock) : des processus bloqués qui s\'attendent les uns les autres, en cercle.',
          ],
          figure: { kind: 'graph', nodes: BLOCAGE, edges: ATTENTES, directed: true, caption: 'R1 : imprimante, R2 : scanner. R → P : P tient R. P → R : P attend R.' },
        },
        {
          kind: 'choice',
          prompt: 'Regardez la figure. Que va-t-il se passer ?',
          figure: { kind: 'graph', nodes: BLOCAGE, edges: ATTENTES, directed: true, caption: 'R → P : P tient R. P → R : P attend R.' },
          options: [
            'P1 finit, puis P2',
            'P2 finit, puis P1',
            'P1 et P2 restent bloqués pour toujours',
            'Le système donne l\'imprimante aux deux en même temps',
          ],
          answer: 2,
          explain: 'Le graphe forme un **cycle** : P1 attend R2, tenu par P2, qui attend R1, tenu par P1. Aucun ne peut avancer : c\'est un interblocage.',
        },
        {
          kind: 'card',
          title: 'Les conditions de Coffman',
          body: [
            'Un interblocage n\'arrive que si **quatre conditions** sont vraies en même temps : ce sont les conditions de Coffman.',
            '**Exclusion mutuelle** : une ressource ne sert qu\'à un processus à la fois. **Possession et attente** : un processus garde ses ressources pendant qu\'il en attend d\'autres.',
            '**Pas de réquisition** : on ne peut pas reprendre de force une ressource à un processus. **Attente circulaire** : les processus s\'attendent en cercle.',
            'Pour éviter l\'interblocage, il suffit d\'empêcher **une seule** de ces conditions.',
          ],
        },
        {
          kind: 'choice',
          prompt: 'P1 et P2 demandent maintenant toujours l\'imprimante **avant** le scanner. Pourquoi n\'y a-t-il plus d\'interblocage ?',
          options: [
            'Il n\'y a plus d\'exclusion mutuelle',
            'Il ne peut plus y avoir d\'attente circulaire',
            'Les processus vont plus vite',
            'Le scanner est repris de force',
          ],
          answer: 1,
          explain: 'Pour tenir le scanner, il faut déjà tenir l\'imprimante. Donc personne ne tient le scanner en attendant l\'imprimante : celui qui a l\'imprimante finit toujours par avoir le scanner. Le cercle d\'attente est impossible.',
        },
        {
          kind: 'card',
          title: 'Processus et threads',
          body: [
            'Un **thread** (fil d\'exécution) est une partie d\'un processus, qui s\'exécute en parallèle d\'autres threads du **même** processus.',
            'Exemple : dans un navigateur, un thread affiche la page pendant qu\'un autre télécharge une image.',
            'Différence importante : les threads d\'un même processus **partagent la même mémoire** (les mêmes variables). Deux processus ont chacun **leur propre mémoire**.',
          ],
        },
        {
          kind: 'choice',
          prompt: 'Quelle phrase est juste ?',
          options: [
            'Les threads d\'un même processus partagent la même mémoire',
            'Deux processus partagent toujours la même mémoire',
            'Un thread est un programme rangé sur le disque',
            'Un processus ne peut avoir qu\'un seul thread',
          ],
          answer: 0,
          explain: 'Les threads d\'un processus travaillent sur les mêmes données : c\'est rapide pour échanger, mais il faut faire attention quand deux threads modifient la même variable.',
        },
        {
          kind: 'card',
          title: 'Le système sur puce (SoC)',
          body: [
            'Dans un smartphone, presque tout l\'ordinateur tient sur **une seule puce** : c\'est un **système sur puce**, ou SoC (System on Chip). Le tableau montre ses composants.',
            '**Avantages** : c\'est très petit, ça consomme peu d\'énergie (la batterie dure plus longtemps), ça chauffe moins, et les composants communiquent vite car ils sont très proches.',
            '**Inconvénient** : on ne peut pas changer un seul composant, par exemple ajouter de la mémoire.',
          ],
          figure: {
            kind: 'table',
            title: 'Dans un SoC',
            columns: ['composant', 'rôle'],
            rows: [
              ['CPU', 'processeur : exécute les instructions'],
              ['GPU', 'processeur graphique : calcule les images'],
              ['RAM', 'mémoire vive : programmes en cours'],
              ['mémoire flash', 'stockage : fichiers, applications'],
              ['modem', 'communication : 4G, 5G'],
            ],
          },
        },
        {
          kind: 'choice',
          prompt: 'Pourquoi les smartphones utilisent-ils un SoC plutôt que des composants séparés ?',
          options: [
            'Parce qu\'on peut changer facilement chaque composant',
            'Parce qu\'il n\'a pas besoin de processeur',
            'Parce qu\'il est petit et consomme peu d\'énergie',
            'Parce qu\'il laisse de la place pour des cartes d\'extension',
          ],
          answer: 2,
          explain: 'Un smartphone doit être petit et tenir longtemps sur batterie. Le SoC rassemble tout sur une puce de quelques millimètres, qui consomme peu.',
        },
        {
          kind: 'card',
          title: 'Lire un programme en assembleur',
          body: [
            'Le processeur n\'exécute que des instructions très simples. L\'**assembleur** les écrit avec des mots courts, une instruction par ligne.',
            'Les **registres** R0, R1, R2… sont de petites mémoires très rapides, **dans** le processeur. `#5` veut dire « le nombre 5 », alors que `20` seul veut dire « la case 20 de la mémoire ».',
            'Une **étiquette** (comme `boucle`) marque une ligne. `BLT` (« branch if less than ») saute à cette ligne si, lors du dernier `CMP`, le premier nombre était plus petit.',
          ],
          figure: {
            kind: 'table',
            title: 'Quelques instructions',
            columns: ['instruction', 'effet'],
            rows: [
              ['MOV R0, #5', 'R0 reçoit 5'],
              ['ADD R2, R0, R1', 'R2 reçoit R0 + R1'],
              ['LDR R0, 20', 'R0 reçoit la case 20 de la mémoire'],
              ['STR R0, 21', 'la case 21 de la mémoire reçoit R0'],
              ['CMP R1, #4', 'compare R1 et 4'],
              ['BLT boucle', 'si R1 < 4, aller à boucle'],
              ['B fin', 'aller à fin, toujours'],
              ['HALT', 'arrêter le programme'],
            ],
          },
        },
        {
          kind: 'table',
          prompt: 'La case 20 de la mémoire contient 10. Au départ, les registres valent 0. Donnez R0, R1 et R2 après chaque ligne du programme.',
          figure: {
            kind: 'table',
            title: 'Programme',
            columns: ['ligne', 'instruction'],
            rows: [
              [1, 'LDR R0, 20'],
              [2, 'MOV R1, #3'],
              [3, 'ADD R2, R0, R1'],
              [4, 'ADD R0, R2, R2'],
              [5, 'STR R0, 21'],
            ],
          },
          columns: ['R0', 'R1', 'R2'],
          rows: ['départ', 'ligne 1', 'ligne 2', 'ligne 3', 'ligne 4', 'ligne 5'],
          answer: [
            ['=0', '=0', '=0'],
            ['10', '0', '0'],
            ['10', '3', '0'],
            ['10', '3', '13'],
            ['26', '3', '13'],
            ['26', '3', '13'],
          ],
          explain: 'Ligne 1 : R0 reçoit le contenu de la case 20, soit 10. Ligne 3 : R2 = 10 + 3 = 13. Ligne 4 : R0 = 13 + 13 = 26. Ligne 5 : `STR` écrit 26 dans la case 21 de la mémoire, mais ne change aucun registre.',
        },
        {
          kind: 'choice',
          prompt: 'Lisez ce programme : il contient une boucle. Que contient R0 à la fin ?',
          figure: {
            kind: 'table',
            title: 'Programme',
            columns: ['étiquette', 'instruction'],
            rows: [
              ['', 'MOV R0, #0'],
              ['', 'MOV R1, #1'],
              ['boucle', 'ADD R0, R0, R1'],
              ['', 'ADD R1, R1, #1'],
              ['', 'CMP R1, #4'],
              ['', 'BLT boucle'],
              ['', 'HALT'],
            ],
          },
          options: ['3', '4', '6', '10'],
          answer: 2,
          noOutputCheck: true,
          explain: 'Tour 1 : R0 = 0 + 1 = 1, R1 = 2 (2 < 4 : on recommence). Tour 2 : R0 = 1 + 2 = 3, R1 = 3 (3 < 4 : on recommence). Tour 3 : R0 = 3 + 3 = 6, R1 = 4 (4 < 4 est faux : on continue). R0 vaut 6 = 1 + 2 + 3, comme une boucle `for` en Python.',
        },
      ],
    },
    {
      id: 'processus-defi',
      title: 'Défi : le tourniquet',
      type: 'defi',
      steps: [
        {
          kind: 'card',
          title: 'Le problème',
          body: [
            'Trois processus arrivent à t = 0, dans l\'ordre A, B, C. A a besoin de 4 unités de temps, B de 1, C de 3.',
            'L\'ordonnanceur utilise le **tourniquet**, avec un quantum de 2. Il faut trouver quel processus est élu à chaque instant.',
            'Nouveauté : B a besoin de **moins** que le quantum. Que se passe-t-il quand un processus se termine avant la fin de son quantum ?',
          ],
        },
        {
          kind: 'choice',
          prompt: '**Comprendre.** A est élu à t = 0 et t = 1, puis retourne en fin de file. B est élu à t = 2 et se termine tout de suite. Qui est élu à t = 3 ?',
          options: [
            'B, car son quantum n\'est pas fini',
            'C, le suivant dans la file',
            'A, car il a été élu le premier',
            'Personne : on attend la fin du quantum de B',
          ],
          answer: 1,
          explain: 'B est terminé : il libère le processeur tout de suite. Le suivant dans la file (C, puis A) prend la place : C est élu à t = 3. On ne gaspille pas le reste du quantum.',
        },
        {
          kind: 'order',
          prompt: '**Découper.** Remettez dans l\'ordre la méthode du tourniquet. Une étape est en trop.',
          mode: 'text',
          lines: [
            'Mettre les processus dans la file, dans leur ordre d\'arrivée',
            'Prendre le processus en tête de la file : il est élu',
            'Le faire tourner pendant le quantum, ou moins s\'il se termine avant',
            'S\'il n\'est pas terminé, le remettre à la fin de la file',
            'Recommencer tant que la file n\'est pas vide',
          ],
          distractors: ['Le faire tourner jusqu\'à ce qu\'il soit terminé'],
          explain: 'Faire tourner un processus jusqu\'au bout, c\'est la méthode FIFO, pas le tourniquet. Avec le tourniquet, un processus ne garde jamais le processeur plus d\'un quantum de suite.',
        },
        {
          kind: 'table',
          prompt: '**Appliquer.** Quantum 2. A : 4 unités, B : 1, C : 3. Pour chaque instant, écrivez le processus élu (en majuscule), et le temps qu\'il lui reste **après** cette unité.',
          columns: ['élu', 'reste'],
          rows: ['t = 0', 't = 1', 't = 2', 't = 3', 't = 4', 't = 5', 't = 6', 't = 7'],
          answer: [
            ['=A', '=3'],
            ['A', '2'],
            ['B', '0'],
            ['C', '2'],
            ['C', '1'],
            ['A', '1'],
            ['A', '0'],
            ['C', '0'],
          ],
          explain: 'File au départ : A, B, C. A tourne (t = 0 et 1), il lui reste 2 : file B, C, A. B finit à t = 2 : file C, A. C tourne (t = 3 et 4), il lui reste 1 : file A, C. A finit (t = 5 et 6). Enfin, C finit à t = 7. Total : 4 + 1 + 3 = 8 unités.',
        },
      ],
    },
  ],
};
