// Modèle : classe Ressource (requêtes SQL uniquement).
import { query } from "../config/db.js";

export const findByModule = async (idModule) => (await query("SELECT id_ressource, id_module, nom_fichier FROM ressource WHERE id_module=$1 ORDER BY id_ressource", [idModule])).rows;
export const findById = async (id) => (await query("SELECT * FROM ressource WHERE id_ressource=$1", [id])).rows[0] || null;
export const insert = async (idModule, nomFichier, cheminFichier) =>
  (await query("INSERT INTO ressource (id_module, nom_fichier, chemin_fichier) VALUES ($1,$2,$3) RETURNING id_ressource", [idModule, nomFichier, cheminFichier])).rows[0].id_ressource;
export const remove = (id) => query("DELETE FROM ressource WHERE id_ressource=$1", [id]);
