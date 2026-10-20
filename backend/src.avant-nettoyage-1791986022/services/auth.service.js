// Service : règles métier de l'authentification (cas d'utilisation « S'authentifier »).
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import * as Utilisateur from "../models/utilisateur.model.js";

export async function authentifier(identifiant, motDePasse) {
  if (!identifiant || !motDePasse) throw new AppError(400, "Identifiant et mot de passe obligatoires.");

  const utilisateur = await Utilisateur.findForLogin(identifiant);
  const motDePasseValide = utilisateur && (await bcrypt.compare(motDePasse, utilisateur.mot_de_passe));
  // Message volontairement identique : ne pas révéler si c'est l'identifiant ou le mot de passe qui est faux.
  if (!motDePasseValide) throw new AppError(401, "Identifiant ou mot de passe incorrect.");
  // Exception du cas d'utilisation : compte désactivé (RG2).
  if (utilisateur.statut_compte !== "actif") throw new AppError(403, "Compte désactivé : contacter l'administrateur.");

  const token = jwt.sign({ roles: utilisateur.roles }, env.jwtSecret, {
    subject: String(utilisateur.id_utilisateur),
    expiresIn: env.jwtExpiresIn,
  });
  return {
    token,
    utilisateur: { id: utilisateur.id_utilisateur, nom: utilisateur.nom, prenom: utilisateur.prenom, roles: utilisateur.roles },
  };
}

export async function profil(id) {
  const utilisateur = await Utilisateur.findById(id);
  if (!utilisateur) throw new AppError(404, "Utilisateur introuvable.");
  return utilisateur;
}
