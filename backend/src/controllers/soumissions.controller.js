// Cas d'utilisation « Soumettre une évaluation ».
import { cree, id } from "../utils/http.js";
import * as Service from "../services/soumissions.service.js";

export const deposer = cree((req) =>
  Service.deposer({ idEvaluation: id(req), idInscription: req.body.idInscription, utilisateur: req.user, file: req.file }));
