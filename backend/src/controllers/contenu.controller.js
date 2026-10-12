// Cas d'utilisation « Gérer le contenu pédagogique ».
import { ok, cree, sansContenu, id } from "../utils/http.js";
import * as Service from "../services/contenu.service.js";

export const mesFormations = ok((req) => Service.mesFormations(req.user.id));
export const detailModule = ok((req) => Service.detailModule(id(req), req.user.id));
export const creerModule = cree((req) => Service.creerModule(id(req), req.user.id, req.body));
export const modifierModule = ok((req) => Service.modifierModule(id(req), req.user.id, req.body));
export const supprimerModule = sansContenu((req) => Service.supprimerModule(id(req), req.user.id));
export const publierModule = ok((req) => Service.publierModule(id(req), req.user.id));
export const retirerPublication = ok((req) => Service.retirerPublication(id(req), req.user.id));
export const ajouterLecon = cree((req) => Service.ajouterLecon(id(req), req.user.id, req.body));
export const modifierLecon = ok((req) => Service.modifierLecon(id(req), req.user.id, req.body));
export const supprimerLecon = sansContenu((req) => Service.supprimerLecon(id(req), req.user.id));
export const deposerRessource = cree((req) => Service.deposerRessource(id(req), req.user.id, req.file));
export const supprimerRessource = sansContenu((req) => Service.supprimerRessource(id(req), req.user.id));
export const creerEvaluation = cree((req) => Service.creerEvaluation(id(req), req.user.id, req.body));
export const modifierEvaluation = ok((req) => Service.modifierEvaluation(id(req), req.user.id, req.body));
export const supprimerEvaluation = sansContenu((req) => Service.supprimerEvaluation(id(req), req.user.id));
