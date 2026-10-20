// Modèle : classe Évaluation (requêtes SQL uniquement).
import { query } from "../config/db.js";

// IMPORTANT : On ajoute type_evaluation et les autres colonnes ici !
const COLS = "id_evaluation, id_module, intitule, consigne, note_maximale, type_evaluation, duree_minutes, seuil_reussite, nb_tentatives_max";

export const findByModule = async (idModule) => 
  (await query(`SELECT ${COLS} FROM evaluation WHERE id_module=$1 ORDER BY id_evaluation`, [idModule])).rows;

export const findById = async (id) => 
  (await query(`SELECT ${COLS} FROM evaluation WHERE id_evaluation=$1`, [id])).rows[0] || null;

export const insert = async (idModule, { intitule, consigne, noteMaximale, typeEvaluation, dureeMinutes, seuilReussite, nbTentativesMax }) =>
  (await query(
    "INSERT INTO evaluation (id_module, intitule, consigne, note_maximale, type_evaluation, duree_minutes, seuil_reussite, nb_tentatives_max) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id_evaluation",
    [idModule, intitule, consigne || null, noteMaximale, typeEvaluation || 'fichier', dureeMinutes || null, seuilReussite || null, nbTentativesMax || 1]
  )).rows[0].id_evaluation;

export const update = (id, { intitule, consigne, noteMaximale, typeEvaluation, dureeMinutes, seuilReussite, nbTentativesMax }) =>
  query(
    "UPDATE evaluation SET intitule=$2, consigne=$3, note_maximale=$4, type_evaluation=$5, duree_minutes=$6, seuil_reussite=$7, nb_tentatives_max=$8 WHERE id_evaluation=$1", 
    [id, intitule, consigne || null, noteMaximale, typeEvaluation || 'fichier', dureeMinutes || null, seuilReussite || null, nbTentativesMax || 1]
  );

export const remove = (id) => query("DELETE FROM evaluation WHERE id_evaluation=$1", [id]);
export const countSoumissions = async (id) => (await query("SELECT COUNT(*)::int AS n FROM soumission WHERE id_evaluation=$1", [id])).rows[0].n;