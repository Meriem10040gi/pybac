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
l'administrateur suit la progression de tous les élèves (page *Suivi des élèves*).

## Les réglages : le fichier `.env`

Copier `.env.example` en `.env` et le remplir :

| Réglage | Rôle |
|---|---|
| `DATABASE_URL` | L'adresse de la base MySQL (Aiven : *Service URI*), de la forme `mysql://UTILISATEUR:MOT_DE_PASSE@HÔTE:PORT/pybac?ssl-mode=REQUIRED` |
| `ADMIN_EMAILS` | Les e-mails des administrateurs, séparés par des virgules. L'administrateur crée son compte sur le site avec cet e-mail, comme un élève |
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

Le site a maintenant besoin d'un **serveur Node.js** (pour les comptes et la base de données) : un hébergement
de fichiers seuls (Netlify Drop) ne suffit plus. Par exemple, sur **Render** (https://render.com), gratuit :

1. Mettre le projet sur GitHub (sans `.env`).
2. Sur Render : *New* → *Web Service* → choisir le dépôt.
3. *Build command* : `npm ci --include=dev && npm run build` ; *Start command* : `npm start`.
4. *Environment* : ajouter `NODE_ENV` = `production`, `DATABASE_URL`, `ADMIN_EMAILS` (et `SIGNUP_CODE` si besoin).

Le même serveur envoie le site et répond à l'API. Tout autre hébergeur Node.js (Railway, Fly.io, un VPS) marche
de la même façon : `npm run build` puis `npm start`, avec les mêmes réglages.

**Mettre à jour le site ne touche jamais aux comptes ni à la progression** : tout est dans la base MySQL, que les
nouvelles versions ne vident pas (les tables ne sont créées que si elles n'existent pas). La progression est
enregistrée par identifiant de leçon : modifier le texte d'une leçon garde les leçons déjà terminées. Seul
changer l'`id` d'une leçon (dans `src/content/`) ferait perdre sa réussite : ne le faites pas.

## Suivi des élèves (administrateurs)

- La liste des comptes : leçons terminées, XP, jours d'affilée, dernière activité ; recherche et tri.
- Le détail d'un élève, leçon par leçon (étoiles, date, étape en cours).
- **Nouveau mot de passe** pour un élève qui a oublié le sien (il n'y a pas d'envoi d'e-mail).
- **Exporter pour un tableur** : un fichier CSV (Excel, LibreOffice) avec une colonne par leçon.

## Sécurité

- Les mots de passe ne sont jamais enregistrés : seulement leur empreinte (scrypt).
- La session est un cookie `HttpOnly` (invisible pour le JavaScript de la page), valable 180 jours.
- Trop d'essais de connexion ralentissent : 10 essais par quart d'heure.
- La page de suivi est vérifiée par le serveur : un élève ne peut pas lire la progression des autres.

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
