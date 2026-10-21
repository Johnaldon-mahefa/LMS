// Cas d'utilisation « Organiser les formations ».
import { ok, cree, sansContenu, id } from "../utils/http.js";
import * as Service from "../services/formations.service.js";

// On récupère l'id de l'école depuis le token
export const lister = ok((req) => Service.lister(req.user.id_etablissement));
export const detail = ok((req) => Service.detail(id(req)));
export const creer = cree((req) => Service.creer(req.user.id_etablissement, req.body));
export const modifier = ok((req) => Service.modifier(id(req), req.body));
export const publier = ok((req) => Service.publier(id(req)));
export const archiver = ok((req) => Service.archiver(id(req)));
export const restaurer = ok((req) => Service.restaurer(id(req)));
export const supprimer = sansContenu((req) => Service.supprimer(id(req)));
export const creerSession = cree((req) => Service.creerSession(id(req), req.body));
export const modifierSession = ok((req) => Service.modifierSession(id(req), req.body));
export const supprimerSession = sansContenu((req) => Service.supprimerSession(id(req)));
export const affecterFormateur = ok((req) => Service.affecterFormateur(id(req), req.body.idFormateur));
export const retirerFormateur = ok((req) => Service.retirerFormateur(id(req), id(req, "idFormateur")));