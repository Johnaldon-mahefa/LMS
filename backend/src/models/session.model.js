import { query } from "../config/db.js";

const COLS = `s.id_session, s.id_formation, s.date_debut, s.date_fin, s.capacite_max,
  (SELECT COUNT(*)::int FROM inscription i WHERE i.id_session = s.id_session AND i.statut_inscription = 'validee') AS nb_inscriptions,
  (s.capacite_max - (SELECT COUNT(*)::int FROM inscription i WHERE i.id_session = s.id_session AND i.statut_inscription = 'validee')) AS places_restantes`;

export async function findById(id) {
  return (await query(`SELECT ${COLS} FROM session s WHERE s.id_session = $1`, [id])).rows[0] || null;
}

export async function findByFormation(idFormation) {
  const { rows } = await query(
    `SELECT ${COLS} FROM session s WHERE s.id_formation = $1 ORDER BY s.date_debut`,
    [idFormation]
  );
  for (const s of rows) {
    s.formateurs = (await query(
      `SELECT u.id_utilisateur, u.nom, u.prenom FROM affectation a JOIN utilisateur u ON a.id_utilisateur = u.id_utilisateur WHERE a.id_session = $1`,
      [s.id_session]
    )).rows;
  }
  return rows;
}

// MULTI-TENANT : On filtre par établissement via la formation
export async function findByFormateur(idFormateur, idEtablissement) {
  const { rows } = await query(`
    SELECT s.id_session, s.date_debut, s.date_fin, s.capacite_max, f.intitule AS formation,
           (s.capacite_max - (SELECT COUNT(*)::int FROM inscription i WHERE i.id_session = s.id_session AND i.statut_inscription = 'validee')) AS places_restantes
    FROM session s
    JOIN formation f ON s.id_formation = f.id_formation
    JOIN affectation a ON s.id_session = a.id_session
    WHERE a.id_utilisateur = $1 AND f.id_etablissement = $2
    ORDER BY s.date_debut DESC
  `, [idFormateur, idEtablissement]);
  return rows;
}

export async function insert(idFormation, { dateDebut, dateFin, capaciteMax }) {
  return (await query(
    "INSERT INTO session (id_formation, date_debut, date_fin, capacite_max) VALUES ($1,$2,$3,$4) RETURNING id_session",
    [idFormation, dateDebut, dateFin, capaciteMax])).rows[0].id_session;
}

export const update = (id, { dateDebut, dateFin, capaciteMax }) =>
  query("UPDATE session SET date_debut=$2, date_fin=$3, capacite_max=$4 WHERE id_session=$1", [id, dateDebut, dateFin, capaciteMax]);

export const remove = (id) => query("DELETE FROM session WHERE id_session = $1", [id]);

export const addFormateur = (idSession, idUtilisateur) =>
  query("INSERT INTO affectation (id_session, id_utilisateur) VALUES ($1,$2) ON CONFLICT DO NOTHING", [idSession, idUtilisateur]);

export const removeFormateur = (idSession, idUtilisateur) =>
  query("DELETE FROM affectation WHERE id_session = $1 AND id_utilisateur = $2", [idSession, idUtilisateur]);

export async function formateurAffecte(idSession, idFormateur) {
  const { rows } = await query("SELECT 1 FROM affectation WHERE id_session = $1 AND id_utilisateur = $2", [idSession, idFormateur]);
  return rows.length > 0;
} 