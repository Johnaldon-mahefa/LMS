// Service : règles de gestion du cas d'utilisation « Gérer les utilisateurs » (RG1, RG2).
import bcrypt from "bcryptjs";
import { withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import * as Utilisateur from "../models/utilisateur.model.js";
import * as Role from "../models/role.model.js";

const ROLES_VALIDES = ["administrateur", "formateur", "apprenant"];

function verifierRoles(roles) {
  // RG1 : au moins un rôle, parmi les rôles existants.
  if (!Array.isArray(roles) || roles.length === 0) throw new AppError(400, "Au moins un rôle est obligatoire (RG1).");
  if (roles.some((r) => !ROLES_VALIDES.includes(r))) throw new AppError(400, "Rôle inconnu.");
}

function verifierMotDePasse(mdp) {
  if (!mdp || mdp.length < 8) throw new AppError(400, "Le mot de passe doit contenir au moins 8 caractères.");
}

export const lister = () => Utilisateur.findAll();

export async function creer({ nom, prenom, identifiant, roles, motDePasse }) {
  if (!nom || !prenom || !identifiant) throw new AppError(400, "Nom, prénom et identifiant sont obligatoires.");
  verifierRoles(roles);
  verifierMotDePasse(motDePasse);
  const motDePasseHache = await bcrypt.hash(motDePasse, 10);

  const id = await withTransaction(async (client) => {
    if (await Utilisateur.existsByIdentifiant(client, identifiant)) throw new AppError(409, "Cet identifiant est déjà utilisé.");
    const idUtilisateur = await Utilisateur.insert(client, { identifiant, motDePasseHache, nom, prenom });
    const rolesTrouves = await Role.findByNames(client, roles);
    await Utilisateur.setRoles(client, idUtilisateur, rolesTrouves.map((r) => r.id_role));
    return idUtilisateur;
  });
  return Utilisateur.findById(id);
}

export async function modifier(id, { nom, prenom, roles }) {
  if (!nom || !prenom) throw new AppError(400, "Nom et prénom sont obligatoires.");
  verifierRoles(roles);
  if (!(await Utilisateur.findById(id))) throw new AppError(404, "Utilisateur introuvable.");

  await withTransaction(async (client) => {
    await Utilisateur.updateIdentite(client, id, { nom, prenom });
    const rolesTrouves = await Role.findByNames(client, roles);
    await Utilisateur.setRoles(client, id, rolesTrouves.map((r) => r.id_role));
  });
  return Utilisateur.findById(id);
}

// RG2 : un compte est désactivé, jamais supprimé ; l'administrateur ne peut pas désactiver son propre compte.
export async function desactiver(id, idActeur) {
  if (id === idActeur) throw new AppError(403, "Vous ne pouvez pas désactiver votre propre compte (RG2).");
  if (!(await Utilisateur.findById(id))) throw new AppError(404, "Utilisateur introuvable.");
  await Utilisateur.setStatut(id, "desactive");
  return Utilisateur.findById(id);
}

export async function reinitialiserMotDePasse(id, nouveau) {
  verifierMotDePasse(nouveau);
  if (!(await Utilisateur.findById(id))) throw new AppError(404, "Utilisateur introuvable.");
  await Utilisateur.setMotDePasse(id, await bcrypt.hash(nouveau, 10));
}
