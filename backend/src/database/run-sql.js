// Exécute un fichier SQL : npm run db:schema  (évite d'avoir besoin du client psql).
import fs from "node:fs";
import { pool } from "../config/db.js";

const fichier = process.argv[2];
if (!fichier) { console.error("Usage : node src/database/run-sql.js <fichier.sql>"); process.exit(1); }
try {
  await pool.query(fs.readFileSync(fichier, "utf8"));
  console.log(`Fichier exécuté : ${fichier}`);
} catch (err) {
  console.error(err.message); process.exitCode = 1;
} finally {
  await pool.end();
}
