// Modèle : notifications personnelles d'un utilisateur.
import { query } from "../config/db.js";

export async function insert({ idUtilisateur, type, titre, message, lien }) {
  const { rows } = await query(
    `INSERT INTO notification (id_utilisateur, type, titre, message, lien)
     VALUES ($1, $2, $3, $4, $5) RETURNING id_notification`,
    [idUtilisateur, type, titre, message, lien || null]
  );
  return rows[0].id_notification;
}

export async function findByUtilisateur(idUtilisateur, limite = 30) {
  const { rows } = await query(
    `SELECT id_notification, type, titre, message, lien, lu,
            to_char(date_creation, 'YYYY-MM-DD HH24:MI') AS date_creation
     FROM notification
     WHERE id_utilisateur = $1
     ORDER BY date_creation DESC
     LIMIT $2`,
    [idUtilisateur, limite]
  );
  return rows;
}

export async function compterNonLues(idUtilisateur) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS n FROM notification WHERE id_utilisateur = $1 AND lu = FALSE`,
    [idUtilisateur]
  );
  return rows[0].n;
}

export async function marquerLue(id, idUtilisateur) {
  await query(
    `UPDATE notification SET lu = TRUE WHERE id_notification = $1 AND id_utilisateur = $2`,
    [id, idUtilisateur]
  );
}

export async function marquerToutesLues(idUtilisateur) {
  await query(
    `UPDATE notification SET lu = TRUE WHERE id_utilisateur = $1 AND lu = FALSE`,
    [idUtilisateur]
  );
}

export async function remove(id, idUtilisateur) {
  await query(
    `DELETE FROM notification WHERE id_notification = $1 AND id_utilisateur = $2`,
    [id, idUtilisateur]
  );
}