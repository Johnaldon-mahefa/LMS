import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import * as RechercheController from "../controllers/recherche.controller.js";

const router = Router();

// Route publique protégée par l'authentification (pour avoir req.user)
router.get("/", authenticate, RechercheController.rechercher);

export default router;