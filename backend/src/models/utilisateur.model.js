import { query } from "../config/db.js";

const COLS = "u.id_utilisateur, u.identifiant, u.nom, u.prenom, u.statut_compte";

export async function findById(id) {
  const { rows } = await query(`SELECT ${COLS} FROM utilisateur u WHERE u.id_utilisateur = $1`, [id]);
  return rows[0] || null;
}

export async function findForLogin(identifiant) {
  const { rows } = await query(`SELECT ${COLS}, u.mot_de_passe FROM utilisateur u WHERE u.identifiant = $1`, [identifiant]);
  return rows[0] || null;
}

export async function findEcoles(idUtilisateur) {
  const { rows } = await query(`
    SELECT e.id_etablissement, e.nom AS nom_etablissement, 
           COALESCE(json_agg(r.nom_role) FILTER (WHERE r.nom_role IS NOT NULL), '[]') AS roles
    FROM utilisateur_etablissement_role uer
    JOIN etablissement e ON uer.id_etablissement = e.id_etablissement
    LEFT JOIN role r ON uer.id_role = r.id_role
    WHERE uer.id_utilisateur = $1
    GROUP BY e.id_etablissement, e.nom
  `, [idUtilisateur]);
  return rows;
}

// NOUVEAU : Récupérer les rôles d'un utilisateur pour une école précise
export async function getRolesInEtablissement(idUtilisateur, idEtablissement) {
  const { rows } = await query(`
    SELECT r.nom_role 
    FROM utilisateur_etablissement_role uer
    JOIN role r ON uer.id_role = r.id_role
    WHERE uer.id_utilisateur = $1 AND uer.id_etablissement = $2
  `, [idUtilisateur, idEtablissement]);
  return rows.map(r => r.nom_role);
}

export async function findAll(idEtablissement) {
  const { rows } = await query(`
    SELECT ${COLS}, COALESCE(json_agg(r.nom_role) FILTER (WHERE r.nom_role IS NOT NULL), '[]') AS roles
    FROM utilisateur u
    JOIN utilisateur_etablissement_role uer ON u.id_utilisateur = uer.id_utilisateur
    LEFT JOIN role r ON uer.id_role = r.id_role
    WHERE uer.id_etablissement = $1
    GROUP BY u.id_utilisateur
    ORDER BY u.nom, u.prenom
  `, [idEtablissement]);
  return rows;
}

export async function existsByIdentifiant(client, identifiant) {
  const res = await client.query("SELECT 1 FROM utilisateur WHERE identifiant = $1", [identifiant]);
  return res.rows.length > 0;
}

export async function insert(client, { identifiant, motDePasseHache, nom, prenom }) {
  const res = await client.query(
    "INSERT INTO utilisateur (identifiant, mot_de_passe, nom, prenom) VALUES ($1,$2,$3,$4) RETURNING id_utilisateur",
    [identifiant, motDePasseHache, nom, prenom]
  );
  return res.rows[0].id_utilisateur;
}

export async function setEtablissementRoles(client, idUtilisateur, idEtablissement, idsRoles) {
  for (const idRole of idsRoles) {
    await client.query(
      "INSERT INTO utilisateur_etablissement_role (id_utilisateur, id_etablissement, id_role) VALUES ($1,$2,$3)",
      [idUtilisateur, idEtablissement, idRole]
    );
  }
}

export async function updateIdentite(client, id, { nom, prenom }) {
  await client.query("UPDATE utilisateur SET nom=$2, prenom=$3 WHERE id_utilisateur=$1", [id, nom, prenom]);
}

// Ajoute ceci à la fin de ton fichier utilisateur.model.js

export async function findFormateursAvecSessions(idEtablissement) {
  const { rows } = await query(`
    SELECT 
      u.id_utilisateur, 
      u.nom, 
      u.prenom, 
      u.identifiant,
      COALESCE(json_agg(
        json_build_object(
          'id_session', s.id_session,
          'formation', f.intitule,
          'date_debut', s.date_debut,
          'date_fin', s.date_fin
        )
      ) FILTER (WHERE s.id_session IS NOT NULL), '[]') AS sessions
    FROM utilisateur u
    JOIN utilisateur_etablissement_role uer ON u.id_utilisateur = uer.id_utilisateur
    JOIN role r ON uer.id_role = r.id_role
    LEFT JOIN affectation a ON u.id_utilisateur = a.id_utilisateur
    LEFT JOIN session s ON a.id_session = s.id_session
    LEFT JOIN formation f ON s.id_formation = f.id_formation
    WHERE uer.id_etablissement = $1 AND r.nom_role = 'formateur'
    GROUP BY u.id_utilisateur
    ORDER BY u.nom, u.prenom
  `, [idEtablissement]);
  return rows;
}

export const setStatut = (id, statut) => query("UPDATE utilisateur SET statut_compte = $2 WHERE id_utilisateur = $1", [id, statut]);
export const setMotDePasse = (id, hash) => query("UPDATE utilisateur SET mot_de_passe = $2 WHERE id_utilisateur = $1", [id, hash]);