// Lecture centralisée de la configuration (variables d'environnement).
import "dotenv/config";
import path from "node:path";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET est obligatoire : copier .env.example en .env");
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "lms",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
  },
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  seuilReussite: Number(process.env.SEUIL_REUSSITE) || 50, // RG12 : pourcentage minimal pour valider un module
  uploadDir: path.resolve(process.env.UPLOAD_DIR || "uploads"),
  tailleMaxFichierMo: Number(process.env.TAILLE_MAX_FICHIER_MO) || 10,
  admin: {
    identifiant: process.env.ADMIN_IDENTIFIANT || "admin",
    motDePasse: process.env.ADMIN_MOT_DE_PASSE || "Admin@12345",
  },
};
