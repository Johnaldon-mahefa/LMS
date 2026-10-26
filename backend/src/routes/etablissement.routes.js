import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth.js";
import * as Controller from "../controllers/etablissement.controller.js";

const router = Router();

// Seul l'administrateur peut voir et payer l'abonnement
router.use(authenticate, requireRole("administrateur"));

router.get("/mon-abonnement", Controller.getMonAbonnement);
router.post("/payer", Controller.payer);

export default router;
