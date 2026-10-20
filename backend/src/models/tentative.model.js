// Modèle : classe Tentative (requêtes SQL uniquement).
import { query } from "../config/db.js";

const COLS = "id_tentative, id_inscription, id_evaluation, numero_tentative, date_debut, date_fin, score, score_max, statut";

export const findById = async (id) => 
  (await query(`SELECT ${COLS} FROM tentative WHERE id_tentative=$1`, [id])).rows[0] || null;

export const findEnCours = async (idInscription, idEvaluation) => 
  (await query(
    `SELECT * FROM tentative 
     WHERE id_inscription=$1 AND id_evaluation=$2 AND statut='en_cours' 
     ORDER BY id_tentative DESC LIMIT 1`, 
    [idInscription, idEvaluation]
  )).rows[0] || null;

export const compterTentatives = async (idInscription, idEvaluation) => 
  (await query("SELECT COUNT(*)::int AS n FROM tentative WHERE id_inscription=$1 AND id_evaluation=$2", [idInscription, idEvaluation])).rows[0].n;

export const findMeilleureTentative = async (idInscription, idEvaluation) => 
  (await query(`SELECT ${COLS} FROM tentative WHERE id_inscription=$1 AND id_evaluation=$2 AND statut IN ('soumise', 'expiree') ORDER BY score DESC LIMIT 1`, [idInscription, idEvaluation])).rows[0] || null;

// CETTE FONCTION EST VITALE POUR LE SCORE
export const findMeilleuresParInscription = async (idInscription) => 
  (await query(
    `SELECT id_evaluation, MAX(score) AS score 
     FROM tentative 
     WHERE id_inscription=$1 AND statut IN ('soumise', 'expiree') 
     GROUP BY id_evaluation`, 
    [idInscription]
  )).rows;

export const insert = async ({ idInscription, idEvaluation, numeroTentative }) =>
  (await query(
    "INSERT INTO tentative (id_inscription, id_evaluation, numero_tentative) VALUES ($1,$2,$3) RETURNING id_tentative",
    [idInscription, idEvaluation, numeroTentative]
  )).rows[0].id_tentative;

export const terminer = (id, { score, scoreMax, statut }) =>
  query("UPDATE tentative SET score=$2, score_max=$3, statut=$4, date_fin=now() WHERE id_tentative=$1", 
    [id, score, scoreMax, statut]);