// Téléchargement contrôlé des fichiers : l'accès est vérifié par les services avant l'envoi.
import { asyncHandler } from "../utils/asyncHandler.js";
import { id } from "../utils/http.js";
import { AppError } from "../utils/AppError.js";
import * as Consultation from "../services/consultation.service.js";
import * as Soumissions from "../services/soumissions.service.js";

const envoyer = (res, { chemin, nom }) => res.download(chemin, nom, (err) => { if (err && !res.headersSent) res.status(404).json({ message: "Fichier introuvable sur le serveur." }); });

export const ressource = asyncHandler(async (req, res) => envoyer(res, await Consultation.ressourceAutorisee(id(req), req.user)));
export const soumission = asyncHandler(async (req, res) => envoyer(res, await Soumissions.fichierAutorise(id(req), req.user)));
