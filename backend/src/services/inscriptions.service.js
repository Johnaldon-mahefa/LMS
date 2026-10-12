// Service : « Gérer les inscriptions » (administrateur) et « Demander son inscription à une session » (apprenant) — RG3, RG6, RG7.
import { withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import * as Inscription from "../models/inscription.model.js";
import * as Session from "../models/session.model.js";
import * as Formation from "../models/formation.model.js";
import * as Utilisateur from "../models/utilisateur.model.js";

async function chargerInscription(id, client) {
  const inscription = await Inscription.findById(id, client);
  if (!inscription) throw new AppError(404, "Inscription introuvable.");
  return inscription;
}

/* ----- Administrateur ----- */
export const lister = () => Inscription.findAll();

// RG6 : la validation est impossible si la capacité de la session est atteinte (contrôle dans une transaction verrouillée).
export async function valider(id) {
  await withTransaction(async (client) => {
    const inscription = await chargerInscription(id, client);
    if (inscription.statut_inscription !== "en_attente") throw new AppError(409, "Seule une demande en attente peut être validée.");
    await Inscription.verrouillerSession(client, inscription.id_session);
    const session = await Session.findById(inscription.id_session);
    if ((await Inscription.countValidees(client, inscription.id_session)) >= session.capacite_max)
      throw new AppError(409, "Validation impossible : la session est complète (RG6).");
    await Inscription.setStatut(client, id, "validee");
  });
  return Inscription.findById(id);
}

export async function refuser(id) {
  await withTransaction(async (client) => {
    const inscription = await chargerInscription(id, client);
    if (inscription.statut_inscription !== "en_attente") throw new AppError(409, "Seule une demande en attente peut être refusée.");
    await Inscription.setStatut(client, id, "refusee");
  });
  return Inscription.findById(id);
}

// Les soumissions déjà déposées sont conservées : l'annulation ne supprime rien.
export async function annuler(id) {
  await withTransaction(async (client) => {
    const inscription = await chargerInscription(id, client);
    if (inscription.statut_inscription !== "validee") throw new AppError(409, "Seule une inscription validée peut être annulée.");
    await Inscription.setStatut(client, id, "annulee");
  });
  return Inscription.findById(id);
}

// Inscription directe par l'administrateur : créée au statut « validée » (RG6), sous réserve de RG3 et RG7.
export async function inscrireDirectement(idApprenant, idSession) {
  const apprenant = await Utilisateur.findById(Number(idApprenant));
  if (!apprenant || !apprenant.roles.includes("apprenant") || apprenant.statut_compte !== "actif")
    throw new AppError(400, "L'utilisateur choisi n'est pas un apprenant actif.");
  const id = await withTransaction(async (client) => {
    const session = await controlerSessionOuverte(idSession);
    if (await Inscription.exists(apprenant.id_utilisateur, idSession)) throw new AppError(409, "L'apprenant est déjà inscrit à cette session (RG7).");
    await Inscription.verrouillerSession(client, idSession);
    if ((await Inscription.countValidees(client, idSession)) >= session.capacite_max) throw new AppError(409, "La session est complète (RG6).");
    return Inscription.insert(client, apprenant.id_utilisateur, idSession, "validee");
  });
  return Inscription.findById(id);
}

/* ----- Apprenant ----- */
async function controlerSessionOuverte(idSession) {
  const session = await Session.findById(Number(idSession));
  if (!session) throw new AppError(404, "Session introuvable.");
  const formation = await Formation.findById(session.id_formation);
  // RG3 : seules les formations publiées acceptent de nouvelles inscriptions.
  if (formation.statut_formation !== "publiee") throw new AppError(409, "Cette formation n'accepte pas d'inscription (RG3).");
  return session;
}

export async function catalogue() {
  const formations = await Formation.findPubliees();
  for (const f of formations) f.sessions = await Session.findByFormation(f.id_formation);
  return formations;
}

export async function demander(idApprenant, idSession) {
  await controlerSessionOuverte(idSession);
  // RG7 : une inscription au plus par apprenant et par session (garanti aussi par la contrainte UNIQUE de la base).
  if (await Inscription.exists(idApprenant, Number(idSession))) throw new AppError(409, "Vous avez déjà une inscription pour cette session (RG7).");
  const id = await withTransaction((client) => Inscription.insert(client, idApprenant, Number(idSession), "en_attente"));
  return Inscription.findById(id);
}

export const mesInscriptions = (idApprenant) => Inscription.findByApprenant(idApprenant);
