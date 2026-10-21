// Service : règles de gestion du cas d'utilisation « Gérer les utilisateurs » (RG1, RG2).
import bcrypt from "bcryptjs";
import { withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import * as Utilisateur from "../models/utilisateur.model.js";
import * as Role from "../models/role.model.js";
import * as Mailer from "./mailer.service.js";
import { emailBienvenue } from "../utils/emailTemplates.js";

const ROLES_VALIDES = ["administrateur", "formateur", "apprenant"];

function verifierRoles(roles) {
  if (!Array.isArray(roles) || roles.length === 0) throw new AppError(400, "Au moins un rôle est obligatoire.");
  if (roles.some((r) => !ROLES_VALIDES.includes(r))) throw new AppError(400, "Rôle inconnu.");
}

function verifierMotDePasse(mdp) {
  if (!mdp || mdp.length < 8) throw new AppError(400, "Le mot de passe doit contenir au moins 8 caractères.");
}

export const lister = (idEtablissement) => Utilisateur.findAll(idEtablissement);

export async function creer(idEtablissement, { nom, prenom, identifiant, roles, motDePasse }) {
  if (!nom || !prenom || !identifiant) throw new AppError(400, "Nom, prénom et identifiant sont obligatoires.");
  verifierRoles(roles);
  verifierMotDePasse(motDePasse);
  const motDePasseHache = await bcrypt.hash(motDePasse, 10);

  const id = await withTransaction(async (client) => {
    // On vérifie si l'identifiant existe
    if (await Utilisateur.existsByIdentifiant(client, identifiant)) {
      throw new AppError(409, "Cet identifiant est déjà utilisé.");
    }
    // On insère l'utilisateur
    const idUtilisateur = await Utilisateur.insert(client, { idEtablissement, identifiant, motDePasseHache, nom, prenom });
    // On récupère et assigne les rôles
    const rolesTrouves = await Role.findByNames(client, roles);
    await Utilisateur.setRoles(client, idUtilisateur, rolesTrouves.map((r) => r.id_role));
    
    return idUtilisateur;
  });

  const utilisateur = await Utilisateur.findById(id);

  if (identifiant.includes("@")) {
    const template = emailBienvenue({
      prenom, nom, identifiant, motDePasse,
      urlPlateforme: `${process.env.FRONTEND_URL || "http://localhost:5173"}/connexion`,
    });
    Mailer.envoyer({ to: identifiant, subject: template.subject, html: template.html, text: template.text })
      .catch((err) => console.error("[utilisateurs.creer] email :", err));
  }

  return utilisateur;
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

export async function desactiver(id, idActeur) {
  if (id === idActeur) throw new AppError(403, "Vous ne pouvez pas désactiver votre propre compte.");
  if (!(await Utilisateur.findById(id))) throw new AppError(404, "Utilisateur introuvable.");
  await Utilisateur.setStatut(id, "desactive");
  return Utilisateur.findById(id);
}

export async function reactiver(id) {
  const utilisateur = await Utilisateur.findById(id);
  if (!utilisateur) throw new AppError(404, "Utilisateur introuvable.");
  if (utilisateur.statut_compte === "actif") throw new AppError(409, "Ce compte est déjà actif.");
  await Utilisateur.setStatut(id, "actif");
  return Utilisateur.findById(id);
}

export async function reinitialiserMotDePasse(id, nouveau) {
  verifierMotDePasse(nouveau);
  if (!(await Utilisateur.findById(id))) throw new AppError(404, "Utilisateur introuvable.");
  await Utilisateur.setMotDePasse(id, await bcrypt.hash(nouveau, 10));
}

export async function changerMonMotDePasse(id, { ancien, nouveau }) {
  if (!ancien || !nouveau) throw new AppError(400, "Ancien et nouveau mot de passe obligatoires.");
  verifierMotDePasse(nouveau);
  const utilisateur = await Utilisateur.findById(id);
  if (!utilisateur) throw new AppError(404, "Utilisateur introuvable.");

  const complet = await Utilisateur.findForLogin(utilisateur.identifiant);
  if (!complet) throw new AppError(404, "Utilisateur introuvable.");

  const ok = await bcrypt.compare(ancien, complet.mot_de_passe);
  if (!ok) throw new AppError(401, "Ancien mot de passe incorrect.");

  await Utilisateur.setMotDePasse(id, await bcrypt.hash(nouveau, 10));
  return { ok: true };
}