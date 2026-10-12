// Données de départ : les trois rôles et le compte administrateur (npm run db:seed).
import bcrypt from "bcryptjs";
import { pool, withTransaction } from "../config/db.js";
import { env } from "../config/env.js";

try {
  await withTransaction(async (client) => {
    for (const nom of ["administrateur", "formateur", "apprenant"]) {
      await client.query("INSERT INTO role (nom_role) VALUES ($1) ON CONFLICT (nom_role) DO NOTHING", [nom]);
    }
    const { rows } = await client.query("SELECT 1 FROM utilisateur WHERE identifiant = $1", [env.admin.identifiant]);
    if (rows.length === 0) {
      const hache = await bcrypt.hash(env.admin.motDePasse, 10);
      const u = await client.query(
        "INSERT INTO utilisateur (identifiant, mot_de_passe, nom, prenom) VALUES ($1,$2,'Administrateur','Système') RETURNING id_utilisateur",
        [env.admin.identifiant, hache]);
      await client.query(
        "INSERT INTO utilisateur_role SELECT $1, id_role FROM role WHERE nom_role = 'administrateur'", [u.rows[0].id_utilisateur]);
      console.log(`Compte administrateur créé : ${env.admin.identifiant}`);
    } else console.log("Compte administrateur déjà présent.");
  });
} catch (err) { console.error(err.message); process.exitCode = 1; } finally { await pool.end(); }
