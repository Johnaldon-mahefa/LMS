import { Router } from "express";
import { verifierTurnstile } from "../middlewares/turnstile.js";
import * as Controller from "../controllers/public.controller.js";

const r = Router();

r.get("/ecoles", Controller.listerEcoles);
r.get("/ecoles/:idEtablissement/formations", Controller.listerFormations);
r.post("/inscription", verifierTurnstile, Controller.inscriptionPublique);
r.get("/attestation/:numero", Controller.verifierAttestation); // <-- NOUVELLE ROUTE

export default r;