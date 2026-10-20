// Modèle : classe Leçon (requêtes SQL uniquement).
import { query } from "../config/db.js";

export const findByModule = async (idModule) => (await query("SELECT id_lecon, id_module, titre, contenu FROM lecon WHERE id_module=$1 ORDER BY id_lecon", [idModule])).rows;
export const findById = async (id) => (await query("SELECT id_lecon, id_module, titre, contenu FROM lecon WHERE id_lecon=$1", [id])).rows[0] || null;
export const insert = async (idModule, { titre, contenu }) =>
  (await query("INSERT INTO lecon (id_module, titre, contenu) VALUES ($1,$2,$3) RETURNING id_lecon", [idModule, titre, contenu || null])).rows[0].id_lecon;
export const update = (id, { titre, contenu }) => query("UPDATE lecon SET titre=$2, contenu=$3 WHERE id_lecon=$1", [id, titre, contenu || null]);
export const remove = (id) => query("DELETE FROM lecon WHERE id_lecon=$1", [id]);
