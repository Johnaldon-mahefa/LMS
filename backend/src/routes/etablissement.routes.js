import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth.js";
import * as Controller from "../controllers/etablissement.controller.js";

const router = Router();
router.use(authenticate, requireRole("administrateur"));

router.get("/mon-abonnement", Controller.getMonAbonnement);
router.get("/plans", Controller.getPlans);
router.get("/fonctionnalites", Controller.getFonctionnalites);
router.post("/payer", Controller.payer);
router.post("/payer-sur-mesure", Controller.payerSurMesure); // <-- NOUVELLE ROUTE
router.get("/statut-paiement/:serverCorrelationId", Controller.verifierStatut);

export default router;