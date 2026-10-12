// Téléchargement de fichiers : utilisateur authentifié ; les droits précis sont contrôlés par les services.
import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import * as Fichiers from "../controllers/fichiers.controller.js";

const r = Router();
r.use(authenticate);
r.get("/ressources/:id", Fichiers.ressource);
r.get("/soumissions/:id", Fichiers.soumission);
export default r;
