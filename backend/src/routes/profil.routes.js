// Routes du profil personnel : accessibles à tout utilisateur authentifié (aucun rôle requis).
import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import * as Utilisateurs from "../controllers/utilisateurs.controller.js";

const r = Router();
r.use(authenticate);

r.patch("/mot-de-passe", Utilisateurs.changerMonMotDePasse);

export default r;
