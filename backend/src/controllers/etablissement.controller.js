import { ok, cree } from "../utils/http.js";
import * as Service from "../services/etablissement.service.js";

export const getMonAbonnement = ok((req) => Service.getMonAbonnement(req.user.id_etablissement));

export const payer = ok((req) => Service.payerAbonnement(req.user.id_etablissement, req.body.plan));
