import { ok, cree } from "../utils/http.js";
import * as Service from "../services/qcm.service.js";

// Routes pour le formateur
export const listerQuestions = ok((req) => Service.listerQuestions(Number(req.params.id)));
export const creerQuestion = cree((req) => Service.creerQuestion(Number(req.params.id), req.body));
export const ajouterProposition = cree((req) => Service.ajouterProposition(Number(req.params.id), req.body));

// Routes pour l'apprenant
export const demarrer = ok((req) => Service.demarrerTentative(Number(req.params.id), req.user.id));

// LA CORRECTION EST ICI : on lit req.body.idTentative au lieu de req.params.id
export const soumettre = ok((req) => Service.soumettreTentative(Number(req.body.idTentative), req.user.id, req.body.reponses));