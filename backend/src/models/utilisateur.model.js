import { query } from "../config/db.js";

const COLS = "u.id_utilisateur, u.id_etablissement, e.nom AS nom_etablissement, u.identifiant, u.nom, u.prenom, u.statut_compte";
const JOINS = "FROM utilisateur u LEFT JOIN etablissement e ON u.id_etablissement = e.id_etablissement";

export async function findById(id) {
  const { rows } = await query(
    `SELECT ${COLS}, COALESCE(json_agg(r.nom_role) FILTER (WHERE r.nom_role IS NOT NULL), '[]') AS roles
     ${JOINS}
     LEFT JOIN utilisateur_role ur ON ur.id_utilisateur = u.id_utilisateur
     LEFT JOIN role r ON r.id_role = ur.id_role
     WHERE u.id_utilisateur = $1
     GROUP BY u.id_utilisateur, e.nom`, [id]);
  return rows[0] || null;
}

export async function findForLogin(identifiant) {
  const { rows } = await query(
    `SELECT ${COLS}, u.mot_de_passe, COALESCE(json_agg(r.nom_role) FILTER (WHERE r.nom_role IS NOT NULL), '[]') AS roles
     ${JOINS}
     LEFT JOIN utilisateur_role ur ON ur.id_utilisateur = u.id_utilisateur
     LEFT JOIN role r ON r.id_role = ur.id_role
     WHERE u.identifiant = $1
     GROUP BY u.id_utilisateur, e.nom`, [identifiant]);
  return rows[0] || null;
}

export async function findAll(idEtablissement) {
  const { rows } = await query(
    `SELECT ${COLS}, COALESCE(json_agg(r.nom_role) FILTER (WHERE r.nom_role IS NOT NULL), '[]') AS roles
     ${JOINS}
     LEFT JOIN utilisateur_role ur ON ur.id_utilisateur = u.id_utilisateur
     LEFT JOIN role r ON r.id_role = ur.id_role
     WHERE u.id_etablissement = $1
     GROUP BY u.id_utilisateur, e.nom
     ORDER BY u.nom, u.prenom`, [idEtablissement]);
  return rows;
}

export async function existsByIdentifiant(client, identifiant) {
  const res = await client.query("SELECT 1 FROM utilisateur WHERE identifiant = $1", [identifiant]);
  return res.rows.length > 0;
}

export async function insert(client, { idEtablissement, identifiant, motDePasseHache, nom, prenom }) {
  const res = await client.query(
    "INSERT INTO utilisateur (id_etablissement, identifiant, mot_de_passe, nom, prenom) VALUES ($1,$2,$3,$4,$5) RETURNING id_utilisateur",
    [idEtablissement, identifiant, motDePasseHache, nom, prenom]
  );
  return res.rows[0].id_utilisateur;
}

export async function updateIdentite(client, id, { nom, prenom }) {
  await client.query("UPDATE utilisateur SET nom=$2, prenom=$3 WHERE id_utilisateur=$1", [id, nom, prenom]);
}

export async function setRoles(client, idUtilisateur, idsRoles) {
  await client.query("DELETE FROM utilisateur_role WHERE id_utilisateur=$1", [idUtilisateur]);
  for (const idRole of idsRoles) {
    await client.query("INSERT INTO utilisateur_role (id_utilisateur, id_role) VALUES ($1,$2)", [idUtilisateur, idRole]);
  }
}

export const setStatut = (id, statut) => query("UPDATE utilisateur SET statut_compte = $2 WHERE id_utilisateur = $1", [id, statut]);
export const setMotDePasse = (id, hash) => query("UPDATE utilisateur SET mot_de_passe = $2 WHERE id_utilisateur = $1", [id, hash]);