import { ok, cree } from "../utils/http.js";
import * as Service from "../services/qcm.service.js";

export const listerQuestions = ok((req) => Service.listerQuestions(Number(req.params.id)));
export const creerQuestion = cree((req) => Service.creerQuestion(Number(req.params.id), req.body));
export const ajouterProposition = cree((req) => Service.ajouterProposition(Number(req.params.id), req.body));

// CORRECTION : On passe req.user.id_etablissement
export const demarrer = ok((req) => Service.demarrerTentative(Number(req.params.id), req.user.id, req.user.id_etablissement));
export const soumettre = ok((req) => Service.soumettreTentative(Number(req.body.idTentative), req.user.id, req.body.reponses)); 