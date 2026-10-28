ALTER TABLE etablissement 
ADD COLUMN IF NOT EXISTS id_plan INTEGER REFERENCES plan(id_plan) DEFAULT 1,
ADD COLUMN IF NOT EXISTS statut_abonnement VARCHAR(20) DEFAULT 'actif',
ADD COLUMN IF NOT EXISTS date_expiration_abonnement DATE;
