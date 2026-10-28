import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { verifierTurnstile } from "../middlewares/turnstile.js"; // <-- IMPORT
import * as AuthController from "../controllers/auth.controller.js";
import * as OAuthController from "../controllers/oauth.controller.js";

const router = Router();

// Ajout du middleware sur le login et l'inscription
router.post("/login", verifierTurnstile, AuthController.login);
router.post("/inscrire-etablissement", verifierTurnstile, AuthController.inscrireEtablissement);
router.post("/connexion-ecole", AuthController.connexionEcole);
router.get("/moi", authenticate, AuthController.moi);

// OAuth
router.get("/google", OAuthController.demarrerGoogle);
router.get("/google/callback", OAuthController.callbackGoogle);
router.get("/facebook", OAuthController.demarrerFacebook);
router.get("/facebook/callback", OAuthController.callbackFacebook);

export default router;