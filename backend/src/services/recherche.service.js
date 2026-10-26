import { query } from "../config/db.js";

export async function rechercher(terme, idEtablissement, rolesUtilisateur) {
  if (!terme || terme.trim().length < 2) {
    return { formations: [], modules: [], evaluations: [], utilisateurs: [] };
  }

  const q = `%${terme.trim()}%`;
  const estAdmin = rolesUtilisateur.includes("administrateur");

  // 1. Recherche dans les formations (filtrées par école)
  const formations = (await query(`
    SELECT f.id_formation, f.intitule, f.statut_formation
    FROM formation f
    WHERE f.id_etablissement = $1 
      AND f.intitule ILIKE $2
    LIMIT 5
  `, [idEtablissement, q])).rows;

  // 2. Recherche dans les modules
  const modules = (await query(`
    SELECT m.id_module, m.titre, f.intitule AS formation
    FROM module m
    JOIN formation f ON m.id_formation = f.id_formation
    WHERE f.id_etablissement = $1 
      AND m.titre ILIKE $2
    LIMIT 5
  `, [idEtablissement, q])).rows;

  // 3. Recherche dans les évaluations
  const evaluations = (await query(`
    SELECT e.id_evaluation, e.intitule, e.id_module, m.titre AS module
    FROM evaluation e
    JOIN module m ON e.id_module = m.id_module
    JOIN formation f ON m.id_formation = f.id_formation
    WHERE f.id_etablissement = $1 
      AND e.intitule ILIKE $2
    LIMIT 5
  `, [idEtablissement, q])).rows;

  // 4. Recherche dans les utilisateurs
  let utilisateurs = [];
  if (estAdmin) {
    utilisateurs = (await query(`
      SELECT u.id_utilisateur, u.nom, u.prenom, u.identifiant
      FROM utilisateur u
      JOIN utilisateur_etablissement_role uer ON u.id_utilisateur = uer.id_utilisateur
      WHERE uer.id_etablissement = $1 
        AND (u.nom ILIKE $2 OR u.prenom ILIKE $2 OR u.identifiant ILIKE $2)
      LIMIT 5
    `, [idEtablissement, q])).rows;
  }

  return { formations, modules, evaluations, utilisateurs };
}