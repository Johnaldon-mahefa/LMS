import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import * as AuthController from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", AuthController.login);
router.post("/inscrire-etablissement", AuthController.inscrireEtablissement);
router.post("/connexion-ecole", AuthController.connexionEcole); // NOUVEAU

router.get("/moi", authenticate, AuthController.moi);

export default router;