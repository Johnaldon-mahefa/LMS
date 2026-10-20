// Modèle : classe Session et association d'affectation des formateurs (requêtes SQL uniquement).
import { query } from "../config/db.js";

const COLONNES = `s.id_session, s.id_formation, f.intitule AS formation,
  to_char(s.date_debut,'YYYY-MM-DD') AS date_debut, to_char(s.date_fin,'YYYY-MM-DD') AS date_fin, s.capacite_max,
  GREATEST(s.capacite_max - (SELECT COUNT(*) FROM inscription i WHERE i.id_session = s.id_session AND i.statut_inscription = 'validee'), 0)::int AS places_restantes,
  (SELECT COUNT(*) FROM inscription i WHERE i.id_session = s.id_session)::int AS nb_inscriptions,
  COALESCE((SELECT json_agg(json_build_object('id_utilisateur', u.id_utilisateur, 'nom', u.nom, 'prenom', u.prenom) ORDER BY u.nom)
            FROM affectation a JOIN utilisateur u ON u.id_utilisateur = a.id_utilisateur WHERE a.id_session = s.id_session), '[]') AS formateurs`;
const FROM = "FROM session s JOIN formation f ON f.id_formation = s.id_formation";

export async function findById(id) {
  return (await query(`SELECT ${COLONNES} ${FROM} WHERE s.id_session = $1`, [id])).rows[0] || null;
}
export async function findByFormation(idFormation) {
  return (await query(`SELECT ${COLONNES} ${FROM} WHERE s.id_formation = $1 ORDER BY s.date_debut`, [idFormation])).rows;
}
export async function findByFormateur(idFormateur) {
  return (await query(
    `SELECT ${COLONNES} ${FROM} WHERE EXISTS (SELECT 1 FROM affectation a WHERE a.id_session = s.id_session AND a.id_utilisateur = $1)
     ORDER BY s.date_debut DESC`, [idFormateur])).rows;
}
export async function insert(idFormation, { dateDebut, dateFin, capaciteMax }) {
  return (await query(
    "INSERT INTO session (id_formation, date_debut, date_fin, capacite_max) VALUES ($1,$2,$3,$4) RETURNING id_session",
    [idFormation, dateDebut, dateFin, capaciteMax])).rows[0].id_session;
}
export const update = (id, { dateDebut, dateFin, capaciteMax }) =>
  query("UPDATE session SET date_debut=$2, date_fin=$3, capacite_max=$4 WHERE id_session=$1", [id, dateDebut, dateFin, capaciteMax]);
export const remove = (id) => query("DELETE FROM session WHERE id_session = $1", [id]);

export async function formateurAffecte(idSession, idUtilisateur) {
  return (await query("SELECT 1 FROM affectation WHERE id_session=$1 AND id_utilisateur=$2", [idSession, idUtilisateur])).rows.length > 0;
}
export const addFormateur = (idSession, idUtilisateur) =>
  query("INSERT INTO affectation (id_session, id_utilisateur) VALUES ($1,$2) ON CONFLICT DO NOTHING", [idSession, idUtilisateur]);
export const removeFormateur = (idSession, idUtilisateur) =>
  query("DELETE FROM affectation WHERE id_session=$1 AND id_utilisateur=$2", [idSession, idUtilisateur]);
