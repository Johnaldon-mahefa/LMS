import { ok } from "../utils/http.js";
import * as Service from "../services/statistiques.service.js";

// MULTI-TENANT : On passe l'id de l'établissement au service
export const globales = ok((req) => Service.globales(req.user.id_etablissement));