// Cas d'utilisation « Gérer les inscriptions » (administrateur) et « Demander son inscription à une session » (apprenant).
import { ok, cree, id } from "../utils/http.js";
import * as Service from "../services/inscriptions.service.js";

export const lister = ok(() => Service.lister());
export const valider = ok((req) => Service.valider(id(req)));
export const refuser = ok((req) => Service.refuser(id(req)));
export const annuler = ok((req) => Service.annuler(id(req)));
export const inscrireDirectement = cree((req) =>
  Service.inscrireDirectement(req.body.idApprenant, Number(req.body.idSession))
);

export const catalogue = ok(() => Service.catalogue());
export const demander = cree((req) => Service.demander(req.user.id, req.body.idSession));
export const mesInscriptions = ok((req) => Service.mesInscriptions(req.user.id));
export const annulerParApprenant = ok((req) => Service.annulerParApprenant(id(req), req.user.id));