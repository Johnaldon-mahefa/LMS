// Routes de l'administrateur pour gérer les utilisateurs.
import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth.js";
import * as UtilisateursController from "../controllers/utilisateurs.controller.js";

const router = Router();
router.use(authenticate, requireRole("administrateur"));

router.get("/", UtilisateursController.lister);
router.post("/", UtilisateursController.creer);
router.put("/:id", UtilisateursController.modifier);
router.patch("/:id/desactiver", UtilisateursController.desactiver);
router.patch("/:id/reactiver", UtilisateursController.reactiver);
router.patch("/:id/mot-de-passe", UtilisateursController.reinitialiserMotDePasse);

export default router;