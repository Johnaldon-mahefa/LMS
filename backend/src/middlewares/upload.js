// Dépôt de fichiers (ressources, travaux) : taille et type limités, stockage hors du dossier public.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".zip", ".png", ".jpg", ".jpeg"];

function creerUpload(sousDossier) {
  const dossier = path.join(env.uploadDir, sousDossier);
  fs.mkdirSync(dossier, { recursive: true });
  const upload = multer({
    storage: multer.diskStorage({
      destination: dossier,
      filename: (_req, file, cb) => cb(null, crypto.randomBytes(16).toString("hex") + path.extname(file.originalname).toLowerCase()),
    }),
    limits: { fileSize: env.tailleMaxFichierMo * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ok = EXTENSIONS.includes(path.extname(file.originalname).toLowerCase());
      cb(ok ? null : new AppError(400, `Type de fichier non accepté. Types autorisés : ${EXTENSIONS.join(", ")}`), ok);
    },
  });
  // Le champ du formulaire s'appelle toujours « fichier ».
  return (req, res, next) => upload.single("fichier")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof AppError) return next(err);
    if (err.code === "LIMIT_FILE_SIZE") return next(new AppError(400, `Fichier trop volumineux (maximum ${env.tailleMaxFichierMo} Mo).`));
    next(new AppError(400, "Dépôt du fichier impossible."));
  });
}
export const uploadRessource = creerUpload("ressources");
export const uploadSoumission = creerUpload("soumissions");

export const supprimerFichier = (chemin) => chemin && fs.promises.unlink(path.join(env.uploadDir, chemin)).catch(() => {});
