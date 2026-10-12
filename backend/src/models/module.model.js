// Modèle : classe Module (requêtes SQL uniquement).
import { query } from "../config/db.js";

const COLONNES = `m.id_module, m.id_formation, m.id_auteur, m.titre, m.description, m.ordre, m.statut_module,
  (SELECT COUNT(*) FROM lecon l WHERE l.id_module = m.id_module)::int AS nb_lecons,
  (SELECT COUNT(*) FROM evaluation e WHERE e.id_module = m.id_module)::int AS nb_evaluations`;

export async function findById(id) {
  return (await query(`SELECT ${COLONNES} FROM module m WHERE m.id_module = $1`, [id])).rows[0] || null;
}
export async function findByFormation(idFormation, { seulementPublies = false } = {}) {
  return (await query(
    `SELECT ${COLONNES} FROM module m WHERE m.id_formation = $1 ${seulementPublies ? "AND m.statut_module = 'publie'" : ""} ORDER BY m.ordre, m.id_module`,
    [idFormation])).rows;
}
export async function insert({ idFormation, idAuteur, titre, description, ordre }) {
  return (await query(
    "INSERT INTO module (id_formation, id_auteur, titre, description, ordre) VALUES ($1,$2,$3,$4,$5) RETURNING id_module",
    [idFormation, idAuteur, titre, description || null, ordre || 1])).rows[0].id_module;
}
export const update = (id, { titre, description, ordre }) =>
  query("UPDATE module SET titre=$2, description=$3, ordre=$4 WHERE id_module=$1", [id, titre, description || null, ordre || 1]);
export const setStatut = (id, statut) => query("UPDATE module SET statut_module=$2 WHERE id_module=$1", [id, statut]);
export const remove = (id) => query("DELETE FROM module WHERE id_module = $1", [id]);
export async function countSoumissions(idModule) {
  return (await query(
    "SELECT COUNT(*)::int AS n FROM soumission s JOIN evaluation e ON e.id_evaluation = s.id_evaluation WHERE e.id_module = $1", [idModule])).rows[0].n;
}
