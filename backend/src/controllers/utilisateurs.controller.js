import { asyncHandler } from "../utils/asyncHandler.js";
import * as UtilisateursService from "../services/utilisateurs.service.js";

export const lister = asyncHandler(async (req, res) => 
  res.json(await UtilisateursService.lister(req.user.id_etablissement))
);

export const creer = asyncHandler(async (req, res) => 
  res.status(201).json(await UtilisateursService.creer(req.user.id_etablissement, req.body))
);

export const modifier = asyncHandler(async (req, res) =>
  res.json(await UtilisateursService.modifier(Number(req.params.id), req.body)));

export const desactiver = asyncHandler(async (req, res) =>
  res.json(await UtilisateursService.desactiver(Number(req.params.id), req.user.id)));

export const reactiver = asyncHandler(async (req, res) =>
  res.json(await UtilisateursService.reactiver(Number(req.params.id))));

export const reinitialiserMotDePasse = asyncHandler(async (req, res) => {
  await UtilisateursService.reinitialiserMotDePasse(Number(req.params.id), req.body.motDePasse);
  res.status(204).end();
});

export const changerMonMotDePasse = asyncHandler(async (req, res) =>
  res.json(await UtilisateursService.changerMonMotDePasse(req.user.id, req.body)));