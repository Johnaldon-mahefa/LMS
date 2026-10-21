import { ok, cree } from "../utils/http.js";
import * as Service from "../services/auth.service.js";

export const login = ok((req) => Service.authentifier(req.body.identifiant, req.body.motDePasse));

export const moi = ok((req) => Service.profil(req.user.id));

// NOUVEAU : Contrôleur pour créer un espace
export const inscrireEtablissement = cree((req) => Service.creerEspace(req.body));