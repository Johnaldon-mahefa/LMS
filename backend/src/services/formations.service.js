// Service : règles de gestion de « Organiser les formations » (RG3, RG4, RG5, RG9).
import { AppError } from "../utils/AppError.js";
import * as Formation from "../models/formation.model.js";
import * as Session from "../models/session.model.js";
import * as Utilisateur from "../models/utilisateur.model.js";

async function chargerFormation(id) {
  const formation = await Formation.findById(id);
  if (!formation) throw new AppError(404, "Formation introuvable.");
  return formation;
}
async function chargerSession(id) {
  const session = await Session.findById(id);
  if (!session) throw new AppError(404, "Session introuvable.");
  return session;
}
function verifierFormation({ intitule, duree }) {
  if (!intitule || !intitule.trim()) throw new AppError(400, "L'intitulé de la formation est obligatoire.");
  if (duree !== undefined && duree !== null && duree !== "" && !(Number(duree) > 0)) throw new AppError(400, "La durée doit être positive.");
}
function verifierSession({ dateDebut, dateFin, capaciteMax }) {
  if (!dateDebut || !dateFin) throw new AppError(400, "Les dates de début et de fin sont obligatoires.");
  if (dateFin < dateDebut) throw new AppError(400, "La date de fin doit suivre la date de début.");
  if (!(Number(capaciteMax) > 0)) throw new AppError(400, "La capacité maximale doit être positive.");
}

// Modification : On passe l'id_etablissement pour filtrer
export const lister = (idEtablissement) => Formation.findAllByEtablissement(idEtablissement);

export async function detail(id) {
  const formation = await chargerFormation(id);
  return { ...formation, sessions: await Session.findByFormation(id) };
}

// Modification : On sauvegarde l'id_etablissement lors de la création
export async function creer(idEtablissement, donnees) {
  verifierFormation(donnees);
  if (await Formation.existsIntitule(donnees.intitule.trim())) throw new AppError(409, "Une formation porte déjà cet intitulé.");
  const id = await Formation.insert({ ...donnees, idEtablissement, intitule: donnees.intitule.trim() });
  return Formation.findById(id);
}

export async function modifier(id, donnees) {
  const formation = await chargerFormation(id);
  if (formation.statut_formation === "archivee") throw new AppError(409, "Une formation archivée ne peut plus être modifiée. Restaurez-la d'abord.");
  verifierFormation(donnees);
  if (await Formation.existsIntitule(donnees.intitule.trim(), id)) throw new AppError(409, "Une formation porte déjà cet intitulé.");
  await Formation.update(id, { ...donnees, intitule: donnees.intitule.trim() });
  return Formation.findById(id);
}

export async function publier(id) {
  const formation = await chargerFormation(id);
  if (formation.statut_formation === "archivee") throw new AppError(409, "Une formation archivée ne peut pas être publiée. Restaurez-la d'abord.");
  if (formation.nb_modules_publies < 1) throw new AppError(409, "Publication refusée : la formation ne contient aucun module publié.");
  await Formation.setStatut(id, "publiee");
  return Formation.findById(id);
}

export async function archiver(id) {
  const formation = await chargerFormation(id);
  if (formation.statut_formation === "archivee") throw new AppError(409, "Cette formation est déjà archivée.");
  await Formation.setStatut(id, "archivee");
  return Formation.findById(id);
}

export async function restaurer(id) {
  const formation = await chargerFormation(id);
  if (formation.statut_formation !== "archivee") throw new AppError(409, "Seule une formation archivée peut être restaurée.");
  await Formation.setStatut(id, "brouillon");
  return Formation.findById(id);
}

export async function supprimer(id) {
  const formation = await chargerFormation(id);
  if (formation.nb_sessions > 0) throw new AppError(409, "Suppression impossible : la formation possède des sessions. Elle peut être archivée.");
  await Formation.remove(id);
}

export async function creerSession(idFormation, donnees) {
  const formation = await chargerFormation(idFormation);
  if (formation.statut_formation === "archivee") throw new AppError(409, "Impossible d'ajouter une session à une formation archivée.");
  verifierSession(donnees);
  const id = await Session.insert(idFormation, { ...donnees, capaciteMax: Number(donnees.capaciteMax) });
  return Session.findById(id);
}

export async function modifierSession(id, donnees) {
  const session = await chargerSession(id);
  verifierSession(donnees);
  if (Number(donnees.capaciteMax) < session.capacite_max - session.places_restantes)
    throw new AppError(409, "La capacité ne peut pas être inférieure au nombre d'inscriptions validées.");
  await Session.update(id, { ...donnees, capaciteMax: Number(donnees.capaciteMax) });
  return Session.findById(id);
}

export async function supprimerSession(id) {
  const session = await chargerSession(id);
  if (session.nb_inscriptions > 0) throw new AppError(409, "Suppression impossible : la session possède des inscriptions.");
  await Session.remove(id);
}

export async function affecterFormateur(idSession, idFormateur) {
  await chargerSession(idSession);
  const formateur = await Utilisateur.findById(Number(idFormateur));
  if (!formateur || !formateur.roles.includes("formateur") || formateur.statut_compte !== "actif")
    throw new AppError(400, "L'utilisateur choisi n'est pas un formateur actif.");
  await Session.addFormateur(idSession, formateur.id_utilisateur);
  return Session.findById(idSession);
}

export async function retirerFormateur(idSession, idFormateur) {
  await chargerSession(idSession);
  await Session.removeFormateur(idSession, idFormateur);
  return Session.findById(idSession);
}