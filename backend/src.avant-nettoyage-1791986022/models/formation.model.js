// Modèle : classe Formation (requêtes SQL uniquement).
import { query } from "../config/db.js";

const COLONNES = `f.id_formation, f.intitule, f.description, f.duree, f.public_vise, f.statut_formation,
  (SELECT COUNT(*) FROM session s WHERE s.id_formation = f.id_formation)::int AS nb_sessions,
  (SELECT COUNT(*) FROM module m WHERE m.id_formation = f.id_formation)::int AS nb_modules,
  (SELECT COUNT(*) FROM module m WHERE m.id_formation = f.id_formation AND m.statut_module = 'publie')::int AS nb_modules_publies`;

export async function findAll() {
  return (await query(`SELECT ${COLONNES} FROM formation f ORDER BY f.intitule`)).rows;
}
export async function findPubliees() {
  return (await query(`SELECT ${COLONNES} FROM formation f WHERE f.statut_formation = 'publiee' ORDER BY f.intitule`)).rows;
}
export async function findById(id) {
  return (await query(`SELECT ${COLONNES} FROM formation f WHERE f.id_formation = $1`, [id])).rows[0] || null;
}
export async function findAffecteesA(idFormateur) {
  return (await query(
    `SELECT ${COLONNES} FROM formation f
     WHERE EXISTS (SELECT 1 FROM session s JOIN affectation a ON a.id_session = s.id_session
                   WHERE s.id_formation = f.id_formation AND a.id_utilisateur = $1)
     ORDER BY f.intitule`, [idFormateur])).rows;
}
export async function formateurAffecte(idFormation, idFormateur) {
  const { rows } = await query(
    `SELECT 1 FROM session s JOIN affectation a ON a.id_session = s.id_session
     WHERE s.id_formation = $1 AND a.id_utilisateur = $2 LIMIT 1`, [idFormation, idFormateur]);
  return rows.length > 0;
}
export async function existsIntitule(intitule, exceptId = -1) {
  return (await query("SELECT 1 FROM formation WHERE intitule = $1 AND id_formation <> $2", [intitule, exceptId])).rows.length > 0;
}
export async function insert({ intitule, description, duree, publicVise }) {
  return (await query(
    `INSERT INTO formation (intitule, description, duree, public_vise) VALUES ($1,$2,$3,$4) RETURNING id_formation`,
    [intitule, description || null, duree || null, publicVise || null])).rows[0].id_formation;
}
export async function update(id, { intitule, description, duree, publicVise }) {
  await query(`UPDATE formation SET intitule=$2, description=$3, duree=$4, public_vise=$5 WHERE id_formation=$1`,
    [id, intitule, description || null, duree || null, publicVise || null]);
}
export const setStatut = (id, statut) => query("UPDATE formation SET statut_formation = $2 WHERE id_formation = $1", [id, statut]);
export const remove = (id) => query("DELETE FROM formation WHERE id_formation = $1", [id]);
