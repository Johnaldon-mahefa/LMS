-- 1. Leçon (déjà créée, on la garde)

-- 2. Ressource : vidéo locale
INSERT INTO ressource (id_module, nom_fichier, chemin_fichier)
SELECT m.id_module, 'Vidéo : Introduction HTML (locale)', 'uploads/demo/demo.mp4'
FROM module m
JOIN formation f ON m.id_formation = f.id_formation
WHERE f.intitule = 'Dev Web Full Stack - Démo'
  AND NOT EXISTS (
    SELECT 1 FROM ressource r
    WHERE r.id_module = m.id_module AND r.nom_fichier = 'Vidéo : Introduction HTML (locale)'
  );

-- 3. Ressource : vidéo en ligne (YouTube)
INSERT INTO ressource (id_module, nom_fichier, chemin_fichier)
SELECT m.id_module, 'Vidéo : Cours HTML par Grafikart', 'https://www.youtube.com/watch?v=UB1O30fR-EE'
FROM module m
JOIN formation f ON m.id_formation = f.id_formation
WHERE f.intitule = 'Dev Web Full Stack - Démo'
  AND NOT EXISTS (
    SELECT 1 FROM ressource r
    WHERE r.id_module = m.id_module AND r.nom_fichier = 'Vidéo : Cours HTML par Grafikart'
  );

-- 4. Ressource : PDF
INSERT INTO ressource (id_module, nom_fichier, chemin_fichier)
SELECT m.id_module, 'Support de cours HTML (PDF)', 'uploads/demo/html.pdf'
FROM module m
JOIN formation f ON m.id_formation = f.id_formation
WHERE f.intitule = 'Dev Web Full Stack - Démo'
  AND NOT EXISTS (
    SELECT 1 FROM ressource r
    WHERE r.id_module = m.id_module AND r.nom_fichier = 'Support de cours HTML (PDF)'
  );
