import { ok, cree } from "../utils/http.js";
import * as Service from "../services/public.service.js";
import * as EtablissementService from "../services/etablissement.service.js"; // <-- IMPORT

export const listerEcoles = ok(() => Service.getEcolesPubliques());
export const listerFormations = ok((req) => Service.getFormationsPubliques(req.params.idEtablissement));
export const inscriptionPublique = cree((req) => Service.inscrireApprenantPublic(req.body));
export const verifierAttestation = ok((req) => Service.verifierAttestation(req.params.numero));

// NOUVELLE ROUTE : Récupérer les plans publiquement
export const listerPlans = ok(() => EtablissementService.getPlansDisponibles());