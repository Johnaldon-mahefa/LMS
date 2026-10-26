// Modèle : classe Formation (requêtes SQL uniquement).
import { query } from "../config/db.js";

const COLONNES = `f.id_formation, f.id_etablissement, f.intitule, f.description, f.duree, f.public_vise, f.statut_formation,
  (SELECT COUNT(*) FROM session s WHERE s.id_formation = f.id_formation)::int AS nb_sessions,
  (SELECT COUNT(*) FROM module m WHERE m.id_formation = f.id_formation)::int AS nb_modules,
  (SELECT COUNT(*) FROM module m WHERE m.id_formation = f.id_formation AND m.statut_module = 'publie')::int AS nb_modules_publies`;

export async function findAllByEtablissement(idEtablissement) {
  return (await query(`SELECT ${COLONNES} FROM formation f WHERE f.id_etablissement = $1 ORDER BY f.intitule`, [idEtablissement])).rows;
}

export async function findPubliees(idEtablissement) {
  return (await query(`SELECT ${COLONNES} FROM formation f WHERE f.statut_formation = 'publiee' AND f.id_etablissement = $1 ORDER BY f.intitule`, [idEtablissement])).rows;
}

export async function findById(id) {
  return (await query(`SELECT ${COLONNES} FROM formation f WHERE f.id_formation = $1`, [id])).rows[0] || null;
}

// MULTI-TENANT : On ajoute idEtablissement
export async function findAffecteesA(idFormateur, idEtablissement) {
  return (await query(
    `SELECT ${COLONNES} FROM formation f
     WHERE f.id_etablissement = $2 
       AND EXISTS (SELECT 1 FROM session s JOIN affectation a ON a.id_session = s.id_session
                   WHERE s.id_formation = f.id_formation AND a.id_utilisateur = $1)
     ORDER BY f.intitule`, [idFormateur, idEtablissement])).rows;
}

export async function formateurAffecte(idFormation, idFormateur) {
  const { rows } = await query(
    `SELECT 1 FROM session s JOIN affectation a ON a.id_session = s.id_session
     WHERE s.id_formation = $1 AND a.id_utilisateur = $2 LIMIT 1`, [idFormation, idFormateur]);
  return rows.length > 0;
}

export async function existsIntitule(intitule, idEtablissement, exceptId = -1) {
  return (await query(
    "SELECT 1 FROM formation WHERE intitule = $1 AND id_etablissement = $2 AND id_formation <> $3", 
    [intitule, idEtablissement, exceptId]
  )).rows.length > 0;
}

export async function insert({ idEtablissement, intitule, description, duree, publicVise }) {
  return (await query(
    `INSERT INTO formation (id_etablissement, intitule, description, duree, public_vise) VALUES ($1,$2,$3,$4,$5) RETURNING id_formation`,
    [idEtablissement, intitule, description || null, duree || null, publicVise || null])).rows[0].id_formation;
}

export async function update(id, { intitule, description, duree, publicVise }) {
  await query(`UPDATE formation SET intitule=$2, description=$3, duree=$4, public_vise=$5 WHERE id_formation=$1`,
    [id, intitule, description || null, duree || null, publicVise || null]);
}

export const setStatut = (id, statut) => query("UPDATE formation SET statut_formation = $2 WHERE id_formation = $1", [id, statut]);
export const remove = (id) => query("DELETE FROM formation WHERE id_formation = $1", [id]);