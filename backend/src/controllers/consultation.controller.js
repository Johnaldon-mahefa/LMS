import { ok, id } from "../utils/http.js";
import * as Service from "../services/consultation.service.js";

// On ajoute req.user.id_etablissement
export const mesFormations = ok((req) => Service.mesFormations(req.user.id, req.user.id_etablissement));
export const contenu = ok((req) => Service.contenuInscription(id(req), req.user.id));