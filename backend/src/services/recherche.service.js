// Service : recherche globale (formations, modules, évaluations, utilisateurs selon le rôle).
import { query } from "../config/db.js";

export async function rechercher(terme, utilisateur) {
  const q = `%${String(terme || "").trim().toLowerCase()}%`;
  const estAdmin = utilisateur.roles.includes("administrateur");
  const estFormateur = utilisateur.roles.includes("formateur");

  const resultats = { formations: [], modules: [], evaluations: [], utilisateurs: [] };

  // Formations : admin voit tout, sinon uniquement publiées
  {
    const filtre = estAdmin ? "" : "AND statut_formation = 'publiee'";
    const { rows } = await query(
      `SELECT id_formation, intitule, statut_formation
       FROM formation
       WHERE LOWER(intitule) LIKE $1 ${filtre}
       ORDER BY intitule LIMIT 5`,
      [q]
    );
    resultats.formations = rows;
  }

  // Modules : uniquement pour admin/formateur
  if (estAdmin || estFormateur) {
    let filtre = "";
    const params = [q];
    if (estFormateur) {
      filtre = "AND m.id_auteur = $2";
      params.push(utilisateur.id);
    }
    const { rows } = await query(
      `SELECT m.id_module, m.titre, m.statut_module, f.intitule AS formation
       FROM module m
       JOIN formation f ON f.id_formation = m.id_formation
       WHERE LOWER(m.titre) LIKE $1 ${filtre}
       ORDER BY m.titre LIMIT 5`,
      params
    );
    resultats.modules = rows;
  }

  // Évaluations : admin/formateur
  if (estAdmin || estFormateur) {
    const { rows } = await query(
      `SELECT e.id_evaluation, e.intitule, m.id_module, m.titre AS module
       FROM evaluation e
       JOIN module m ON m.id_module = e.id_module
       WHERE LOWER(e.intitule) LIKE $1
       ORDER BY e.intitule LIMIT 5`,
      [q]
    );
    resultats.evaluations = rows;
  }

  // Utilisateurs : admin uniquement
  if (estAdmin) {
    const { rows } = await query(
      `SELECT id_utilisateur, nom, prenom, identifiant
       FROM utilisateur
       WHERE LOWER(nom) LIKE $1 OR LOWER(prenom) LIKE $1 OR LOWER(identifiant) LIKE $1
       ORDER BY nom, prenom LIMIT 5`,
      [q]
    );
    resultats.utilisateurs = rows;
  }

  return resultats;
}