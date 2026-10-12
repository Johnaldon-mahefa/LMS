-- ============================================================
-- SCRIPT DE DÉMONSTRATION : parcours complet jusqu'à l'attestation
-- ============================================================

-- Nettoyage des anciennes données de démo (optionnel)
DELETE FROM attestation WHERE id_inscription IN (
  SELECT i.id_inscription FROM inscription i
  JOIN session s ON i.id_session = s.id_session
  JOIN formation f ON s.id_formation = f.id_formation
  WHERE f.intitule = 'Dev Web Full Stack - Démo'
);
DELETE FROM soumission WHERE id_inscription IN (
  SELECT i.id_inscription FROM inscription i
  JOIN session s ON i.id_session = s.id_session
  JOIN formation f ON s.id_formation = f.id_formation
  WHERE f.intitule = 'Dev Web Full Stack - Démo'
);
DELETE FROM inscription WHERE id_session IN (
  SELECT s.id_session FROM session s
  JOIN formation f ON s.id_formation = f.id_formation
  WHERE f.intitule = 'Dev Web Full Stack - Démo'
);
DELETE FROM evaluation WHERE id_module IN (
  SELECT m.id_module FROM module m
  JOIN formation f ON m.id_formation = f.id_formation
  WHERE f.intitule = 'Dev Web Full Stack - Démo'
);
DELETE FROM lecon WHERE id_module IN (
  SELECT m.id_module FROM module m
  JOIN formation f ON m.id_formation = f.id_formation
  WHERE f.intitule = 'Dev Web Full Stack - Démo'
);
DELETE FROM module WHERE id_formation IN (
  SELECT id_formation FROM formation WHERE intitule = 'Dev Web Full Stack - Démo'
);
DELETE FROM affectation WHERE id_session IN (
  SELECT s.id_session FROM session s
  JOIN formation f ON s.id_formation = f.id_formation
  WHERE f.intitule = 'Dev Web Full Stack - Démo'
);
DELETE FROM session WHERE id_formation IN (
  SELECT id_formation FROM formation WHERE intitule = 'Dev Web Full Stack - Démo'
);
DELETE FROM formation WHERE intitule = 'Dev Web Full Stack - Démo';

-- 1. Créer une formation publiée
INSERT INTO formation (intitule, description, duree, public_vise, statut_formation)
VALUES ('Dev Web Full Stack - Démo', 'Formation de démonstration pour le jury', 40, 'Débutants', 'publiee');

-- 2. Créer une session
INSERT INTO session (id_formation, date_debut, date_fin, capacite_max)
SELECT id_formation, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 20
FROM formation WHERE intitule = 'Dev Web Full Stack - Démo';

-- 3. Affecter formateur1 à la session
INSERT INTO affectation (id_session, id_utilisateur)
SELECT s.id_session, u.id_utilisateur
FROM session s
JOIN formation f ON s.id_formation = f.id_formation
JOIN utilisateur u ON u.identifiant = 'formateur1'
WHERE f.intitule = 'Dev Web Full Stack - Démo';

-- 4. Créer un module publié
INSERT INTO module (id_formation, id_auteur, titre, description, ordre, statut_module)
SELECT f.id_formation, u.id_utilisateur, 'Module 1 : HTML et CSS', 'Les bases du développement web', 1, 'publie'
FROM formation f
JOIN utilisateur u ON u.identifiant = 'formateur1'
WHERE f.intitule = 'Dev Web Full Stack - Démo';

-- 5. Ajouter une leçon
INSERT INTO lecon (id_module, titre, contenu)
SELECT m.id_module, 'Leçon 1 : Structure HTML', 'Une page HTML est composée de balises imbriquées.'
FROM module m
JOIN formation f ON m.id_formation = f.id_formation
WHERE f.intitule = 'Dev Web Full Stack - Démo';

-- 6. Ajouter une évaluation (note max 20)
INSERT INTO evaluation (id_module, intitule, consigne, note_maximale)
SELECT m.id_module, 'Évaluation HTML', 'Créer une page HTML présentant votre CV.', 20
FROM module m
JOIN formation f ON m.id_formation = f.id_formation
WHERE f.intitule = 'Dev Web Full Stack - Démo';

-- 7. Inscrire apprenant1 (statut validée)
INSERT INTO inscription (id_utilisateur, id_session, statut_inscription)
SELECT u.id_utilisateur, s.id_session, 'validee'
FROM session s
JOIN formation f ON s.id_formation = f.id_formation
JOIN utilisateur u ON u.identifiant = 'apprenant1'
WHERE f.intitule = 'Dev Web Full Stack - Démo';

-- 8. Créer une soumission déposée par apprenant1
INSERT INTO soumission (id_inscription, id_evaluation, nom_fichier, chemin_fichier, statut_soumission)
SELECT i.id_inscription, e.id_evaluation, 'cv.html', 'uploads/demo/cv.html', 'soumise'
FROM inscription i
JOIN session s ON i.id_session = s.id_session
JOIN formation f ON s.id_formation = f.id_formation
JOIN module m ON m.id_formation = f.id_formation
JOIN evaluation e ON e.id_module = m.id_module
JOIN utilisateur u ON i.id_utilisateur = u.id_utilisateur
WHERE f.intitule = 'Dev Web Full Stack - Démo'
  AND u.identifiant = 'apprenant1';

-- 9. Corriger la soumission avec note 16/20 = 80% (>= 50%)
UPDATE soumission
SET note = 16, commentaire = 'Très bon travail, bien structuré.', statut_soumission = 'corrigee'
WHERE id_soumission IN (
  SELECT s.id_soumission FROM soumission s
  JOIN inscription i ON s.id_inscription = i.id_inscription
  JOIN utilisateur u ON i.id_utilisateur = u.id_utilisateur
  JOIN session se ON i.id_session = se.id_session
  JOIN formation f ON se.id_formation = f.id_formation
  WHERE u.identifiant = 'apprenant1' AND f.intitule = 'Dev Web Full Stack - Démo'
);

-- ============================================================
-- RÉSULTAT :
-- - Formation publiée avec 1 module publié
-- - 1 leçon + 1 évaluation (note max 20)
-- - apprenant1 inscrit (validée)
-- - Soumission corrigée : 16/20 = 80% (>= seuil 50%)
-- - Le module est donc VALIDÉ pour apprenant1
-- → apprenant1 peut demander son attestation via l'interface
-- ============================================================
