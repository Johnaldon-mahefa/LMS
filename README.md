# LMS Innov-T Learning Hub : projet complet

Application web de gestion de l'apprentissage. Elle réalise les **11 cas d'utilisation** de la conception et applique
les **15 règles de gestion** (RG1 à RG15). Architecture : React, Node.js avec Express, PostgreSQL.

## 1. Architecture

Application **client-serveur en trois niveaux** :

| Niveau | Technologie | Rôle |
|---|---|---|
| Présentation | React (dossier `frontend`) | Affiche les écrans et appelle l'API |
| Traitement | Node.js et Express (dossier `backend`) | API REST, règles de gestion, sécurité |
| Données | PostgreSQL | Stocke les données et garantit leur intégrité |

Côté serveur, le code suit le principe **MVC en couches** :

```
requête HTTP -> route -> contrôleur -> service -> modèle -> PostgreSQL
```

| Couche | Dossier | Responsabilité | Patron GRASP |
|---|---|---|---|
| Route | `routes/` | Associe une adresse à un contrôleur et vérifie le rôle (RG15) | |
| Contrôleur | `controllers/` | Un par cas d'utilisation : reçoit la requête, appelle le service, répond. **Aucune règle métier** | Contrôleur |
| Service | `services/` | **Règles de gestion** et opérations des classes entité | Expert |
| Modèle | `models/` | **Requêtes SQL** d'une classe, sans règle métier | Fabrication pure, Indirection |
| Middleware | `middlewares/` | Authentification JWT, rôles, dépôt de fichiers, erreurs | |

Correspondance avec le MVC classique : **Vue** = React ; **Contrôleur** = `controllers/` ; **Modèle** = `services/` + `models/`.

## 2. Structure des fichiers

```
lms/
├── backend/
│   ├── package.json, .env.example
│   ├── tests/e2e.js                        Test de bout en bout (61 vérifications)
│   └── src/
│       ├── server.js, app.js
│       ├── config/        env.js, db.js (pool PostgreSQL, transactions)
│       ├── database/      schema.sql (13 tables), seed.js, demo.js, reset.sql, run-sql.js
│       ├── middlewares/   auth.js (JWT, rôles), upload.js (fichiers), errorHandler.js
│       ├── routes/        index, auth, utilisateurs, admin, formateur, apprenant, fichiers
│       ├── controllers/   un par cas d'utilisation (voir section 3)
│       ├── services/      règles de gestion
│       ├── models/        une classe = un fichier
│       └── utils/         AppError, asyncHandler, http, pdf (attestation)
└── frontend/
    ├── vite.config.js
    └── src/
        ├── main.jsx, App.jsx, styles.css
        ├── api/client.js          Appels HTTP, envoi et téléchargement de fichiers
        ├── context/               AuthContext.jsx
        ├── components/            Layout, ProtectedRoute, Message
        └── pages/                 une page par écran (voir section 3)
```

## 3. Les 11 cas d'utilisation dans le code

| Cas d'utilisation | Contrôleur | Service | Page React |
|---|---|---|---|
| S'authentifier | auth | auth.service | Login |
| Gérer les utilisateurs | utilisateurs | utilisateurs.service | Utilisateurs |
| Organiser les formations | formations | formations.service | Formations |
| Gérer les inscriptions | inscriptions | inscriptions.service | Inscriptions |
| Gérer le contenu pédagogique | contenu | contenu.service | Contenu, Module |
| Corriger les soumissions | corrections | soumissions.service | Corrections |
| Suivre la progression des apprenants | suivi | resultats.service | Suivi |
| Demander son inscription à une session | inscriptions | inscriptions.service | Catalogue |
| Consulter le contenu de ses formations | consultation | consultation.service | MesFormations |
| Soumettre une évaluation | soumissions | soumissions.service | MesFormations |
| Consulter ses résultats et son attestation | resultats | resultats.service | Resultats |

## 4. Les règles de gestion dans le code

| Règle | Où elle est appliquée |
|---|---|
| RG1 au moins un rôle | `utilisateurs.service` ; table `utilisateur_role` |
| RG2 désactivation, jamais suppression | `utilisateurs.service`, `auth.service` |
| RG3 statuts et publication d'une formation | `formations.service`, `inscriptions.service` ; CHECK en base |
| RG4 formation avec sessions non supprimable | `formations.service` |
| RG5 session avec inscriptions non supprimable | `formations.service` |
| RG6 validation impossible si session complète | `inscriptions.service` (transaction avec verrou sur la session) |
| RG7 une inscription par apprenant et par session | `inscriptions.service` **et contrainte UNIQUE en base** |
| RG8 publication d'un module, visibilité | `contenu.service`, `consultation.service` |
| RG9 création et modification réservées | `contenu.service` |
| RG10 une soumission par inscription et par évaluation | `soumissions.service` **et contrainte UNIQUE en base** |
| RG11 correction, bornes de la note | `soumissions.service` ; CHECK `note >= 0` en base |
| RG12 validation d'un module | `resultats.service` (`moduleEstValide`) |
| RG13 progression calculée | `resultats.service` (`calculer`) |
| RG14 attestation, une par inscription | `resultats.service` **et contrainte UNIQUE en base** |
| RG15 accès selon le rôle | `middlewares/auth.js` (`requireRole`) sur chaque groupe de routes |

La base de données garantit elle-même l'unicité (RG7, RG10, RG14), les statuts autorisés et les bornes simples. Les règles qui demandent
un calcul ou un contexte (capacité, validation d'un module, droits d'un formateur) sont dans les services.

## 5. Installer PostgreSQL

Site officiel : https://www.postgresql.org/download/ (version 14 ou plus récente).

**Windows**
1. Télécharger l'installateur, le lancer et conserver les composants proposés (PostgreSQL Server, pgAdmin 4, Command Line Tools).
2. Choisir un **mot de passe** pour l'utilisateur `postgres` et le noter. Garder le port `5432`.
3. Terminer l'installation. pgAdmin 4 apparaît dans le menu Démarrer.

**Ubuntu / Debian**
```
sudo apt update
sudo apt install postgresql
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'votre_mot_de_passe';"
```

**macOS** (avec Homebrew)
```
brew install postgresql@16
brew services start postgresql@16
```

## 6. Créer la base de données

**Avec pgAdmin** : clic droit sur *Databases*, *Create*, *Database*, nom `lms`, enregistrer.

**En ligne de commande**
```
psql -U postgres
CREATE DATABASE lms;
\q
```

Les tables sont créées ensuite par le projet (`npm run db:schema`) à partir de `backend/src/database/schema.sql`, qui reprend
le diagramme de classes : une classe, une table. On peut aussi exécuter ce fichier directement dans pgAdmin (Query Tool) ou avec
`psql -U postgres -d lms -f backend/src/database/schema.sql`.

| Classe | Table | Remarque |
|---|---|---|
| Rôle, Utilisateur | `role`, `utilisateur` | association `utilisateur_role` (RG1) |
| Formation, Session | `formation`, `session` | association `affectation` (formateurs d'une session) |
| Inscription | `inscription` | UNIQUE (apprenant, session) : RG7 |
| Module, Leçon, Ressource, Évaluation | `module`, `lecon`, `ressource`, `evaluation` | composition : suppression en cascade |
| Soumission | `soumission` | UNIQUE (inscription, évaluation) : RG10 |
| Attestation | `attestation` | UNIQUE (inscription) : RG14 |

Valeurs enregistrées pour les statuts (sans accents) : `actif`/`desactive` ; `brouillon`/`publiee`/`archivee` ;
`en_attente`/`validee`/`refusee`/`annulee` ; `brouillon`/`publie` ; `soumise`/`corrigee`.

## 7. Lancer le projet

Prérequis : Node.js 18 ou plus.

```
cd backend
copy .env.example .env          (Linux, macOS : cp .env.example .env)
```
Ouvrir `.env` et régler `DB_PASSWORD` (mot de passe de `postgres`), `JWT_SECRET` (longue valeur aléatoire) et `ADMIN_MOT_DE_PASSE`. Puis :
```
npm install
npm run db:schema      crée les 13 tables et les trois rôles
npm run db:seed        crée le compte administrateur
npm run db:demo        (facultatif) comptes et formation de démonstration
npm run dev            API sur http://localhost:3000/api
```
Dans un second terminal :
```
cd frontend
npm install
npm run dev            application sur http://localhost:5173
```

Comptes de démonstration (après `db:demo`) : `formateur1` / `Formateur@123` ; `apprenant1`, `apprenant2`, `apprenant3` / `Apprenant@123` ;
`admin` avec le mot de passe de `.env`.

Repartir de zéro : `npm run db:reset`, puis `db:schema`, `db:seed`, `db:demo`.

## 8. Tester

Avec l'API démarrée : `npm run test:e2e`. Le test rejoue les scénarios des 11 cas d'utilisation et les règles RG1 à RG15
(61 vérifications), sur des données créées pour l'occasion.

## 9. Problèmes fréquents

| Message | Cause et solution |
|---|---|
| `password authentication failed` | `DB_PASSWORD` de `.env` différent du mot de passe de `postgres` |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL n'est pas démarré (service PostgreSQL sous Windows) |
| `database "lms" does not exist` | Créer la base `lms` (section 6) |
| `relation "utilisateur" does not exist` | Lancer `npm run db:schema` |
| `JWT_SECRET est obligatoire` | Copier `.env.example` en `.env` |
| `EADDRINUSE :3000` | Un autre programme utilise le port : changer `PORT` dans `.env` |

## 10. Sécurité

- Mots de passe hachés avec bcrypt, jamais renvoyés par l'API.
- Jeton JWT à durée limitée ; rôles vérifiés **côté serveur** à chaque requête (RG15). L'interface ne fait que masquer les pages.
- Fichiers stockés hors du dossier public, taille et type limités ; téléchargement uniquement après contrôle des droits.
- Le jeton est conservé dans `localStorage` pour simplifier. Une évolution possible est un cookie `httpOnly`.
- En production : HTTPS obligatoire, `JWT_SECRET` long et secret, `.env` jamais versionné (déjà dans `.gitignore`).

## 11. Ce qui est vérifié et ce qui ne l'est pas

Vérifié : base créée depuis zéro, 61 tests de bout en bout réussis (API et PostgreSQL réels), refus direct des doublons par la base, compilation du frontend.
Non vérifié : l'affichage de l'interface dans un navigateur (à faire avant la démonstration), et le déploiement sur le VPS.
