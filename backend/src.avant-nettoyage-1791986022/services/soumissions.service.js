// Service : « Soumettre une évaluation » et « Corriger les soumissions » (RG10, RG11).
import path from "node:path";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { supprimerFichier } from "../middlewares/upload.js";
import * as Evaluation from "../models/evaluation.model.js";
import * as Module from "../models/module.model.js";
import * as Inscription from "../models/inscription.model.js";
import * as Session from "../models/session.model.js";
import * as Soumission from "../models/soumission.model.js";

const cheminRelatif = (file) => path.join(path.basename(path.dirname(file.path)), file.filename);

// RG10 : une soumission est liée à une inscription validée et à une évaluation d'un module publié ;
// une seule par inscription et par évaluation (contrainte UNIQUE en base), non modifiable après dépôt.
export async function deposer({ idEvaluation, idInscription, utilisateur, file }) {
  const chemin = file ? cheminRelatif(file) : null;
  try {
    if (!file) throw new AppError(400, "Le fichier du travail est obligatoire.");
    const evaluation = await Evaluation.findById(idEvaluation);
    if (!evaluation) throw new AppError(404, "Évaluation introuvable.");
    const module = await Module.findById(evaluation.id_module);
    if (module.statut_module !== "publie") throw new AppError(409, "Le module de cette évaluation n'est pas publié (RG10).");
    const inscription = await Inscription.findById(Number(idInscription));
    if (!inscription || inscription.id_apprenant !== utilisateur.id) throw new AppError(404, "Inscription introuvable.");
    if (inscription.statut_inscription !== "validee") throw new AppError(403, "Votre inscription n'est pas validée (RG10).");
    if (inscription.id_formation !== module.id_formation) throw new AppError(403, "Cette évaluation n'appartient pas à votre formation.");
    if (await Soumission.findByInscriptionAndEvaluation(inscription.id_inscription, idEvaluation))
      throw new AppError(409, "Vous avez déjà déposé un travail pour cette évaluation (RG10).");
    try {
      const id = await Soumission.insert({ idInscription: inscription.id_inscription, idEvaluation, nomFichier: file.originalname, cheminFichier: chemin });
      return await Soumission.findById(id);
    } catch (err) {
      if (err.code === "23505") throw new AppError(409, "Vous avez déjà déposé un travail pour cette évaluation (RG10).");
      throw err;
    }
  } catch (err) {
    await supprimerFichier(chemin); // aucun fichier orphelin en cas de refus
    throw err;
  }
}

export const aCorriger = (idFormateur) => Soumission.findACorriger(idFormateur);

async function chargerPourFormateur(id, idFormateur) {
  const soumission = await Soumission.findById(id);
  if (!soumission) throw new AppError(404, "Soumission introuvable.");
  // RG11 : un formateur ne corrige que les soumissions des apprenants de ses sessions.
  if (!(await Session.formateurAffecte(soumission.id_session, idFormateur))) throw new AppError(403, "Cette soumission ne relève pas de vos sessions (RG11).");
  return soumission;
}

export async function detailPourFormateur(id, idFormateur) {
  return chargerPourFormateur(id, idFormateur);
}

// RG11 : note comprise entre 0 et la note maximale ; la soumission passe de « soumise » à « corrigée » ; note non modifiable ensuite.
export async function corriger(id, idFormateur, { note, commentaire }) {
  const soumission = await chargerPourFormateur(id, idFormateur);
  if (soumission.statut_soumission !== "soumise") throw new AppError(409, "Cette soumission est déjà corrigée : la note n'est plus modifiable (RG11).");
  const valeur = Number(note);
  if (note === "" || note === null || note === undefined || Number.isNaN(valeur)) throw new AppError(400, "La note est obligatoire.");
  if (valeur < 0 || valeur > soumission.note_maximale) throw new AppError(400, `La note doit être comprise entre 0 et ${soumission.note_maximale} (RG11).`);
  await Soumission.corriger(id, valeur, commentaire);
  return Soumission.findById(id);
}

// Fichier d'une soumission : l'apprenant qui l'a déposée ou un formateur affecté à la session.
export async function fichierAutorise(id, utilisateur) {
  const soumission = await Soumission.findById(id);
  if (!soumission) throw new AppError(404, "Soumission introuvable.");
  const autorise = soumission.id_apprenant === utilisateur.id || (await Session.formateurAffecte(soumission.id_session, utilisateur.id));
  if (!autorise) throw new AppError(403, "Accès refusé à ce fichier.");
  return { chemin: path.join(env.uploadDir, soumission.chemin_fichier), nom: soumission.nom_fichier };
}
