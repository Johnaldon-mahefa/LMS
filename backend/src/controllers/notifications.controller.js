import { ok, sansContenu, id } from "../utils/http.js";
import * as Service from "../services/notifications.service.js";

export const lister = ok((req) => Service.lister(req.user.id));
export const compterNonLues = ok((req) =>
  Service.compterNonLues(req.user.id).then((n) => ({ total: n }))
);
export const marquerLue = sansContenu((req) => Service.marquerLue(id(req), req.user.id));
export const marquerToutesLues = sansContenu((req) => Service.marquerToutesLues(req.user.id));
export const supprimer = sansContenu((req) => Service.supprimer(id(req), req.user.id));