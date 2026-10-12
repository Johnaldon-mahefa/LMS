-- ATTENTION : supprime toutes les tables et toutes les données. À utiliser uniquement en développement.
-- Ensuite : npm run db:schema, npm run db:seed (et npm run db:demo pour les données de démonstration).
DROP TABLE IF EXISTS attestation, soumission, evaluation, ressource, lecon, module,
  inscription, affectation, session, formation, utilisateur_role, utilisateur, role CASCADE;
