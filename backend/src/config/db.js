// Accès à PostgreSQL : un pool de connexions partagé par toute l'application.
import pg from "pg";
import { env } from "./env.js";

export const pool = new pg.Pool(env.db);

export const query = (text, params) => pool.query(text, params);

// Exécute plusieurs requêtes dans une transaction (tout réussit ou tout est annulé).
export async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
