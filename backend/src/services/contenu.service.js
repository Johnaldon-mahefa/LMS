// Service : « Gérer le contenu pédagogique » — classes Module, Leçon, Ressource, Évaluation (RG8, RG9).
import { AppError } from "../utils/AppError.js";
import { supprimerFichier } from "../middlewares/upload.js";
import path from "node:path";
import * as Formation from "../models/formation.model.js";
import * as Module from "../models/module.model.js";
import * as Lecon from "../models/lecon.model.js";
import * as Ressource from "../models/ressource.model.js";
import * as Evaluation from "../models/evaluation.model.js";
import * as Session from "../models/session.model.js";
import * as Inscription from "../models/inscription.model.js";
import * as Utilisateur from "../models/utilisateur.model.js";
import * as Mailer from "./mailer.service.js";
import { emailNouveauModule } from "../utils/emailTemplates.js";
import * as Notifications from "./notifications.service.js";

const exiger = (valeur, message) => { if (!valeur || !String(valeur).trim()) throw new AppError(400, message); };

// RG9 : un formateur ne modifie que les modules dont il est l'auteur.
async function moduleModifiable(idModule, idFormateur) {
  const module = await Module.findById(idModule);
  if (!module) throw new AppError(404, "Module introuvable.");
  if (module.id_auteur !== idFormateur) throw new AppError(403, "Ce module a été rédigé par un autre formateur.");
  return module;
}

export async function mesFormations(idFormateur) {
  const formations = await Formation.findAffecteesA(idFormateur);
  for (const f of formations) {
    f.modules = (await Module.findByFormation(f.id_formation)).map((m) => ({ ...m, modifiable: m.id_auteur === idFormateur }));
  }
  return formations;
}

export async function detailModule(idModule, idFormateur) {
  const module = await Module.findById(idModule);
  if (!module) throw new AppError(404, "Module introuvable.");
  if (!(await Formation.formateurAffecte(module.id_formation, idFormateur))) throw new AppError(403, "Accès refusé à ce module.");
  return {
    ...module, modifiable: module.id_auteur === idFormateur,
    lecons: await Lecon.findByModule(idModule), ressources: await Ressource.findByModule(idModule), evaluations: await Evaluation.findByModule(idModule),
  };
}

/* ----- Module ----- */
export async function creerModule(idFormation, idFormateur, { titre, description, ordre }) {
  const formation = await Formation.findById(idFormation);
  if (!formation) throw new AppError(404, "Formation introuvable.");
  if (formation.statut_formation === "archivee") throw new AppError(409, "Impossible d'ajouter un module à une formation archivée.");
  if (!(await Formation.formateurAffecte(idFormation, idFormateur))) throw new AppError(403, "Aucune session de cette formation ne vous est affectée.");
  exiger(titre, "Le titre du module est obligatoire.");
  const id = await Module.insert({ idFormation, idAuteur: idFormateur, titre: titre.trim(), description, ordre: Number(ordre) || 1 });
  return Module.findById(id);
}

export async function modifierModule(id, idFormateur, { titre, description, ordre }) {
  await moduleModifiable(id, idFormateur);
  exiger(titre, "Le titre du module est obligatoire.");
  await Module.update(id, { titre: titre.trim(), description, ordre: Number(ordre) || 1 });
  return Module.findById(id);
}

export async function supprimerModule(id, idFormateur) {
  const module = await moduleModifiable(id, idFormateur);
  if (module.statut_module !== "brouillon") throw new AppError(409, "Seul un module au statut brouillon peut être supprimé.");
  if ((await Module.countSoumissions(id)) > 0) throw new AppError(409, "Suppression impossible : des travaux ont déjà été déposés.");
  const ressources = await Ressource.findByModule(id);
  for (const r of ressources) await supprimerFichier((await Ressource.findById(r.id_ressource)).chemin_fichier);
  await Module.remove(id);
}

// Envoie un email à tous les apprenants inscrits (inscriptions validées) dans les sessions de la formation.
async function envoyerEmailNouveauModule(module, formation) {
  try {
    const sessions = await Session.findByFormation(formation.id_formation);
    const vus = new Set();
    for (const s of sessions) {
      const inscriptions = await Inscription.findValideesBySession(s.id_session);
      for (const i of inscriptions) {
        if (vus.has(i.id_apprenant)) continue;
        vus.add(i.id_apprenant);
        const u = await Utilisateur.findById(i.id_apprenant);
        if (!u || !u.identifiant || !u.identifiant.includes("@")) continue;
        const tpl = emailNouveauModule({
          prenom: u.prenom, formation: formation.intitule, module: module.titre,
          urlPlateforme: `${process.env.FRONTEND_URL || "http://localhost:5173"}/mes-formations`,
        });
        Mailer.envoyer({ to: u.identifiant, subject: tpl.subject, html: tpl.html, text: tpl.text })
          .catch((err) => console.error("[contenu.publierModule] email :", err.message));
        Notifications.creer({
          idUtilisateur: u.id_utilisateur, type: "module_publie", titre: "Nouveau module disponible",
          message: `Le module "${module.titre}" a été publié dans "${formation.intitule}".`, lien: "/mes-formations",
        });
      }
    }
  } catch (err) {
    console.error("[contenu.publierModule] email global :", err.message);
  }
}

// RG8 : un module ne peut être publié que s'il contient au moins une leçon et une évaluation.
export async function publierModule(id, idFormateur) {
  const module = await moduleModifiable(id, idFormateur);
  const manquants = [];
  if (module.nb_lecons < 1) manquants.push("au moins une leçon");
  if (module.nb_evaluations < 1) manquants.push("au moins une évaluation");
  if (manquants.length) throw new AppError(409, `Publication refusée : le module doit contenir ${manquants.join(" et ")}.`);
  await Module.setStatut(id, "publie");
  const formation = await Formation.findById(module.id_formation);
  if (formation) {
    const moduleComplet = await Module.findById(id);
    envoyerEmailNouveauModule(moduleComplet, formation);
  }
  return Module.findById(id);
}

export async function retirerPublication(id, idFormateur) {
  await moduleModifiable(id, idFormateur);
  await Module.setStatut(id, "brouillon");
  return Module.findById(id);
}

/* ----- Leçons ----- */
export async function ajouterLecon(idModule, idFormateur, { titre, contenu }) {
  await moduleModifiable(idModule, idFormateur);
  exiger(titre, "Le titre de la leçon est obligatoire.");
  return Lecon.findById(await Lecon.insert(idModule, { titre: titre.trim(), contenu }));
}

async function leconModifiable(id, idFormateur) {
  const lecon = await Lecon.findById(id);
  if (!lecon) throw new AppError(404, "Leçon introuvable.");
  await moduleModifiable(lecon.id_module, idFormateur);
  return lecon;
}

export async function modifierLecon(id, idFormateur, { titre, contenu }) {
  await leconModifiable(id, idFormateur);
  exiger(titre, "Le titre de la leçon est obligatoire.");
  await Lecon.update(id, { titre: titre.trim(), contenu });
  return Lecon.findById(id);
}

export async function supprimerLecon(id, idFormateur) {
  const lecon = await leconModifiable(id, idFormateur);
  const module = await Module.findById(lecon.id_module);
  if (module.statut_module === "publie" && module.nb_lecons <= 1) throw new AppError(409, "Un module publié doit conserver au moins une leçon.");
  await Lecon.remove(id);
}

/* ----- Ressources (fichiers) ----- */
const cheminRelatif = (file) => path.join(path.basename(path.dirname(file.path)), file.filename);
export async function deposerRessource(idModule, idFormateur, file) {
  const chemin = file ? cheminRelatif(file) : null;
  try {
    if (!file) throw new AppError(400, "Le fichier est obligatoire.");
    await moduleModifiable(idModule, idFormateur);
    const id = await Ressource.insert(idModule, file.originalname, chemin);
    const { chemin_fichier, ...visible } = await Ressource.findById(id);
    return visible;
  } catch (err) {
    await supprimerFichier(chemin);
    throw err;
  }
}

export async function supprimerRessource(id, idFormateur) {
  const ressource = await Ressource.findById(id);
  if (!ressource) throw new AppError(404, "Ressource introuvable.");
  await moduleModifiable(ressource.id_module, idFormateur);
  await Ressource.remove(id);
  await supprimerFichier(ressource.chemin_fichier);
}

/* ----- Évaluations (MIS A JOUR POUR LE QCM) ----- */
function verifierEvaluation({ intitule, noteMaximale, typeEvaluation, dureeMinutes, seuilReussite, nbTentativesMax }) {
  exiger(intitule, "L'intitulé de l'évaluation est obligatoire.");
  if (!(Number(noteMaximale) > 0)) throw new AppError(400, "La note maximale doit être positive.");
  if (typeEvaluation && !['fichier', 'qcm', 'mixte'].includes(typeEvaluation)) throw new AppError(400, "Type d'évaluation invalide.");
  if (typeEvaluation === 'qcm' || typeEvaluation === 'mixte') {
      if (dureeMinutes !== undefined && dureeMinutes !== null && dureeMinutes !== "" && Number(dureeMinutes) <= 0) throw new AppError(400, "La durée doit être positive.");
      if (seuilReussite !== undefined && seuilReussite !== null && seuilReussite !== "" && (Number(seuilReussite) < 0 || Number(seuilReussite) > 100)) throw new AppError(400, "Le seuil doit être entre 0 et 100.");
      if (nbTentativesMax !== undefined && Number(nbTentativesMax) < 1) throw new AppError(400, "Le nombre de tentatives doit être au moins 1.");
  }
}

export async function creerEvaluation(idModule, idFormateur, donnees) {
  await moduleModifiable(idModule, idFormateur);
  verifierEvaluation(donnees);
  return Evaluation.findById(await Evaluation.insert(idModule, { 
      ...donnees, 
      intitule: donnees.intitule.trim(), 
      noteMaximale: Number(donnees.noteMaximale),
      typeEvaluation: donnees.typeEvaluation || 'fichier',
      dureeMinutes: donnees.dureeMinutes ? Number(donnees.dureeMinutes) : null,
      seuilReussite: donnees.seuilReussite ? Number(donnees.seuilReussite) : null,
      nbTentativesMax: donnees.nbTentativesMax ? Number(donnees.nbTentativesMax) : 1
  }));
}

async function evaluationModifiable(id, idFormateur) {
  const evaluation = await Evaluation.findById(id);
  if (!evaluation) throw new AppError(404, "Évaluation introuvable.");
  await moduleModifiable(evaluation.id_module, idFormateur);
  return evaluation;
}

export async function modifierEvaluation(id, idFormateur, donnees) {
  await evaluationModifiable(id, idFormateur);
  verifierEvaluation(donnees);
  if ((await Evaluation.countSoumissions(id)) > 0) throw new AppError(409, "Modification impossible : des travaux ont déjà été déposés.");
  await Evaluation.update(id, { 
      ...donnees, 
      intitule: donnees.intitule.trim(), 
      noteMaximale: Number(donnees.noteMaximale),
      typeEvaluation: donnees.typeEvaluation || 'fichier',
      dureeMinutes: donnees.dureeMinutes ? Number(donnees.dureeMinutes) : null,
      seuilReussite: donnees.seuilReussite ? Number(donnees.seuilReussite) : null,
      nbTentativesMax: donnees.nbTentativesMax ? Number(donnees.nbTentativesMax) : 1
  });
  return Evaluation.findById(id);
}

export async function supprimerEvaluation(id, idFormateur) {
  const evaluation = await evaluationModifiable(id, idFormateur);
  if ((await Evaluation.countSoumissions(id)) > 0) throw new AppError(409, "Suppression impossible : des travaux ont déjà été déposés.");
  const module = await Module.findById(evaluation.id_module);
  if (module.statut_module === "publie" && module.nb_evaluations <= 1) throw new AppError(409, "Un module publié doit conserver au moins une évaluation.");
  await Evaluation.remove(id);
}