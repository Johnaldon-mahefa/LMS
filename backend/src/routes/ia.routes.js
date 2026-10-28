import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import * as Controller from "../controllers/ia.controller.js";

const router = Router();

// On protège la route pour que seuls les utilisateurs connectés y aient accès
router.use(authenticate);
router.post("/chat", Controller.chat);

export default router;
