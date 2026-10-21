// Routes de l'authentification.
import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import * as AuthController from "../controllers/auth.controller.js";

const router = Router();

// Routes publiques
router.post("/login", AuthController.login);
router.post("/inscrire-etablissement", AuthController.inscrireEtablissement); // NOUVEAU

// Routes protégées (nécessitent un token)
router.get("/moi", authenticate, AuthController.moi);

export default router;