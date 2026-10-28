-- 1. Création des tables pour les Plans et Fonctionnalités
CREATE TABLE IF NOT EXISTS plan (
  id_plan SERIAL PRIMARY KEY,
  nom VARCHAR(50) NOT NULL UNIQUE,
  prix_mensuel NUMERIC(10,2) NOT NULL DEFAULT 0,
  description VARCHAR(255),
  est_actif BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS fonctionnalite (
  id_fonctionnalite SERIAL PRIMARY KEY,
  code_unique VARCHAR(50) NOT NULL UNIQUE, -- Ex: 'QCM', 'EXPORT_PDF', 'ATTESTATION'
  nom VARCHAR(100) NOT NULL,
  description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS plan_fonctionnalite (
  id_plan INTEGER NOT NULL REFERENCES plan(id_plan) ON DELETE CASCADE,
  id_fonctionnalite INTEGER NOT NULL REFERENCES fonctionnalite(id_fonctionnalite) ON DELETE CASCADE,
  PRIMARY KEY (id_plan, id_fonctionnalite)
);

-- 2. Modification de la table etablissement (Ajout du plan)
ALTER TABLE etablissement 
ADD COLUMN IF NOT EXISTS id_plan INTEGER REFERENCES plan(id_plan) DEFAULT 1,
ADD COLUMN IF NOT EXISTS statut_abonnement VARCHAR(20) DEFAULT 'actif',
ADD COLUMN IF NOT EXISTS date_expiration_abonnement DATE;

-- 3. Modification de la table utilisateur (Pour OAuth)
ALTER TABLE utilisateur 
ALTER COLUMN mot_de_passe DROP NOT NULL, -- Le mot de passe devient optionnel pour Google/FB
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(255) UNIQUE;

-- 4. Insertion des données de base (Plans et Fonctionnalités)
INSERT INTO fonctionnalite (code_unique, nom, description) VALUES
('QCM', 'Moteur QCM', 'Création et passage de QCM chronométrés'),
('EXPORT_PDF', 'Export PDF', 'Exportation des suivis et rapports en PDF'),
('ATTESTATION', 'Attestations', 'Génération automatique d''attestations PDF'),
('MULTI_FORMATEUR', 'Multi-Formateurs', 'Affectation de plusieurs formateurs par session')
ON CONFLICT (code_unique) DO NOTHING;

INSERT INTO plan (nom, prix_mensuel, description) VALUES
('Découverte', 0.00, 'Plan gratuit avec fonctionnalités de base'),
('Pro', 29.99, 'Plan pour les centres de formation actifs'),
('Entreprise', 99.99, 'Plan complet sans aucune limitation')
ON CONFLICT (nom) DO NOTHING;

-- 5. Attribution des fonctionnalités aux plans (Exemple)
-- Plan Découverte (id=1) : Aucune fonctionnalité avancée (juste les cours de base)
-- Plan Pro (id=2) : QCM, Attestations, Export PDF
INSERT INTO plan_fonctionnalite (id_plan, id_fonctionnalite)
SELECT 2, id_fonctionnalite FROM fonctionnalite WHERE code_unique IN ('QCM', 'ATTESTATION', 'EXPORT_PDF')
ON CONFLICT DO NOTHING;

-- Plan Entreprise (id=3) : TOUT
INSERT INTO plan_fonctionnalite (id_plan, id_fonctionnalite)
SELECT 3, id_fonctionnalite FROM fonctionnalite
ON CONFLICT DO NOTHING;
