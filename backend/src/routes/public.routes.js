import { Router } from "express";
import * as Controller from "../controllers/public.controller.js";

const r = Router();

// Ces routes sont publiques (pas de middleware authenticate)
r.get("/ecoles", Controller.listerEcoles);
r.get("/ecoles/:idEtablissement/formations", Controller.listerFormations);
r.post("/inscription", Controller.inscriptionPublique);

export default r;
