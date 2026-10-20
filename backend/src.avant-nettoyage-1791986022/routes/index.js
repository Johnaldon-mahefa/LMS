// Point d'entrée des routes : un fichier par rôle (acteur), chacun protégé par requireRole (RG15).
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import utilisateursRoutes from "./utilisateurs.routes.js";
import adminRoutes from "./admin.routes.js";
import formateurRoutes from "./formateur.routes.js";
import apprenantRoutes from "./apprenant.routes.js";
import fichiersRoutes from "./fichiers.routes.js";

const router = Router();
router.get("/sante", (_req, res) => res.json({ statut: "ok" }));
router.use("/auth", authRoutes);
router.use("/utilisateurs", utilisateursRoutes);
router.use("/admin", adminRoutes);
router.use("/formateur", formateurRoutes);
router.use("/apprenant", apprenantRoutes);
router.use("/fichiers", fichiersRoutes);
export default router;
