import { ok, cree } from "../utils/http.js";
import * as Service from "../services/public.service.js";

export const listerEcoles = ok(() => Service.getEcolesPubliques());
export const listerFormations = ok((req) => Service.getFormationsPubliques(req.params.idEtablissement));
export const inscriptionPublique = cree((req) => Service.inscrireApprenantPublic(req.body));
