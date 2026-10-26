import * as Notifications from "./notifications.service.js";
import path from "node:path";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { supprimerFichier } from "../middlewares/upload.js";
import * as Evaluation from "../models/evaluation.model.js";
import * as Module from "../models/module.model.js";
import * as Inscription from "../models/inscription.model.js";
import * as Session from "../models/session.model.js";
import * as Soumission from "../models/soumission.model.js";
import * as Formation from "../models/formation.model.js";
import * as Utilisateur from "../models/utilisateur.model.js";
import * as Mailer from "./mailer.service.js";
import { emailNoteDisponible } from "../utils/emailTemplates.js";

const cheminRelatif = (file) => path.join(path.basename(path.dirname(file.path)), file.filename);

export async function deposer({ idEvaluation, idInscription, utilisateur, file }) {
  const chemin = file ? cheminRelatif(file) : null;
  try {
    if (!file) throw new AppError(400, "Le fichier du travail est obligatoire.");
    const evaluation = await Evaluation.findById(idEvaluation);
    if (!evaluation) throw new AppError(404, "Évaluation introuvable.");
    const module = await Module.findById(evaluation.id_module);
    if (module.statut_module !== "publie") throw new AppError(409, "Le module de cette évaluation n'est pas publié.");
    const inscription = await Inscription.findById(Number(idInscription));
    if (!inscription || inscription.id_apprenant !== utilisateur.id) throw new AppError(404, "Inscription introuvable.");
    if (inscription.statut_inscription !== "validee") throw new AppError(403, "Votre inscription n'est pas validée.");
    if (inscription.id_formation !== module.id_formation) throw new AppError(403, "Cette évaluation n'appartient pas à votre formation.");
    if (await Soumission.findByInscriptionAndEvaluation(inscription.id_inscription, idEvaluation))
      throw new AppError(409, "Vous avez déjà déposé un travail pour cette évaluation.");
    try {
      const id = await Soumission.insert({ idInscription: inscription.id_inscription, idEvaluation, nomFichier: file.originalname, cheminFichier: chemin });
      return await Soumission.findById(id);
    } catch (err) {
      if (err.code === "23505") throw new AppError(409, "Vous avez déjà déposé un travail pour cette évaluation.");
      throw err;
    }
  } catch (err) {
    await supprimerFichier(chemin);
    throw err;
  }
}

// MULTI-TENANT : On passe idEtablissement
export const aCorriger = (idFormateur, idEtablissement) => Soumission.findACorriger(idFormateur, idEtablissement);

async function chargerPourFormateur(id, idFormateur) {
  const soumission = await Soumission.findById(id);
  if (!soumission) throw new AppError(404, "Soumission introuvable.");
  if (!(await Session.formateurAffecte(soumission.id_session, idFormateur))) throw new AppError(403, "Cette soumission ne relève pas de vos sessions.");
  return soumission;
}

export async function detailPourFormateur(id, idFormateur) {
  return chargerPourFormateur(id, idFormateur);
}

async function envoyerEmailNote(soumission) {
  try {
    const u = await Utilisateur.findById(soumission.id_apprenant);
    if (!u || !u.identifiant || !u.identifiant.includes("@")) return;

    const evaluation = await Evaluation.findById(soumission.id_evaluation);
    const module = evaluation ? await Module.findById(evaluation.id_module) : null;
    const formation = module ? await Formation.findById(module.id_formation) : null;

    const tpl = emailNoteDisponible({
      prenom: u.prenom,
      evaluation: evaluation ? evaluation.intitule : "Évaluation",
      formation: formation ? formation.intitule : "",
      note: soumission.note,
      noteMaximale: soumission.note_maximale,
      urlPlateforme: `${process.env.FRONTEND_URL || "http://localhost:5173"}/resultats`,
    });
       await Mailer.envoyer({ to: u.identifiant, subject: tpl.subject, html: tpl.html, text: tpl.text });

    await Notifications.creer({
      idUtilisateur: u.id_utilisateur,
      type: "note_disponible",
      titre: "Note disponible",
      message: `Votre note pour "${evaluation ? evaluation.intitule : "l'évaluation"}" : ${soumission.note}/${soumission.note_maximale}.`,
      lien: "/resultats",
    });
  } catch (err) {
    console.error("[soumissions.corriger] email :", err.message);
  }
}

export async function corriger(id, idFormateur, { note, commentaire }) {
  const soumission = await chargerPourFormateur(id, idFormateur);
  if (soumission.statut_soumission !== "soumise") throw new AppError(409, "Cette soumission est déjà corrigée : la note n'est plus modifiable.");
  const valeur = Number(note);
  if (note === "" || note === null || note === undefined || Number.isNaN(valeur)) throw new AppError(400, "La note est obligatoire.");
  if (valeur < 0 || valeur > soumission.note_maximale) throw new AppError(400, `La note doit être comprise entre 0 et ${soumission.note_maximale}.`);
  await Soumission.corriger(id, valeur, commentaire);

  const resultat = await Soumission.findById(id);

  envoyerEmailNote(resultat);

  return resultat;
}

export async function fichierAutorise(id, utilisateur) {
  const soumission = await Soumission.findById(id);
  if (!soumission) throw new AppError(404, "Soumission introuvable.");
  const autorise = soumission.id_apprenant === utilisateur.id || (await Session.formateurAffecte(soumission.id_session, utilisateur.id));
  if (!autorise) throw new AppError(403, "Accès refusé à ce fichier.");
  return { chemin: path.join(env.uploadDir, soumission.chemin_fichier), nom: soumission.nom_fichier };
}