import { query } from "../config/db.js";

const COLS = `s.id_soumission, s.id_inscription, s.id_evaluation, to_char(s.date_depot,'YYYY-MM-DD HH24:MI') AS date_depot,
  s.nom_fichier, s.chemin_fichier, s.note, s.commentaire, s.statut_soumission,
  e.intitule AS evaluation, e.consigne, e.note_maximale, e.id_module,
  i.id_utilisateur AS id_apprenant, i.id_session, u.nom, u.prenom`;
const FROM = `FROM soumission s JOIN evaluation e ON e.id_evaluation = s.id_evaluation
  JOIN inscription i ON i.id_inscription = s.id_inscription JOIN utilisateur u ON u.id_utilisateur = i.id_utilisateur`;

export async function findById(id) {
  return (await query(`SELECT ${COLS} ${FROM} WHERE s.id_soumission = $1`, [id])).rows[0] || null;
}
export async function findByInscriptionAndEvaluation(idInscription, idEvaluation) {
  return (await query(`SELECT ${COLS} ${FROM} WHERE s.id_inscription = $1 AND s.id_evaluation = $2`, [idInscription, idEvaluation])).rows[0] || null;
}

// MULTI-TENANT : On filtre par école
export async function findACorriger(idFormateur, idEtablissement) {
  return (await query(
    `SELECT ${COLS} ${FROM} 
     WHERE s.statut_soumission = 'soumise'
       AND EXISTS (SELECT 1 FROM affectation a WHERE a.id_session = i.id_session AND a.id_utilisateur = $1)
       AND e.id_module IN (
         SELECT m.id_module FROM module m 
         JOIN formation f ON m.id_formation = f.id_formation 
         WHERE f.id_etablissement = $2
       )
     ORDER BY s.date_depot`, [idFormateur, idEtablissement])).rows;
}

export async function insert({ idInscription, idEvaluation, nomFichier, cheminFichier }) {
  return (await query(
    "INSERT INTO soumission (id_inscription, id_evaluation, nom_fichier, chemin_fichier) VALUES ($1,$2,$3,$4) RETURNING id_soumission",
    [idInscription, idEvaluation, nomFichier, cheminFichier])).rows[0].id_soumission;
}
export const corriger = (id, note, commentaire) =>
  query("UPDATE soumission SET note=$2, commentaire=$3, statut_soumission='corrigee' WHERE id_soumission=$1", [id, note, commentaire || null]);

export async function evaluationsAvecResultat(idInscription, idFormation) {
  return (await query(
    `SELECT m.id_module, m.titre AS module, m.ordre, 
            e.id_evaluation, e.intitule, e.note_maximale, e.type_evaluation, e.seuil_reussite,
            s.id_soumission, s.statut_soumission, s.note, s.commentaire
     FROM module m
     LEFT JOIN evaluation e ON e.id_module = m.id_module
     LEFT JOIN soumission s ON s.id_evaluation = e.id_evaluation AND s.id_inscription = $1
     WHERE m.id_formation = $2 AND m.statut_module = 'publie'
     ORDER BY m.ordre, m.id_module, e.id_evaluation`, [idInscription, idFormation])).rows;
}
export async function countACorrigerParSession(idSession) {
  return (await query(
    `SELECT i.id_inscription, COUNT(*)::int AS n FROM soumission s JOIN inscription i ON i.id_inscription = s.id_inscription
     WHERE i.id_session = $1 AND s.statut_soumission = 'soumise' GROUP BY i.id_inscription`, [idSession])).rows;
}