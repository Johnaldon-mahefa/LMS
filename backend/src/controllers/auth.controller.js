// Contrôleur (GRASP) : reçoit la requête HTTP, délègue au service, renvoie la réponse. Aucune règle métier ici.
import { asyncHandler } from "../utils/asyncHandler.js";
import * as AuthService from "../services/auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const { identifiant, motDePasse } = req.body;
  res.json(await AuthService.authentifier(identifiant, motDePasse));
});

export const moi = asyncHandler(async (req, res) => {
  res.json(await AuthService.profil(req.user.id));
});
