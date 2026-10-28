import { ok } from "../utils/http.js";
import * as Service from "../services/etablissement.service.js";
import { verifierStatutPaiementMvola } from "../services/paiement.service.js";

export const getMonAbonnement = ok((req) => Service.getMonAbonnement(req.user.id_etablissement));
export const getPlans = ok(() => Service.getPlansDisponibles());
export const payer = ok((req) => Service.payerAbonnement(req.user.id_etablissement, req.body.id_plan));
export const verifierStatut = ok((req) => verifierStatutPaiementMvola(req.params.serverCorrelationId));