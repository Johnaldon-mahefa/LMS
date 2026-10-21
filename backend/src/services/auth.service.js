// Service : règles métier de l'authentification.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import * as Utilisateur from "../models/utilisateur.model.js";
import * as Etablissement from "../models/etablissement.model.js";
import * as Role from "../models/role.model.js";

export async function authentifier(identifiant, motDePasse) {
  if (!identifiant || !motDePasse) throw new AppError(400, "Identifiant et mot de passe obligatoires.");

  const utilisateur = await Utilisateur.findForLogin(identifiant);
  const motDePasseValide = utilisateur && (await bcrypt.compare(motDePasse, utilisateur.mot_de_passe));
  
  if (!motDePasseValide) throw new AppError(401, "Identifiant ou mot de passe incorrect.");
  if (utilisateur.statut_compte !== "actif") throw new AppError(403, "Compte désactivé : contacter l'administrateur.");

  const token = jwt.sign({ 
    roles: utilisateur.roles,
    id_etablissement: utilisateur.id_etablissement 
  }, env.jwtSecret, {
    subject: String(utilisateur.id_utilisateur),
    expiresIn: env.jwtExpiresIn,
  });
  
  return {
    token,
    utilisateur: { 
      id: utilisateur.id_utilisateur, 
      nom: utilisateur.nom, 
      prenom: utilisateur.prenom, 
      roles: utilisateur.roles,
      id_etablissement: utilisateur.id_etablissement, // <-- LA VIRGULE ÉTAIT MANQUANTE ICI
      nom_etablissement: utilisateur.nom_etablissement 
    },
  };
}

export async function profil(id) {
  const utilisateur = await Utilisateur.findById(id);
  if (!utilisateur) throw new AppError(404, "Utilisateur introuvable.");
  return utilisateur;
}

// Créer un espace (Multi-Tenant)
export async function creerEspace({ nomEtablissement, codeAcces, nom, prenom, email, motDePasse }) {
  if (!nomEtablissement || !codeAcces || !nom || !email || !motDePasse) {
    throw new AppError(400, "Tous les champs sont obligatoires.");
  }
  if (await Etablissement.findByCode(codeAcces)) {
    throw new AppError(409, "Ce code d'accès est déjà utilisé.");
  }

  const motDePasseHache = await bcrypt.hash(motDePasse, 10);

  return await withTransaction(async (client) => {
    // 1. Créer l'école
    const idEtablissement = await Etablissement.insert(client, { nom: nomEtablissement, codeAcces });

    // 2. Créer l'admin
    const resUser = await client.query(
      "INSERT INTO utilisateur (id_etablissement, identifiant, mot_de_passe, nom, prenom) VALUES ($1,$2,$3,$4,$5) RETURNING id_utilisateur",
      [idEtablissement, email, motDePasseHache, nom, prenom]
    );
    const idUtilisateur = resUser.rows[0].id_utilisateur;

    // 3. Lui donner le rôle Administrateur
    const roles = await Role.findByNames(client, ["administrateur"]);
    await client.query("INSERT INTO utilisateur_role (id_utilisateur, id_role) VALUES ($1,$2)", [idUtilisateur, roles[0].id_role]);

    return { idEtablissement, idUtilisateur };
  });
}