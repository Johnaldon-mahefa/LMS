// Modèle : classe ReponseTentative (requêtes SQL uniquement).
import { query } from "../config/db.js";

export const insertMany = async (idTentative, reponses) => {
  if (reponses.length === 0) return;
  
  // Construction de la requête d'insertion multiple
  const values = [];
  const params = [];
  let i = 1;
  
  for (const r of reponses) {
    values.push(`($${i}, $${i+1}, $${i+2}, $${i+3})`);
    params.push(idTentative, r.id_question, r.id_proposition, r.est_correcte);
    i += 4;
  }
  
  await query(
    `INSERT INTO reponse_tentative (id_tentative, id_question, id_proposition, est_correcte) VALUES ${values.join(', ')}`,
    params
  );
};