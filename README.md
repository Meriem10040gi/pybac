# PyBac Web

La version **site web** de PyBac : apprendre Python et l'algorithmique depuis zéro, puis préparer le bac NSI.
Même cours que l'application Android (les mêmes leçons, les mêmes exercices, vérifiés avec du vrai Python),
avec une nouvelle mise en page qui s'adapte à l'écran :

- **sur ordinateur** : le menu à gauche, et pour les exercices de code, l'énoncé à gauche et l'éditeur à droite.
  Au clavier : `Entrée` valide, `Ctrl + Entrée` vérifie depuis l'éditeur, `A` à `D` choisissent une réponse,
  `←` et `→` font avancer le pas à pas ;
- **sur téléphone ou tablette** : une seule colonne, les pages en bas de l'écran, et les barres de symboles
  Python au-dessus de l'éditeur.

Python tourne **dans le navigateur** (Pyodide, environ 10 Mo téléchargés à la première visite). Ensuite, le site
fonctionne même **sans internet**, et il peut être **installé** comme une application.

Chaque élève a un **compte** (e-mail et mot de passe). Sa progression (leçons terminées, XP, jours d'affilée)
est enregistrée dans la **base de données MySQL** : il la retrouve sur l'ordinateur et sur le téléphone, et
l'administrateur suit la progression de tous les élèves dans le **back-office**.

## Les réglages : le fichier `.env`

Copier `.env.example` en `.env` et le remplir :

| Réglage | Rôle |
|---|---|
| `DATABASE_URL` | L'adresse de la base MySQL (Aiven : *Service URI*), de la forme `mysql://UTILISATEUR:MOT_DE_PASSE@HÔTE:PORT/pybac?ssl-mode=REQUIRED` |
| `ADMIN_EMAILS` | Facultatif : des e-mails d'administrateurs, séparés par des virgules (le plus simple est `npm run admin`, plus bas) |
| `SIGNUP_CODE` | Facultatif : un code à donner aux élèves. S'il est rempli, il est demandé pour créer un compte |
| `DATABASE_CA_CERT` | Facultatif : le chemin du certificat `ca.pem` d'Aiven, pour vérifier que le serveur parle bien à votre base |

**`.env` contient le mot de passe de la base : ne le partagez jamais et ne le mettez pas sur GitHub**
(il est déjà dans `.gitignore`).

La base indiquée à la fin de `DATABASE_URL` (`/pybac`) doit exister : sur Aiven, onglet *Databases*, créer `pybac`.
Les tables (`users`, `sessions`, `progress`) sont créées toutes seules au premier démarrage.

Sans `DATABASE_URL`, en développement, les comptes sont gardés en mémoire et effacés à l'arrêt du serveur
(pratique pour essayer). En production, le serveur refuse de démarrer sans base.

## Lancer sur l'ordinateur

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173. `npm run dev` démarre le site et le serveur (l'API, sur le port 3000).

## Mettre le site en ligne

### Sur Vercel

Le site (Vite) est servi par Vercel, et l'API tourne comme une fonction Vercel (`api/index.ts`, qui
reprend le même serveur Express). `vercel.json` envoie `/api/...` à la fonction et toutes les autres
pages au site.

1. Mettre le projet sur GitHub (sans `.env`).
2. Sur https://vercel.com : *Add New* → *Project* → importer le dépôt. Vercel lit `vercel.json` :
   rien à changer dans *Build and Output Settings*.
3. *Environment Variables* : ajouter `DATABASE_URL` (l'adresse de la base Aiven) et, si besoin,
   `ADMIN_EMAILS` et `SIGNUP_CODE`. Pour vérifier le certificat d'Aiven, coller le contenu de `ca.pem`
   dans `DATABASE_CA_CERT`.
4. *Deploy*. Ensuite, chaque `git push` sur `main` met le site à jour.

Aiven doit accepter les connexions de Vercel : dans le service MySQL, *Allowed IP addresses* doit
contenir `0.0.0.0/0` (c'est le réglage par défaut).

### Sur un hébergeur Node.js (Render, Railway, un VPS)

Le même serveur envoie le site et l'API. Par exemple, sur **Render** (https://render.com), gratuit :

1. Mettre le projet sur GitHub (sans `.env`).
2. Sur Render : *New* → *Web Service* → choisir le dépôt.
3. *Build command* : `npm ci --include=dev && npm run build` ; *Start command* : `npm start`.
4. *Environment* : ajouter `NODE_ENV` = `production`, `DATABASE_URL`, `ADMIN_EMAILS` (et `SIGNUP_CODE` si besoin).

Tout autre hébergeur Node.js (Railway, Fly.io, un VPS) marche
de la même façon : `npm run build` puis `npm start`, avec les mêmes réglages.

**Mettre à jour le site ne touche jamais aux comptes ni à la progression** : tout est dans la base MySQL, que les
nouvelles versions ne vident pas (les tables ne sont créées que si elles n'existent pas). La progression est
enregistrée par identifiant de leçon : modifier le texte d'une leçon garde les leçons déjà terminées. Seul
changer l'`id` d'une leçon (dans `src/content/`) ferait perdre sa réussite : ne le faites pas.

## Le back-office (administrateurs)

### Créer un administrateur

Depuis le dossier du projet (le fichier `.env` doit contenir `DATABASE_URL`) :

```bash
npm run admin -- add prof@lycee.fr
```

Le script demande un mot de passe (il ne s'affiche pas pendant la frappe), crée le compte et le marque
administrateur dans la base. Si le compte existe déjà, il devient administrateur (son mot de passe ne change pas ;
ajouter `--password` pour en choisir un nouveau).

```bash
npm run admin -- list
npm run admin -- remove prof@lycee.fr
```

`ADMIN_EMAILS` (dans `.env` ou sur l'hébergeur) reste possible : ces e-mails sont aussi administrateurs.

### Ce qu'on y trouve

Un administrateur arrive, en se connectant, dans le **back-office** (`/admin`) :

- **Tableau de bord** : élèves inscrits, actifs cette semaine et aujourd'hui, activité récente, élèves à relancer
  (rien depuis 7 jours), leçons les plus difficiles (le moins d'étoiles).
- **Élèves** : la liste (recherche, tri, **export pour un tableur** avec une colonne par leçon), puis le détail
  d'un élève leçon par leçon, **un nouveau mot de passe** pour un élève qui a oublié le sien, et la suppression
  d'un compte.
- **Leçons** : pour chaque leçon, combien d'élèves l'ont terminée, combien l'ont en cours, et les étoiles en moyenne.

*Voir le site élève* ouvre le site comme un élève (pour le reste de la visite) ; *Retour au back-office* revient.

## Sécurité

- Les mots de passe ne sont jamais enregistrés : seulement leur empreinte (scrypt).
- La session est un cookie `HttpOnly` (invisible pour le JavaScript de la page), valable 180 jours.
- Trop d'essais de connexion ralentissent : 10 essais par quart d'heure.
- Le back-office est vérifié par le serveur : un élève ne peut ni lire la progression des autres, ni modifier un compte.

## Installer l'application

- **Android (Chrome)** : ouvrir le site, menu ⋮, *Installer l'application* (ou *Ajouter à l'écran d'accueil*).
- **iPhone / iPad (Safari)** : bouton Partager, *Sur l'écran d'accueil*.
- **Ordinateur (Chrome, Edge)** : l'icône d'installation dans la barre d'adresse.

## Comment c'est organisé

| Dossier | Contenu |
|---|---|
| `src/content/` | Le cours, **identique** à l'application Android : `course.ts`, `bases/`, `nsi/` |
| `src/state/` | Le compte (`auth.tsx`), la progression et sa synchronisation avec le serveur (`progress.tsx`, `merge.ts`) |
| `src/lesson/` | La vérification des réponses (`check.ts`) et un fichier par type d'exercice (`kinds/`) |
| `server/` | Le serveur : comptes et sessions (`auth.ts`), API (`app.ts`), base MySQL (`store.ts`) |
| `src/python/` | Le moteur Python : Pyodide dans un Web Worker (`worker.ts`), arrêté et relancé si un programme ne s'arrête pas (`engine.tsx`) |
| `src/pages/` | Les pages : accueil et sommaire, unité, leçon, bac à sable |
| `src/components/` | Éditeur de code (CodeMirror), affichage du code, console, pas à pas, dessins (arbres, graphes, tableaux) |
| `src/styles/` | Les couleurs et la mise en page (la page de cahier : lignes Seyès et marge rouge) |
| `scripts/verify-content.ts` | Vérifie tout le cours avec du vrai Python : `npm run verify` |
| `docs/ecrire-une-lecon.md` | Les règles pour écrire une leçon juste |

## Modifier le cours

Les fichiers de `src/content/` sont les mêmes que dans l'application Android. Après une modification :

```bash
npm run verify
```

Si une leçon est modifiée dans un projet, il faut copier le fichier dans l'autre pour garder les deux versions pareilles.
