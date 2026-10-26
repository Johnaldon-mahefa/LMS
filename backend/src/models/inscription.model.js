import { query } from "../config/db.js";

// CORRECTION : On ajoute f.id_formation dans le SELECT pour que le frontend sache à quelle formation se rattache l'inscription.
const BASE_SELECT = `
  SELECT i.id_inscription, i.id_utilisateur, i.id_utilisateur AS id_apprenant, i.id_session, 
         i.date_inscription, i.statut_inscription,
         f.id_formation, f.intitule AS formation, f.description, 
         s.date_debut, s.date_fin, s.capacite_max,
         u.nom, u.prenom 
  FROM inscription i
  JOIN session s ON i.id_session = s.id_session
  JOIN formation f ON s.id_formation = f.id_formation
  JOIN utilisateur u ON i.id_utilisateur = u.id_utilisateur
`;

export async function findById(id, client = { query }) {
  const { rows } = await client.query(`${BASE_SELECT} WHERE i.id_inscription = $1`, [id]);
  return rows[0] || null;
}

export async function findByApprenant(idApprenant, idEtablissement) {
  const { rows } = await query(
    `${BASE_SELECT} WHERE i.id_utilisateur = $1 AND f.id_etablissement = $2 ORDER BY i.date_inscription DESC`,
    [idApprenant, idEtablissement]
  );
  return rows;
}

export async function findValideesByApprenant(idApprenant, idEtablissement) {
  const { rows } = await query(
    `${BASE_SELECT} WHERE i.id_utilisateur = $1 AND i.statut_inscription = 'validee' AND f.id_etablissement = $2 ORDER BY i.date_inscription DESC`,
    [idApprenant, idEtablissement]
  );
  return rows;
}

export async function findAll() {
  const { rows } = await query(`${BASE_SELECT} ORDER BY i.date_inscription DESC`);
  return rows;
}

export async function findBySession(idSession) {
  const { rows } = await query(`${BASE_SELECT} WHERE i.id_session = $1`, [idSession]);
  return rows;
}

export async function findValideesBySession(idSession) {
  const { rows } = await query(`${BASE_SELECT} WHERE i.id_session = $1 AND i.statut_inscription = 'validee'`, [idSession]);
  return rows;
}

export async function exists(idUtilisateur, idSession) {
  const { rows } = await query(
    "SELECT 1 FROM inscription WHERE id_utilisateur = $1 AND id_session = $2", 
    [idUtilisateur, idSession]
  );
  return rows.length > 0;
}

export async function insert(client, idUtilisateur, idSession, statut) {
  const { rows } = await client.query(
    "INSERT INTO inscription (id_utilisateur, id_session, statut_inscription) VALUES ($1,$2,$3) RETURNING id_inscription",
    [idUtilisateur, idSession, statut]
  );
  return rows[0].id_inscription;
}

export async function setStatut(client, id, statut) {
  await client.query("UPDATE inscription SET statut_inscription = $2 WHERE id_inscription = $1", [id, statut]);
}

export async function countValidees(client, idSession) {
  const { rows } = await client.query(
    "SELECT COUNT(*)::int AS n FROM inscription WHERE id_session = $1 AND statut_inscription = 'validee'", 
    [idSession]
  );
  return rows[0].n;
}

export async function verrouillerSession(client, idSession) {
  await client.query("SELECT id_session FROM session WHERE id_session = $1 FOR UPDATE", [idSession]);
}