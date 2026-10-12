// Modèle : classe Inscription (requêtes SQL uniquement).
import { query } from "../config/db.js";

const COLONNES = `i.id_inscription, i.id_utilisateur AS id_apprenant, i.id_session, i.statut_inscription,
  to_char(i.date_inscription,'YYYY-MM-DD') AS date_inscription,
  u.nom, u.prenom, f.id_formation, f.intitule AS formation,
  to_char(s.date_debut,'YYYY-MM-DD') AS date_debut, to_char(s.date_fin,'YYYY-MM-DD') AS date_fin, s.capacite_max,
  GREATEST(s.capacite_max - (SELECT COUNT(*) FROM inscription x WHERE x.id_session = s.id_session AND x.statut_inscription = 'validee'), 0)::int AS places_restantes`;
const FROM = `FROM inscription i JOIN utilisateur u ON u.id_utilisateur = i.id_utilisateur
  JOIN session s ON s.id_session = i.id_session JOIN formation f ON f.id_formation = s.id_formation`;

export async function findAll() {
  return (await query(`SELECT ${COLONNES} ${FROM} ORDER BY (i.statut_inscription = 'en_attente') DESC, i.date_inscription DESC, i.id_inscription DESC`)).rows;
}
export async function findById(id, client = { query }) {
  return (await client.query(`SELECT ${COLONNES} ${FROM} WHERE i.id_inscription = $1`, [id])).rows[0] || null;
}
export async function findByApprenant(idApprenant) {
  return (await query(`SELECT ${COLONNES} ${FROM} WHERE i.id_utilisateur = $1 ORDER BY i.date_inscription DESC, i.id_inscription DESC`, [idApprenant])).rows;
}
export async function findValideesByApprenant(idApprenant) {
  return (await query(`SELECT ${COLONNES} ${FROM} WHERE i.id_utilisateur = $1 AND i.statut_inscription = 'validee' ORDER BY f.intitule`, [idApprenant])).rows;
}
export async function findValideesBySession(idSession) {
  return (await query(`SELECT ${COLONNES} ${FROM} WHERE i.id_session = $1 AND i.statut_inscription = 'validee' ORDER BY u.nom, u.prenom`, [idSession])).rows;
}
export async function exists(idApprenant, idSession) {
  return (await query("SELECT 1 FROM inscription WHERE id_utilisateur=$1 AND id_session=$2", [idApprenant, idSession])).rows.length > 0;
}
export async function insert(client, idApprenant, idSession, statut) {
  return (await client.query(
    "INSERT INTO inscription (id_utilisateur, id_session, statut_inscription) VALUES ($1,$2,$3) RETURNING id_inscription",
    [idApprenant, idSession, statut])).rows[0].id_inscription;
}
export const setStatut = (client, id, statut) => client.query("UPDATE inscription SET statut_inscription=$2 WHERE id_inscription=$1", [id, statut]);

// Verrouille la session pendant le contrôle de capacité (RG6) : deux validations simultanées ne peuvent pas dépasser la capacité.
export async function verrouillerSession(client, idSession) {
  return (await client.query("SELECT id_session, capacite_max FROM session WHERE id_session = $1 FOR UPDATE", [idSession])).rows[0];
}
export async function countValidees(client, idSession) {
  return (await client.query("SELECT COUNT(*)::int AS n FROM inscription WHERE id_session=$1 AND statut_inscription='validee'", [idSession])).rows[0].n;
}
