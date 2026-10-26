import { ok } from "../utils/http.js";
import * as Service from "../services/recherche.service.js";

// MULTI-TENANT : On passe req.user.id_etablissement
export const rechercher = ok((req) => Service.rechercher(req.query.q, req.user.id_etablissement, req.user.roles));