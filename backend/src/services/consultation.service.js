import path from "node:path";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import * as Inscription from "../models/inscription.model.js";
import * as Module from "../models/module.model.js";
import * as Lecon from "../models/lecon.model.js";
import * as Ressource from "../models/ressource.model.js";
import * as Evaluation from "../models/evaluation.model.js";
import * as Soumission from "../models/soumission.model.js";
import * as Formation from "../models/formation.model.js";
import { calculer } from "./resultats.service.js";

export async function mesFormations(idApprenant, idEtablissement) {
  const inscriptions = await Inscription.findValideesByApprenant(idApprenant, idEtablissement);
  for (const i of inscriptions) i.progression = (await calculer(i.id_inscription)).progression;
  return inscriptions;
}

export async function contenuInscription(idInscription, idApprenant) {
  const inscription = await Inscription.findById(idInscription);
  if (!inscription || inscription.id_apprenant !== idApprenant || inscription.statut_inscription !== "validee")
    throw new AppError(403, "Accès refusé : inscription non validée.");
  const modules = await Module.findByFormation(inscription.id_formation, { seulementPublies: true });
  for (const m of modules) {
    m.lecons = await Lecon.findByModule(m.id_module);
    m.ressources = await Ressource.findByModule(m.id_module);
    m.evaluations = await Evaluation.findByModule(m.id_module);
    for (const e of m.evaluations) {
      const s = await Soumission.findByInscriptionAndEvaluation(idInscription, e.id_evaluation);
      e.soumission = s ? { id_soumission: s.id_soumission, statut_soumission: s.statut_soumission, note: s.note === null ? null : Number(s.note), commentaire: s.commentaire, date_depot: s.date_depot } : null;
    }
  }
  return { inscription, modules };
}

// CORRECTION : Vérification Multi-Tenant pour les fichiers
export async function ressourceAutorisee(idRessource, utilisateur, idEtablissement) {
  const ressource = await Ressource.findById(idRessource);
  if (!ressource) throw new AppError(404, "Fichier introuvable.");
  
  const module = await Module.findById(ressource.id_module);
  const formation = await Formation.findById(module.id_formation);
  
  // On vérifie que la ressource appartient bien à l'école active
  if (formation.id_etablissement !== idEtablissement) {
    throw new AppError(403, "Cette ressource n'appartient pas à votre établissement actuel.");
  }

  let autorise = module.id_auteur === utilisateur.id;
  if (!autorise && module.statut_module === "publie") {
    const inscriptions = await Inscription.findValideesByApprenant(utilisateur.id, idEtablissement);
    autorise = inscriptions.some((i) => i.id_formation === module.id_formation);
  }
  if (!autorise) throw new AppError(403, "Accès refusé à cette ressource.");
  
  return { chemin: path.join(env.uploadDir, ressource.chemin_fichier), nom: ressource.nom_fichier };
}