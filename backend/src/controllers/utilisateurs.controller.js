import * as UtilisateursService from "../services/utilisateurs.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 1. Lister les utilisateurs
export const lister = asyncHandler(async (req, res) => {
  const data = await UtilisateursService.lister(req.user.id_etablissement);
  res.json(data);
});

// 2. Lister uniquement les formateurs
export const listerFormateurs = asyncHandler(async (req, res) => {
  const data = await UtilisateursService.listerFormateurs(req.user.id_etablissement);
  res.json(data);
});

// 3. Créer un utilisateur
export const creer = asyncHandler(async (req, res) => {
  const data = await UtilisateursService.creer(req.body, req.user.id_etablissement);
  res.status(201).json(data);
});

// 4. Désactiver un utilisateur
export const desactiver = asyncHandler(async (req, res) => {
  const data = await UtilisateursService.desactiver(Number(req.params.id), req.user.id_etablissement);
  res.json(data);
});

// 5. Réactiver un utilisateur
export const reactiver = asyncHandler(async (req, res) => {
  const data = await UtilisateursService.reactiver(Number(req.params.id), req.user.id_etablissement);
  res.json(data);
});

// 6. Modifier un utilisateur
export const modifier = asyncHandler(async (req, res) => {
  const data = await UtilisateursService.modifier(Number(req.params.id), req.user.id_etablissement, req.body);
  res.json(data);
});

// 7. Réinitialiser le mot de passe (par un admin)
export const reinitialiserMotDePasse = asyncHandler(async (req, res) => {
  const data = await UtilisateursService.reinitialiserMotDePasse(Number(req.params.id), req.user.id_etablissement, req.body.motDePasse);
  res.json(data);
});

// 8. Changer son propre mot de passe (par l'utilisateur connecté)
export const changerMonMotDePasse = asyncHandler(async (req, res) => {
  const data = await UtilisateursService.changerMonMotDePasse(req.user.id, req.body.motDePasse);
  res.json(data);
});