// Téléchargement contrôlé des fichiers : l'accès est vérifié par les services avant l'envoi.
import path from "node:path";
import { createReadStream } from "node:fs";
import { ok } from "../utils/http.js";
import * as Consultation from "../services/consultation.service.js";
import * as Soumissions from "../services/soumissions.service.js";

// Pour les ressources du formateur
export const ressource = ok(async (req, res) => {
  // CORRECTION : On passe req.user.id_etablissement
  const { chemin, nom } = await Consultation.ressourceAutorisee(Number(req.params.id), req.user, req.user.id_etablissement);
  res.setHeader("Content-Disposition", `attachment; filename="${nom}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  createReadStream(chemin).pipe(res);
});

// Pour les soumissions (travaux déposés)
export const soumission = ok(async (req, res) => {
  const { chemin, nom } = await Soumissions.fichierAutorise(Number(req.params.id), req.user);
  res.setHeader("Content-Disposition", `attachment; filename="${nom}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  createReadStream(chemin).pipe(res);
});