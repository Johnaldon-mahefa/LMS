// Service : « Gérer les inscriptions » (administrateur) et « Demander son inscription à une session » (apprenant).
import * as Notifications from "./notifications.service.js";
import { withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import * as Inscription from "../models/inscription.model.js";
import * as Session from "../models/session.model.js";
import * as Formation from "../models/formation.model.js";
import * as Utilisateur from "../models/utilisateur.model.js";
import * as Mailer from "./mailer.service.js";
import { emailInscriptionValidee, emailInscriptionRefusee } from "../utils/emailTemplates.js";

async function chargerInscription(id, client) {
  const inscription = await Inscription.findById(id, client);
  if (!inscription) throw new AppError(404, "Inscription introuvable.");
  return inscription;
}

/* ----- Administrateur ----- */
export const lister = () => Inscription.findAll();

export async function valider(id) {
  await withTransaction(async (client) => {
    const inscription = await chargerInscription(id, client);
    if (inscription.statut_inscription !== "en_attente")
      throw new AppError(409, "Seule une demande en attente peut être validée.");
    await Inscription.verrouillerSession(client, inscription.id_session);
    const session = await Session.findById(inscription.id_session);
    if ((await Inscription.countValidees(client, inscription.id_session)) >= session.capacite_max)
      throw new AppError(409, "Validation impossible : la session est complète.");
    await Inscription.setStatut(client, id, "validee");
  });

  const inscription = await Inscription.findById(id);

  // Email de confirmation
  if (inscription.id_apprenant) {
    const u = await Utilisateur.findById(inscription.id_apprenant);
    if (u && u.identifiant.includes("@")) {
      const tpl = emailInscriptionValidee({
        prenom: u.prenom, formation: inscription.formation, dateDebut: inscription.date_debut,
        urlPlateforme: `${process.env.FRONTEND_URL || "http://localhost:5173"}/mes-formations`,
      });
            Mailer.envoyer({ to: u.identifiant, subject: tpl.subject, html: tpl.html, text: tpl.text }).catch(() => {});
    }

    if (u) {
      Notifications.creer({
        idUtilisateur: u.id_utilisateur,
        type: "inscription_validee",
        titre: "Inscription validée",
        message: `Votre inscription à "${inscription.formation}" est validée. Début : ${inscription.date_debut}.`,
        lien: "/mes-formations",
      });
    }
  }

  return inscription;
}

export async function refuser(id) {
  await withTransaction(async (client) => {
    const inscription = await chargerInscription(id, client);
    if (inscription.statut_inscription !== "en_attente")
      throw new AppError(409, "Seule une demande en attente peut être refusée.");
    await Inscription.setStatut(client, id, "refusee");
  });

  const inscription = await Inscription.findById(id);

  // Email de refus
  if (inscription.id_apprenant) {
    const u = await Utilisateur.findById(inscription.id_apprenant);
    if (u && u.identifiant.includes("@")) {
      const tpl = emailInscriptionRefusee({ prenom: u.prenom, formation: inscription.formation });
            Mailer.envoyer({ to: u.identifiant, subject: tpl.subject, html: tpl.html, text: tpl.text }).catch(() => {});
    }

    if (u) {
      Notifications.creer({
        idUtilisateur: u.id_utilisateur,
        type: "inscription_refusee",
        titre: "Inscription refusée",
        message: `Votre demande pour "${inscription.formation}" a été refusée.`,
        lien: "/mes-inscriptions",
      });
    }
  }

  return inscription;
}
export async function annuler(id) {
  await withTransaction(async (client) => {
    const inscription = await chargerInscription(id, client);
    if (inscription.statut_inscription !== "validee")
      throw new AppError(409, "Seule une inscription validée peut être annulée.");
    await Inscription.setStatut(client, id, "annulee");
  });
  return Inscription.findById(id);
}

export async function inscrireDirectement(idApprenant, idSession) {
  const apprenant = await Utilisateur.findById(Number(idApprenant));
  if (!apprenant || !apprenant.roles.includes("apprenant") || apprenant.statut_compte !== "actif")
    throw new AppError(400, "L'utilisateur choisi n'est pas un apprenant actif.");
  const id = await withTransaction(async (client) => {
    const session = await controlerSessionOuverte(idSession);
    if (await Inscription.exists(apprenant.id_utilisateur, idSession))
      throw new AppError(409, "L'apprenant est déjà inscrit à cette session.");
    await Inscription.verrouillerSession(client, idSession);
    if ((await Inscription.countValidees(client, idSession)) >= session.capacite_max)
      throw new AppError(409, "La session est complète.");
    return Inscription.insert(client, apprenant.id_utilisateur, idSession, "validee");
  });

  const inscription = await Inscription.findById(id);

  // Email de confirmation
  if (apprenant.identifiant.includes("@")) {
    const tpl = emailInscriptionValidee({
      prenom: apprenant.prenom, formation: inscription.formation, dateDebut: inscription.date_debut,
      urlPlateforme: `${process.env.FRONTEND_URL || "http://localhost:5173"}/mes-formations`,
    });
    Mailer.envoyer({ to: apprenant.identifiant, subject: tpl.subject, html: tpl.html, text: tpl.text }).catch(() => {});
  }

  return inscription;
}

/* ----- Apprenant ----- */
async function controlerSessionOuverte(idSession) {
  const session = await Session.findById(Number(idSession));
  if (!session) throw new AppError(404, "Session introuvable.");
  const formation = await Formation.findById(session.id_formation);
  if (formation.statut_formation !== "publiee")
    throw new AppError(409, "Cette formation n'accepte pas d'inscription.");
  return session;
}

export async function catalogue() {
  const formations = await Formation.findPubliees();
  for (const f of formations) f.sessions = await Session.findByFormation(f.id_formation);
  return formations;
}

export async function demander(idApprenant, idSession) {
  await controlerSessionOuverte(idSession);
  if (await Inscription.exists(idApprenant, Number(idSession)))
    throw new AppError(409, "Vous avez déjà une inscription pour cette session.");
  const id = await withTransaction((client) => Inscription.insert(client, idApprenant, Number(idSession), "en_attente"));
  return Inscription.findById(id);
}

export const mesInscriptions = (idApprenant) => Inscription.findByApprenant(idApprenant);

export async function annulerParApprenant(idInscription, idApprenant) {
  const inscription = await Inscription.findById(idInscription);
  if (!inscription) throw new AppError(404, "Inscription introuvable.");
  if (inscription.id_apprenant !== idApprenant)
    throw new AppError(403, "Cette inscription ne vous appartient pas.");
  if (!["en_attente", "validee"].includes(inscription.statut_inscription))
    throw new AppError(409, "Cette inscription ne peut plus être annulée.");
  await withTransaction((client) => Inscription.setStatut(client, idInscription, "annulee"));
  return Inscription.findById(idInscription);
}