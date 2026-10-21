import { query } from "../config/db.js";

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
