// Routes de l'apprenant : inscription, consultation, soumission, résultats.
import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth.js";
import { checkFeature } from "../middlewares/featureGating.js"; // <-- NOUVEAU
import { uploadSoumission } from "../middlewares/upload.js";
import * as Inscriptions from "../controllers/inscriptions.controller.js";
import * as Consultation from "../controllers/consultation.controller.js";
import * as Soumissions from "../controllers/soumissions.controller.js";
import * as Resultats from "../controllers/resultats.controller.js";
import * as Qcm from "../controllers/qcm.controller.js";

const r = Router();
r.use(authenticate, requireRole("apprenant"));

r.get("/catalogue", Inscriptions.catalogue);
r.post("/inscriptions", Inscriptions.demander);
r.get("/inscriptions", Inscriptions.mesInscriptions);
r.patch("/inscriptions/:id/annuler", Inscriptions.annulerParApprenant);

r.get("/formations", Consultation.mesFormations);
r.get("/inscriptions/:id/contenu", Consultation.contenu);

r.post("/evaluations/:id/soumissions", uploadSoumission, Soumissions.deposer);

r.get("/inscriptions/:id/resultats", Resultats.resultats);

// SÉCURISATION ICI
r.post("/inscriptions/:id/attestation", Resultats.attestation); 
r.get("/inscriptions/:id/attestation/pdf", checkFeature("ATTESTATION"), Resultats.attestationPdf); // <-- BLOQUÉ SI PAS DE PLAN

r.get("/evaluations/:id/qcm", checkFeature("QCM"), Qcm.demarrer); // <-- BLOQUÉ SI PAS DE PLAN
r.post("/evaluations/:id/qcm", checkFeature("QCM"), Qcm.soumettre); // <-- BLOQUÉ SI PAS DE PLAN

export default r;