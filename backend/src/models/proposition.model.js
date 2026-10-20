// Modèle : classe Proposition (requêtes SQL uniquement).
import { query } from "../config/db.js";

const COLS = "id_proposition, id_question, texte, est_correcte, ordre";

export const findByQuestion = async (idQuestion) => 
  (await query(`SELECT ${COLS} FROM proposition WHERE id_question=$1 ORDER BY ordre, id_proposition`, [idQuestion])).rows;

export const findById = async (id) => 
  (await query(`SELECT ${COLS} FROM proposition WHERE id_proposition=$1`, [id])).rows[0] || null;

export const insert = async (idQuestion, { texte, estCorrecte, ordre }) =>
  (await query(
    "INSERT INTO proposition (id_question, texte, est_correcte, ordre) VALUES ($1,$2,$3,$4) RETURNING id_proposition",
    [idQuestion, texte, estCorrecte || false, ordre || 1]
  )).rows[0].id_proposition;

export const update = (id, { texte, estCorrecte, ordre }) =>
  query("UPDATE proposition SET texte=$2, est_correcte=$3, ordre=$4 WHERE id_proposition=$1", 
    [id, texte, estCorrecte || false, ordre || 1]);

export const remove = (id) => query("DELETE FROM proposition WHERE id_proposition=$1", [id]);