import { ok, cree, id } from "../utils/http.js";
import * as Service from "../services/inscriptions.service.js";

// MULTI-TENANT : On passe l'id de l'école depuis le token
export const lister = ok((req) => Service.lister(req.user.id_etablissement));
export const mesInscriptions = ok((req) => Service.mesInscriptions(req.user.id, req.user.id_etablissement));

export const catalogue = ok((req) => Service.catalogue(req.user.id_etablissement));
export const demander = cree((req) => Service.demander(req.user.id, req.body.idSession));
export const annulerParApprenant = ok((req) => Service.annulerParApprenant(id(req), req.user.id));

export const valider = ok((req) => Service.valider(id(req)));
export const refuser = ok((req) => Service.refuser(id(req)));
export const annuler = ok((req) => Service.annuler(id(req)));
export const inscrireDirectement = cree((req) =>
  Service.inscrireDirectement(req.body.idApprenant, Number(req.body.idSession))
);