// Cas d'utilisation « Suivre la progression des apprenants ».
import { ok, id } from "../utils/http.js";
import * as Service from "../services/resultats.service.js";

export const sessions = ok((req) => Service.sessionsDuFormateur(req.user.id));
export const progressionSession = ok((req) => Service.progressionSession(id(req), req.user.id));
export const detailInscription = ok((req) => Service.detailPourFormateur(id(req), req.user.id));
