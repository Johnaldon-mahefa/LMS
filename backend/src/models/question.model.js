// Modèle : classe Question (requêtes SQL uniquement).
import { query } from "../config/db.js";

const COLS = "id_question, id_evaluation, enonce, type_question, ordre";

export const findByEvaluation = async (idEvaluation) => 
  (await query(`SELECT ${COLS} FROM question WHERE id_evaluation=$1 ORDER BY ordre, id_question`, [idEvaluation])).rows;

export const findById = async (id) => 
  (await query(`SELECT ${COLS} FROM question WHERE id_question=$1`, [id])).rows[0] || null;

export const insert = async (idEvaluation, { enonce, typeQuestion, ordre }) =>
  (await query(
    "INSERT INTO question (id_evaluation, enonce, type_question, ordre) VALUES ($1,$2,$3,$4) RETURNING id_question",
    [idEvaluation, enonce, typeQuestion || 'choix_unique', ordre || 1]
  )).rows[0].id_question;

export const update = (id, { enonce, typeQuestion, ordre }) =>
  query("UPDATE question SET enonce=$2, type_question=$3, ordre=$4 WHERE id_question=$1", 
    [id, enonce, typeQuestion || 'choix_unique', ordre || 1]);

export const remove = (id) => query("DELETE FROM question WHERE id_question=$1", [id]);