// Routes de l'apprenant : inscription, consultation, soumission, résultats. RG15 : rôle apprenant uniquement.
import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { uploadSoumission } from "../middlewares/upload.js";
import * as Inscriptions from "../controllers/inscriptions.controller.js";
import * as Consultation from "../controllers/consultation.controller.js";
import * as Soumissions from "../controllers/soumissions.controller.js";
import * as Resultats from "../controllers/resultats.controller.js";

const r = Router();
r.use(authenticate, requireRole("apprenant"));

r.get("/catalogue", Inscriptions.catalogue);
r.post("/inscriptions", Inscriptions.demander);
r.get("/inscriptions", Inscriptions.mesInscriptions);

r.get("/formations", Consultation.mesFormations);
r.get("/inscriptions/:id/contenu", Consultation.contenu);

r.post("/evaluations/:id/soumissions", uploadSoumission, Soumissions.deposer);

r.get("/inscriptions/:id/resultats", Resultats.resultats);
r.post("/inscriptions/:id/attestation", Resultats.attestation);
r.get("/inscriptions/:id/attestation/pdf", Resultats.attestationPdf);
export default r;
