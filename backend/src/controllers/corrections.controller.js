import { ok, id } from "../utils/http.js";
import * as Service from "../services/soumissions.service.js";

export const aCorriger = ok((req) => Service.aCorriger(req.user.id, req.user.id_etablissement));
export const detail = ok((req) => Service.detailPourFormateur(id(req), req.user.id));
export const corriger = ok((req) => Service.corriger(id(req), req.user.id, req.body));