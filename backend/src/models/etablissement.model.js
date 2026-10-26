import { query } from "../config/db.js";

export async function findById(id) {
  const { rows } = await query("SELECT * FROM etablissement WHERE id_etablissement = $1", [id]);
  return rows[0] || null;
}

export async function findByCode(codeAcces) {
  const { rows } = await query("SELECT * FROM etablissement WHERE code_acces = $1", [codeAcces]);
  return rows[0] || null;
}

export async function insert(client, { nom, codeAcces }) {
  const res = await client.query(
    "INSERT INTO etablissement (nom, code_acces) VALUES ($1, $2) RETURNING id_etablissement",
    [nom, codeAcces]
  );
  return res.rows[0].id_etablissement;
}

// NOUVEAU : Mettre à jour l'abonnement
export async function updateAbonnement(id, { plan, dateExpiration }) {
  await query(
    "UPDATE etablissement SET plan_abonnement = $1, date_expiration = $2 WHERE id_etablissement = $3",
    [plan, dateExpiration, id]
  );
}