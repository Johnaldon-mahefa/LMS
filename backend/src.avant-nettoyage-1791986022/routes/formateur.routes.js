// Routes du formateur : contenu pédagogique, corrections, suivi. RG15 : rôle formateur uniquement.
import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { uploadRessource } from "../middlewares/upload.js";
import * as Contenu from "../controllers/contenu.controller.js";
import * as Corrections from "../controllers/corrections.controller.js";
import * as Suivi from "../controllers/suivi.controller.js";

const r = Router();
r.use(authenticate, requireRole("formateur"));

r.get("/formations", Contenu.mesFormations);
r.post("/formations/:id/modules", Contenu.creerModule);
r.get("/modules/:id", Contenu.detailModule);
r.put("/modules/:id", Contenu.modifierModule);
r.delete("/modules/:id", Contenu.supprimerModule);
r.patch("/modules/:id/publier", Contenu.publierModule);
r.patch("/modules/:id/retirer-publication", Contenu.retirerPublication);
r.post("/modules/:id/lecons", Contenu.ajouterLecon);
r.put("/lecons/:id", Contenu.modifierLecon);
r.delete("/lecons/:id", Contenu.supprimerLecon);
r.post("/modules/:id/ressources", uploadRessource, Contenu.deposerRessource);
r.delete("/ressources/:id", Contenu.supprimerRessource);
r.post("/modules/:id/evaluations", Contenu.creerEvaluation);
r.put("/evaluations/:id", Contenu.modifierEvaluation);
r.delete("/evaluations/:id", Contenu.supprimerEvaluation);

r.get("/soumissions/a-corriger", Corrections.aCorriger);
r.get("/soumissions/:id", Corrections.detail);
r.put("/soumissions/:id/correction", Corrections.corriger);

r.get("/sessions", Suivi.sessions);
r.get("/sessions/:id/progression", Suivi.progressionSession);
r.get("/inscriptions/:id/detail", Suivi.detailInscription);
export default r;
