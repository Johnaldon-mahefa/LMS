// Routes de l'administrateur : organiser les formations, gérer les inscriptions. RG15 : rôle administrateur uniquement.
import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth.js";
import * as Formations from "../controllers/formations.controller.js";
import * as Inscriptions from "../controllers/inscriptions.controller.js";

const r = Router();
r.use(authenticate, requireRole("administrateur"));

r.get("/formations", Formations.lister);
r.post("/formations", Formations.creer);
r.get("/formations/:id", Formations.detail);
r.put("/formations/:id", Formations.modifier);
r.patch("/formations/:id/publier", Formations.publier);
r.patch("/formations/:id/archiver", Formations.archiver);
r.delete("/formations/:id", Formations.supprimer);
r.post("/formations/:id/sessions", Formations.creerSession);
r.put("/sessions/:id", Formations.modifierSession);
r.delete("/sessions/:id", Formations.supprimerSession);
r.post("/sessions/:id/formateurs", Formations.affecterFormateur);
r.delete("/sessions/:id/formateurs/:idFormateur", Formations.retirerFormateur);

r.get("/inscriptions", Inscriptions.lister);
r.post("/inscriptions/directe", Inscriptions.inscrireDirectement);
r.patch("/inscriptions/:id/valider", Inscriptions.valider);
r.patch("/inscriptions/:id/refuser", Inscriptions.refuser);
r.patch("/inscriptions/:id/annuler", Inscriptions.annuler);
export default r;
