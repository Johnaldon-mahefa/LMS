// Modèle : classe Évaluation (requêtes SQL uniquement).
import { query } from "../config/db.js";

const COLS = "id_evaluation, id_module, intitule, consigne, note_maximale";
export const findByModule = async (idModule) => (await query(`SELECT ${COLS} FROM evaluation WHERE id_module=$1 ORDER BY id_evaluation`, [idModule])).rows;
export const findById = async (id) => (await query(`SELECT ${COLS} FROM evaluation WHERE id_evaluation=$1`, [id])).rows[0] || null;
export const insert = async (idModule, { intitule, consigne, noteMaximale }) =>
  (await query("INSERT INTO evaluation (id_module, intitule, consigne, note_maximale) VALUES ($1,$2,$3,$4) RETURNING id_evaluation",
    [idModule, intitule, consigne || null, noteMaximale])).rows[0].id_evaluation;
export const update = (id, { intitule, consigne, noteMaximale }) =>
  query("UPDATE evaluation SET intitule=$2, consigne=$3, note_maximale=$4 WHERE id_evaluation=$1", [id, intitule, consigne || null, noteMaximale]);
export const remove = (id) => query("DELETE FROM evaluation WHERE id_evaluation=$1", [id]);
export const countSoumissions = async (id) => (await query("SELECT COUNT(*)::int AS n FROM soumission WHERE id_evaluation=$1", [id])).rows[0].n;
