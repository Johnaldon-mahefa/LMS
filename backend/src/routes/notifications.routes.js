// Routes des notifications personnelles : tout utilisateur authentifié.
import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import * as Notifications from "../controllers/notifications.controller.js";

const r = Router();
r.use(authenticate);

r.get("/", Notifications.lister);
r.get("/non-lues", Notifications.compterNonLues);
r.patch("/toutes-lues", Notifications.marquerToutesLues);
r.patch("/:id/lue", Notifications.marquerLue);
r.delete("/:id", Notifications.supprimer);

export default r;