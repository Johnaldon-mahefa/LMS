// Cas d'utilisation « Consulter le contenu de ses formations ».
import { ok, id } from "../utils/http.js";
import * as Service from "../services/consultation.service.js";

export const mesFormations = ok((req) => Service.mesFormations(req.user.id));
export const contenu = ok((req) => Service.contenuInscription(id(req), req.user.id));
