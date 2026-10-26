// Service : calcul des résultats d'une inscription et attestation.
import * as Notifications from "./notifications.service.js";
import { AppError } from "../utils/AppError.js";
import { genererAttestationPdf } from "../utils/pdf.js";
import * as Inscription from "../models/inscription.model.js";
import * as Soumission from "../models/soumission.model.js";
import * as Tentative from "../models/tentative.model.js";
import * as Attestation from "../models/attestation.model.js";
import * as Session from "../models/session.model.js";
import * as Utilisateur from "../models/utilisateur.model.js";
import * as Formation from "../models/formation.model.js"; // <-- AJOUT
import * as Mailer from "./mailer.service.js";
import { emailAttestation } from "../utils/emailTemplates.js";
import { env } from "../config/env.js";

export function estEvaluationValide(e) {
  const seuil = e.seuil_reussite ? Number(e.seuil_reussite) : env.seuilReussite;
  
  const valideFichier = e.statut === "corrigee" && e.note !== null && (Number(e.note) / e.note_maximale) * 100 >= seuil;
  const valideQcm = e.meilleur_score !== null && e.meilleur_score !== undefined && (Number(e.meilleur_score) / e.note_maximale) * 100 >= seuil;

  if (e.type_evaluation === 'fichier') return valideFichier;
  if (e.type_evaluation === 'qcm') return valideQcm;
  if (e.type_evaluation === 'mixte') return valideFichier && valideQcm;
  return false;
}

export async function calculer(idInscription) {
  const inscription = await Inscription.findById(idInscription);
  if (!inscription) throw new AppError(404, "Inscription introuvable.");
  
  const lignes = await Soumission.evaluationsAvecResultat(idInscription, inscription.id_formation);
  const tentatives = await Tentative.findMeilleuresParInscription(idInscription);
  const mapTentatives = new Map(tentatives.map(t => [t.id_evaluation, t.score]));

  const modules = new Map();
  for (const l of lignes) {
    if (!modules.has(l.id_module)) modules.set(l.id_module, { id_module: l.id_module, titre: l.module, evaluations: [] });
    if (l.id_evaluation) {
      modules.get(l.id_module).evaluations.push({
        id_evaluation: l.id_evaluation, 
        intitule: l.intitule, 
        note_maximale: l.note_maximale, 
        type_evaluation: l.type_evaluation,
        seuil_reussite: l.seuil_reussite,
        statut: l.statut_soumission || "non_soumise", 
        note: l.note === null ? null : Number(l.note), 
        commentaire: l.commentaire,
        meilleur_score: mapTentatives.has(l.id_evaluation) ? Number(mapTentatives.get(l.id_evaluation)) : null
      });
    }
  }

  const liste = [...modules.values()].map((m) => {
    const toutesValidees = m.evaluations.every(e => estEvaluationValide(e));
    return { ...m, valide: m.evaluations.length > 0 && toutesValidees };
  });

  const nbValides = liste.filter((m) => m.valide).length;
  const progression = liste.length === 0 ? 0 : Math.round((nbValides / liste.length) * 100);
  
  return { inscription, modules: liste, progression, eligible: liste.length > 0 && nbValides === liste.length, seuil: env.seuilReussite };
}

async function inscriptionDeLApprenant(idInscription, idApprenant) {
  const inscription = await Inscription.findById(idInscription);
  if (!inscription || inscription.id_apprenant !== idApprenant) throw new AppError(404, "Inscription introuvable.");
  if (inscription.statut_inscription !== "validee") throw new AppError(403, "Cette inscription n'est pas validée.");
  return inscription;
}

export async function resultatsApprenant(idInscription, idApprenant) {
  await inscriptionDeLApprenant(idInscription, idApprenant);
  const resultats = await calculer(idInscription);
  resultats.attestation = await Attestation.findByInscription(idInscription);
  return resultats;
}

async function envoyerEmailAttestation(inscription, attestation) {
  try {
    const u = await Utilisateur.findById(inscription.id_apprenant);
    if (!u || !u.identifiant || !u.identifiant.includes("@")) return;
    const tpl = emailAttestation({
      prenom: u.prenom, formation: inscription.formation, numero: attestation.numero_attestation,
      urlPlateforme: `${process.env.FRONTEND_URL || "http://localhost:5173"}/resultats`,
    });
    await Mailer.envoyer({ to: u.identifiant, subject: tpl.subject, html: tpl.html, text: tpl.text });
  } catch (err) {
    console.error("[resultats.delivrerAttestation] email :", err.message);
  }
}

export async function delivrerAttestation(idInscription, idApprenant) {
  await inscriptionDeLApprenant(idInscription, idApprenant);
  const existante = await Attestation.findByInscription(idInscription);
  if (existante) return existante;
  const resultats = await calculer(idInscription);
  if (!resultats.eligible) {
    const restants = resultats.modules.filter((m) => !m.valide).map((m) => m.titre);
    throw new AppError(409, restants.length
      ? `Attestation refusée : modules restant à valider : ${restants.join(", ")} (RG14).`
      : "Attestation refusée : la formation ne contient aucun module publié (RG14).");
  }
  let attestation;
  try {
    attestation = await Attestation.insert(idInscription);
  } catch (err) {
    if (err.code === "23505") return Attestation.findByInscription(idInscription);
    throw err;
  }
  envoyerEmailAttestation(resultats.inscription, attestation);
  return attestation;
}

export async function attestationPdf(idInscription, idApprenant) {
  const inscription = await inscriptionDeLApprenant(idInscription, idApprenant);
  const attestation = await Attestation.findByInscription(idInscription);
  if (!attestation) throw new AppError(404, "Aucune attestation n'a encore été délivrée.");
  const pdf = await genererAttestationPdf({
    numero: attestation.numero_attestation, dateDelivrance: attestation.date_delivrance,
    apprenant: `${inscription.prenom} ${inscription.nom}`, formation: inscription.formation,
    dateDebut: inscription.date_debut, dateFin: inscription.date_fin,
  });
  return { pdf, nom: `${attestation.numero_attestation}.pdf` };
}

// MULTI-TENANT : Filtre par établissement
export const sessionsDuFormateur = (idFormateur, idEtablissement) => Session.findByFormateur(idFormateur, idEtablissement);

export async function progressionSession(idSession, idFormateur, idEtablissement) {
  if (!(await Session.formateurAffecte(idSession, idFormateur))) 
    throw new AppError(403, "Cette session ne vous est pas affectée.");
    
  const session = await Session.findById(idSession);
  const formation = await Formation.findById(session.id_formation);
  
  // MULTI-TENANT : On vérifie que la session appartient à l'école active
  if (formation.id_etablissement !== idEtablissement) 
    throw new AppError(403, "Cette session n'appartient pas à votre établissement actuel.");

  const aCorriger = new Map((await Soumission.countACorrigerParSession(idSession)).map((r) => [r.id_inscription, r.n]));
  const apprenants = [];
  for (const i of await Inscription.findValideesBySession(idSession)) {
    const r = await calculer(i.id_inscription);
    apprenants.push({ id_inscription: i.id_inscription, nom: i.nom, prenom: i.prenom, progression: r.progression, soumissions_a_corriger: aCorriger.get(i.id_inscription) || 0 });
  }
  return { session, apprenants };
}

export async function detailPourFormateur(idInscription, idFormateur) {
  const inscription = await Inscription.findById(idInscription);
  if (!inscription || !(await Session.formateurAffecte(inscription.id_session, idFormateur))) 
    throw new AppError(403, "Cette inscription ne relève pas de vos sessions.");
  return calculer(idInscription);
}