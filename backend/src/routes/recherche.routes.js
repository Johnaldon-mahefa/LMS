import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import * as Recherche from "../controllers/recherche.controller.js";

const r = Router();
r.use(authenticate);
r.get("/", Recherche.chercher);

export default r;