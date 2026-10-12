// Modèle : classe Attestation (requêtes SQL uniquement).
import { query } from "../config/db.js";

const COLS = "id_attestation, id_inscription, numero_attestation, to_char(date_delivrance,'YYYY-MM-DD') AS date_delivrance";
export const findByInscription = async (idInscription) =>
  (await query(`SELECT ${COLS} FROM attestation WHERE id_inscription=$1`, [idInscription])).rows[0] || null;

// RG14 : au plus une attestation par inscription (UNIQUE en base) ; numéro unique de la forme ATT-AAAA-000123.
export async function insert(idInscription) {
  const { rows } = await query(
    `WITH n AS (SELECT nextval(pg_get_serial_sequence('attestation','id_attestation')) AS id)
     INSERT INTO attestation (id_attestation, id_inscription, numero_attestation)
     SELECT id, $1, 'ATT-' || to_char(NOW(),'YYYY') || '-' || lpad(id::text, 6, '0') FROM n
     RETURNING ${COLS}`, [idInscription]);
  return rows[0];
}
