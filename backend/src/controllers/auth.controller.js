import { ok, cree } from "../utils/http.js";
import * as Service from "../services/auth.service.js";

export const login = ok((req) => Service.authentifier(req.body.identifiant, req.body.motDePasse));

// MODIFIÉ : On passe req.user.id_etablissement (récupéré dans le middleware auth.js)
export const moi = ok((req) => Service.profil(req.user.id, req.user.id_etablissement));

export const inscrireEtablissement = cree((req) => Service.creerEspace(req.body));
export const connexionEcole = ok((req) => Service.connexionEcole(req.body.idUtilisateur, req.body.idEtablissement));