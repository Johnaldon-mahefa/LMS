// Modèle : accès aux données de la classe Utilisateur (requêtes SQL uniquement, aucune règle métier).
import { query } from "../config/db.js";

const SELECT_AVEC_ROLES = `
  SELECT u.id_utilisateur, u.identifiant, u.nom, u.prenom, u.statut_compte,
         COALESCE(array_agg(r.nom_role ORDER BY r.nom_role) FILTER (WHERE r.id_role IS NOT NULL), '{}') AS roles
  FROM utilisateur u
  LEFT JOIN utilisateur_role ur ON ur.id_utilisateur = u.id_utilisateur
  LEFT JOIN role r ON r.id_role = ur.id_role`;

export async function findAll() {
  const { rows } = await query(`${SELECT_AVEC_ROLES} GROUP BY u.id_utilisateur ORDER BY u.nom, u.prenom`);
  return rows;
}

export async function findById(id) {
  const { rows } = await query(`${SELECT_AVEC_ROLES} WHERE u.id_utilisateur = $1 GROUP BY u.id_utilisateur`, [id]);
  return rows[0] || null;
}

// Retourne aussi le mot de passe haché : réservé à l'authentification.
export async function findForLogin(identifiant) {
  const { rows } = await query(
    `SELECT u.id_utilisateur, u.identifiant, u.mot_de_passe, u.nom, u.prenom, u.statut_compte,
            COALESCE(array_agg(r.nom_role) FILTER (WHERE r.id_role IS NOT NULL), '{}') AS roles
     FROM utilisateur u
     LEFT JOIN utilisateur_role ur ON ur.id_utilisateur = u.id_utilisateur
     LEFT JOIN role r ON r.id_role = ur.id_role
     WHERE u.identifiant = $1 GROUP BY u.id_utilisateur`, [identifiant]);
  return rows[0] || null;
}

export async function existsByIdentifiant(client, identifiant) {
  const { rows } = await client.query("SELECT 1 FROM utilisateur WHERE identifiant = $1", [identifiant]);
  return rows.length > 0;
}

export async function insert(client, { identifiant, motDePasseHache, nom, prenom }) {
  const { rows } = await client.query(
    `INSERT INTO utilisateur (identifiant, mot_de_passe, nom, prenom)
     VALUES ($1, $2, $3, $4) RETURNING id_utilisateur`, [identifiant, motDePasseHache, nom, prenom]);
  return rows[0].id_utilisateur;
}

export async function updateIdentite(client, id, { nom, prenom }) {
  await client.query("UPDATE utilisateur SET nom = $2, prenom = $3 WHERE id_utilisateur = $1", [id, nom, prenom]);
}

export async function setRoles(client, id, idsRoles) {
  await client.query("DELETE FROM utilisateur_role WHERE id_utilisateur = $1", [id]);
  for (const idRole of idsRoles) {
    await client.query("INSERT INTO utilisateur_role (id_utilisateur, id_role) VALUES ($1, $2)", [id, idRole]);
  }
}

export async function setStatut(id, statut) {
  await query("UPDATE utilisateur SET statut_compte = $2 WHERE id_utilisateur = $1", [id, statut]);
}

export async function setMotDePasse(id, motDePasseHache) {
  await query("UPDATE utilisateur SET mot_de_passe = $2 WHERE id_utilisateur = $1", [id, motDePasseHache]);
}
