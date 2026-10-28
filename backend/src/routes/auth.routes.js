import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import * as AuthController from "../controllers/auth.controller.js";
import * as OAuthController from "../controllers/oauth.controller.js";

const router = Router();

router.post("/login", AuthController.login);
router.post("/inscrire-etablissement", AuthController.inscrireEtablissement);
router.post("/connexion-ecole", AuthController.connexionEcole);
router.get("/moi", authenticate, AuthController.moi);

// === OAUTH ROUTES ===
router.get("/google", OAuthController.demarrerGoogle);
router.get("/google/callback", OAuthController.callbackGoogle);
router.get("/facebook", OAuthController.demarrerFacebook);
router.get("/facebook/callback", OAuthController.callbackFacebook);

export default router;