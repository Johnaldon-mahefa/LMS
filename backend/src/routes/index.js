// Point d'entrée des routes : un fichier par rôle (acteur), chacun protégé par requireRole (RG15).
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import utilisateursRoutes from "./utilisateurs.routes.js";
import adminRoutes from "./admin.routes.js";
import formateurRoutes from "./formateur.routes.js";
import apprenantRoutes from "./apprenant.routes.js";
import fichiersRoutes from "./fichiers.routes.js";
import profilRoutes from "./profil.routes.js";
import notificationsRoutes from "./notifications.routes.js";
import rechercheRoutes from "./recherche.routes.js";
import etablissementRoutes from "./etablissement.routes.js";

const router = Router();
router.get("/sante", (_req, res) => res.json({ statut: "ok" }));
router.use("/auth", authRoutes);
router.use("/utilisateurs", utilisateursRoutes);
router.use("/admin", adminRoutes);
router.use("/formateur", formateurRoutes);
router.use("/apprenant", apprenantRoutes);
router.use("/fichiers", fichiersRoutes);
router.use("/profil", profilRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/recherche", rechercheRoutes);

router.use("/etablissement", etablissementRoutes);
export default router;
