import { ok, id } from "../utils/http.js";
import * as Service from "../services/resultats.service.js";

// MULTI-TENANT : On passe l'id de l'école
export const sessions = ok((req) => Service.sessionsDuFormateur(req.user.id, req.user.id_etablissement));
export const progressionSession = ok((req) => Service.progressionSession(id(req), req.user.id, req.user.id_etablissement));
export const detailInscription = ok((req) => Service.detailPourFormateur(id(req), req.user.id));