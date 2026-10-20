-- Schéma PostgreSQL du LMS : une table par classe du diagramme de classes de conception.
-- Les règles de gestion (RG) sont garanties au niveau de la base quand c'est possible.
-- Valeurs des statuts (sans accents) : actif/desactive ; brouillon/publiee/archivee ; en_attente/validee/refusee/annulee ;
--                                      brouillon/publie ; soumise/corrigee.

CREATE TABLE IF NOT EXISTS role (
  id_role   SERIAL PRIMARY KEY,
  nom_role  VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS utilisateur (
  id_utilisateur  SERIAL PRIMARY KEY,
  identifiant     VARCHAR(50)  NOT NULL UNIQUE,
  mot_de_passe    VARCHAR(255) NOT NULL,            -- haché (bcrypt), jamais en clair (RG2)
  nom             VARCHAR(100) NOT NULL,
  prenom          VARCHAR(100) NOT NULL,
  statut_compte   VARCHAR(10)  NOT NULL DEFAULT 'actif' CHECK (statut_compte IN ('actif', 'desactive'))
);

-- Association Utilisateur 0..* -- 1..* Rôle (RG1 : le « au moins un rôle » est contrôlé par le service)
CREATE TABLE IF NOT EXISTS utilisateur_role (
  id_utilisateur  INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur),
  id_role         INTEGER NOT NULL REFERENCES role(id_role),
  PRIMARY KEY (id_utilisateur, id_role)
);

CREATE TABLE IF NOT EXISTS formation (
  id_formation      SERIAL PRIMARY KEY,
  intitule          VARCHAR(150) NOT NULL UNIQUE,
  description       VARCHAR(500),
  duree             INTEGER CHECK (duree > 0),
  public_vise       VARCHAR(150),
  statut_formation  VARCHAR(10) NOT NULL DEFAULT 'brouillon' CHECK (statut_formation IN ('brouillon', 'publiee', 'archivee'))
);

CREATE TABLE IF NOT EXISTS session (
  id_session     SERIAL PRIMARY KEY,
  id_formation   INTEGER NOT NULL REFERENCES formation(id_formation),
  date_debut     DATE NOT NULL,
  date_fin       DATE NOT NULL,
  capacite_max   INTEGER NOT NULL CHECK (capacite_max > 0),
  CHECK (date_fin >= date_debut)
);

-- Association Session 0..* -- 0..* Utilisateur (formateurs affectés à une session)
CREATE TABLE IF NOT EXISTS affectation (
  id_session      INTEGER NOT NULL REFERENCES session(id_session),
  id_utilisateur  INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur),
  PRIMARY KEY (id_session, id_utilisateur)
);

-- Classe Inscription : un apprenant, une session (RG7 : une inscription par apprenant et par session)
CREATE TABLE IF NOT EXISTS inscription (
  id_inscription      SERIAL PRIMARY KEY,
  id_utilisateur      INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur),
  id_session          INTEGER NOT NULL REFERENCES session(id_session),
  date_inscription    DATE NOT NULL DEFAULT CURRENT_DATE,
  statut_inscription  VARCHAR(10) NOT NULL DEFAULT 'en_attente'
                      CHECK (statut_inscription IN ('en_attente', 'validee', 'refusee', 'annulee')),
  UNIQUE (id_utilisateur, id_session)
);

CREATE TABLE IF NOT EXISTS module (
  id_module      SERIAL PRIMARY KEY,
  id_formation   INTEGER NOT NULL REFERENCES formation(id_formation),
  id_auteur      INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur),   -- RG9 : seul l'auteur modifie son module
  titre          VARCHAR(150) NOT NULL,
  description    VARCHAR(500),
  ordre          INTEGER NOT NULL DEFAULT 1,
  statut_module  VARCHAR(10) NOT NULL DEFAULT 'brouillon' CHECK (statut_module IN ('brouillon', 'publie'))
);

CREATE TABLE IF NOT EXISTS lecon (
  id_lecon    SERIAL PRIMARY KEY,
  id_module   INTEGER NOT NULL REFERENCES module(id_module) ON DELETE CASCADE,   -- composition
  titre       VARCHAR(150) NOT NULL,
  contenu     TEXT
);

CREATE TABLE IF NOT EXISTS ressource (
  id_ressource    SERIAL PRIMARY KEY,
  id_module       INTEGER NOT NULL REFERENCES module(id_module) ON DELETE CASCADE,
  nom_fichier     VARCHAR(255) NOT NULL,
  chemin_fichier  VARCHAR(255) NOT NULL
);

-- Table evaluation modifiée pour intégrer le QCM
CREATE TABLE IF NOT EXISTS evaluation (
  id_evaluation  SERIAL PRIMARY KEY,
  id_module      INTEGER NOT NULL REFERENCES module(id_module) ON DELETE CASCADE,
  intitule       VARCHAR(150) NOT NULL,
  consigne       VARCHAR(1000),
  note_maximale  INTEGER NOT NULL CHECK (note_maximale > 0),
  type_evaluation varchar(10) NOT NULL DEFAULT 'fichier' CHECK (type_evaluation IN ('fichier', 'qcm', 'mixte')),
  duree_minutes integer CHECK (duree_minutes IS NULL OR duree_minutes > 0),
  seuil_reussite numeric(5,2) CHECK (seuil_reussite IS NULL OR (seuil_reussite BETWEEN 0 AND 100)),
  nb_tentatives_max integer NOT NULL DEFAULT 1 CHECK (nb_tentatives_max >= 1)
);

-- RG10 : une seule soumission par inscription et par évaluation ; RG11 : note >= 0 (borne haute contrôlée par le service)
CREATE TABLE IF NOT EXISTS soumission (
  id_soumission      SERIAL PRIMARY KEY,
  id_inscription     INTEGER NOT NULL REFERENCES inscription(id_inscription),
  id_evaluation      INTEGER NOT NULL REFERENCES evaluation(id_evaluation),
  date_depot         TIMESTAMP NOT NULL DEFAULT NOW(),
  nom_fichier        VARCHAR(255),
  chemin_fichier     VARCHAR(255),
  note               NUMERIC(5,2) CHECK (note >= 0),
  commentaire        VARCHAR(255),
  statut_soumission  VARCHAR(10) NOT NULL DEFAULT 'soumise' CHECK (statut_soumission IN ('soumise', 'corrigee')),
  UNIQUE (id_inscription, id_evaluation)
);

-- RG14 : au plus une attestation par inscription, avec un numéro unique
CREATE TABLE IF NOT EXISTS attestation (
  id_attestation      SERIAL PRIMARY KEY,
  id_inscription      INTEGER NOT NULL UNIQUE REFERENCES inscription(id_inscription),
  numero_attestation  VARCHAR(20) NOT NULL UNIQUE,
  date_delivrance     DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ==========================================
-- NOUVELLES TABLES POUR LE QCM
-- ==========================================

CREATE TABLE IF NOT EXISTS question (
  id_question      SERIAL PRIMARY KEY,
  id_evaluation    INTEGER NOT NULL REFERENCES evaluation(id_evaluation) ON DELETE CASCADE,
  enonce           TEXT NOT NULL,
  type_question    VARCHAR(15) NOT NULL DEFAULT 'choix_unique' CHECK (type_question IN ('choix_unique', 'vrai_faux')),
  ordre            INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS proposition (
  id_proposition   SERIAL PRIMARY KEY,
  id_question      INTEGER NOT NULL REFERENCES question(id_question) ON DELETE CASCADE,
  texte            VARCHAR(500) NOT NULL,
  est_correcte     BOOLEAN NOT NULL DEFAULT false,
  ordre            INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tentative (
  id_tentative      SERIAL PRIMARY KEY,
  id_inscription    INTEGER NOT NULL REFERENCES inscription(id_inscription),
  id_evaluation     INTEGER NOT NULL REFERENCES evaluation(id_evaluation),
  numero_tentative  INTEGER NOT NULL,
  date_debut        TIMESTAMP NOT NULL DEFAULT now(),
  date_fin          TIMESTAMP,
  score             NUMERIC(5,2),
  score_max         NUMERIC(5,2),
  statut            VARCHAR(10) NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'soumise', 'expiree')),
  UNIQUE (id_inscription, id_evaluation, numero_tentative)
);

CREATE TABLE IF NOT EXISTS reponse_tentative (
  id_reponse        SERIAL PRIMARY KEY,
  id_tentative      INTEGER NOT NULL REFERENCES tentative(id_tentative) ON DELETE CASCADE,
  id_question       INTEGER NOT NULL REFERENCES question(id_question),
  id_proposition    INTEGER NOT NULL REFERENCES proposition(id_proposition),
  est_correcte      BOOLEAN NOT NULL,
  UNIQUE (id_tentative, id_question)
);

-- ==========================================
-- INDEX
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_session_formation     ON session(id_formation);
CREATE INDEX IF NOT EXISTS idx_inscription_session   ON inscription(id_session);
CREATE INDEX IF NOT EXISTS idx_module_formation      ON module(id_formation);
CREATE INDEX IF NOT EXISTS idx_lecon_module          ON lecon(id_module);
CREATE INDEX IF NOT EXISTS idx_ressource_module      ON ressource(id_module);
CREATE INDEX IF NOT EXISTS idx_evaluation_module     ON evaluation(id_module);
CREATE INDEX IF NOT EXISTS idx_soumission_inscription ON soumission(id_inscription);
CREATE INDEX IF NOT EXISTS idx_affectation_utilisateur ON affectation(id_utilisateur);

-- Nouveaux index pour le QCM
CREATE INDEX IF NOT EXISTS idx_question_eval         ON question(id_evaluation);
CREATE INDEX IF NOT EXISTS idx_prop_question         ON proposition(id_question);
CREATE INDEX IF NOT EXISTS idx_tentative_insc        ON tentative(id_inscription, id_evaluation);
CREATE INDEX IF NOT EXISTS idx_rep_tentative         ON reponse_tentative(id_tentative);

-- Les trois rôles de la plateforme (RG1)
INSERT INTO role (nom_role) VALUES ('administrateur'), ('formateur'), ('apprenant') ON CONFLICT (nom_role) DO NOTHING;