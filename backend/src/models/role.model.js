// Modèle : accès aux données de la classe Rôle (requêtes SQL uniquement, aucune règle métier).
import { query } from "../config/db.js";

export async function findByNames(client, noms) {
  const { rows } = await client.query("SELECT id_role, nom_role FROM role WHERE nom_role = ANY($1)", [noms]);
  return rows;
}

export async function listAll() {
  const { rows } = await query("SELECT id_role, nom_role FROM role ORDER BY nom_role");
  return rows;
}
