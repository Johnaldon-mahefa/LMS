import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import * as Utilisateur from "../models/utilisateur.model.js";
import * as Etablissement from "../models/etablissement.model.js";
import * as Role from "../models/role.model.js";

// Fonction utilitaire pour générer le token
function genererToken(utilisateur, idEtablissement, nomEtablissement, roles) {
  const token = jwt.sign(
    { roles, id_etablissement: idEtablissement },
    env.jwtSecret,
    { subject: String(utilisateur.id_utilisateur), expiresIn: env.jwtExpiresIn }
  );
  return {
    token,
    utilisateur: {
      id: utilisateur.id_utilisateur,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      roles,
      id_etablissement: idEtablissement,
      nom_etablissement: nomEtablissement
    },
  };
}

export async function authentifier(identifiant, motDePasse) {
  const utilisateur = await Utilisateur.findForLogin(identifiant);
  if (!utilisateur || !(await bcrypt.compare(motDePasse, utilisateur.mot_de_passe))) {
    throw new AppError(401, "Identifiant ou mot de passe incorrect.");
  }
  if (utilisateur.statut_compte !== "actif") throw new AppError(403, "Compte désactivé.");

  // Chercher les écoles de cet utilisateur
  const ecoles = await Utilisateur.findEcoles(utilisateur.id_utilisateur);
  if (ecoles.length === 0) throw new AppError(403, "Aucun espace associé à ce compte.");

  if (ecoles.length === 1) {
    // Connexion directe s'il n'y a qu'une école
    const e = ecoles[0];
    return genererToken(utilisateur, e.id_etablissement, e.nom_etablissement, e.roles);
  }

  // Plusieurs écoles : Demander au frontend de choisir
  return {
    choix_ecole_requis: true,
    ecoles: ecoles.map(e => ({ id: e.id_etablissement, nom: e.nom_etablissement })),
    idUtilisateur: utilisateur.id_utilisateur
  };
}

// NOUVELLE FONCTION : Connexion après choix de l'école
export async function connexionEcole(idUtilisateur, idEtablissement) {
  const utilisateur = await Utilisateur.findById(idUtilisateur);
  if (!utilisateur) throw new AppError(404, "Utilisateur introuvable.");

  const ecoles = await Utilisateur.findEcoles(idUtilisateur);
  const ecoleChoisie = ecoles.find(e => e.id_etablissement === Number(idEtablissement));
  
  if (!ecoleChoisie) throw new AppError(403, "Accès refusé à cet espace.");
  
  return genererToken(utilisateur, ecoleChoisie.id_etablissement, ecoleChoisie.nom_etablissement, ecoleChoisie.roles);
}

export async function profil(id) {
  const utilisateur = await Utilisateur.findById(id);
  if (!utilisateur) throw new AppError(404, "Utilisateur introuvable.");
  // Récupérer l'école active depuis le token n'est pas possible ici, donc on renvoie l'utilisateur de base
  return utilisateur;
}

export async function creerEspace({ nomEtablissement, codeAcces, nom, prenom, email, motDePasse }) {
  if (!nomEtablissement || !codeAcces || !nom || !email || !motDePasse) throw new AppError(400, "Tous les champs sont obligatoires.");
  if (await Etablissement.findByCode(codeAcces)) throw new AppError(409, "Ce code d'accès est déjà utilisé.");

  const motDePasseHache = await bcrypt.hash(motDePasse, 10);

  return await withTransaction(async (client) => {
    const idEtablissement = await Etablissement.insert(client, { nom: nomEtablissement, codeAcces });
    
    // Créer l'utilisateur
    const resUser = await client.query(
      "INSERT INTO utilisateur (identifiant, mot_de_passe, nom, prenom) VALUES ($1,$2,$3,$4) RETURNING id_utilisateur",
      [email, motDePasseHache, nom, prenom]
    );
    const idUtilisateur = resUser.rows[0].id_utilisateur;

    // Lui donner le rôle Admin dans cette école
    const roles = await Role.findByNames(client, ["administrateur"]);
    await client.query(
      "INSERT INTO utilisateur_etablissement_role (id_utilisateur, id_etablissement, id_role) VALUES ($1,$2,$3)", 
      [idUtilisateur, idEtablissement, roles[0].id_role]
    );

    return { idEtablissement, idUtilisateur };
  });
}