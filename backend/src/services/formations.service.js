import { AppError } from "../utils/AppError.js";
import * as Formation from "../models/formation.model.js";
import * as Session from "../models/session.model.js";
import * as Utilisateur from "../models/utilisateur.model.js";
import { query, withTransaction } from "../config/db.js"; // <-- Ajout withTransaction
import * as Resultats from "./resultats.service.js"; // <-- Ajout pour attestations

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

export const lister = (idEtablissement) => Formation.findAllByEtablissement(idEtablissement);

export async function detail(id) {
  const formation = await chargerFormation(id);
  return { ...formation, sessions: await Session.findByFormation(id) };
}

export async function creer(idEtablissement, donnees) {
  verifierFormation(donnees);
  if (await Formation.existsIntitule(donnees.intitule.trim(), idEtablissement)) {
    throw new AppError(409, "Une formation porte déjà cet intitulé dans votre établissement.");
  }
  const id = await Formation.insert({ ...donnees, idEtablissement, intitule: donnees.intitule.trim() });
  return Formation.findById(id);
}

export async function modifier(id, donnees) {
  const formation = await chargerFormation(id);
  if (formation.statut_formation === "archivee") throw new AppError(409, "Une formation archivée ne peut plus être modifiée.");
  verifierFormation(donnees);
  if (await Formation.existsIntitule(donnees.intitule.trim(), formation.id_etablissement, id)) {
    throw new AppError(409, "Une formation porte déjà cet intitulé dans votre établissement.");
  }
  await Formation.update(id, { ...donnees, intitule: donnees.intitule.trim() });
  return Formation.findById(id);
}

export async function publier(id) {
  const formation = await chargerFormation(id);
  if (formation.statut_formation === "archivee") throw new AppError(409, "Une formation archivée ne peut pas être publiée.");
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
  if (formation.nb_sessions > 0) throw new AppError(409, "Suppression impossible : la formation possède des sessions.");
  await Formation.remove(id);
}

/* ----- Sessions et affectation des formateurs (RG5) ----- */
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
  await query("DELETE FROM affectation WHERE id_session = $1", [id]);
  await Session.remove(id);
}

export async function affecterFormateur(idSession, idFormateur) {
  const session = await chargerSession(idSession);
  const formation = await Formation.findById(session.id_formation);
  const idEtablissement = formation.id_etablissement;

  const formateur = await Utilisateur.findById(Number(idFormateur));
  if (!formateur || formateur.statut_compte !== "actif") {
    throw new AppError(400, "L'utilisateur choisi n'est pas actif.");
  }

  const roles = await Utilisateur.getRolesInEtablissement(formateur.id_utilisateur, idEtablissement);
  if (!roles.includes("formateur")) {
    throw new AppError(400, "L'utilisateur choisi n'est pas un formateur dans cet établissement.");
  }

  await Session.addFormateur(idSession, formateur.id_utilisateur);
  return Session.findById(idSession);
}

export async function retirerFormateur(idSession, idFormateur) {
  await chargerSession(idSession);
  await Session.removeFormateur(idSession, idFormateur);
  return Session.findById(idSession);
}

// NOUVELLE FONCTION : Clôturer une session et générer les attestations
export async function cloturerSession(idSession, idEtablissement) {
  return await withTransaction(async (client) => {
    // 1. Vérifier que la session appartient à l'établissement
    const check = await client.query(`
      SELECT s.id_session FROM session s
      JOIN formation f ON s.id_formation = f.id_formation
      WHERE s.id_session = $1 AND f.id_etablissement = $2
    `, [idSession, idEtablissement]);
    
    if (check.rowCount === 0) throw new AppError(404, "Session introuvable ou non autorisée.");

    // 2. Fermer la session
    await client.query("UPDATE session SET statut_session = 'fermee' WHERE id_session = $1", [idSession]);

    // 3. Récupérer les apprenants validés
    const apprenants = await client.query(`
      SELECT i.id_inscription, i.id_utilisateur 
      FROM inscription i 
      WHERE i.id_session = $1 AND i.statut_inscription = 'validee'
    `, [idSession]);

    let attestationsGenerees = 0;
    
    // 4. Générer les attestations (hors transaction pour éviter les conflits de verrous)
    for (const app of apprenants.rows) {
      try {
        await Resultats.delivrerAttestation(app.id_inscription, app.id_utilisateur);
        attestationsGenerees++;
      } catch (e) {
        // Si l'apprenant n'a pas 100%, delivrerAttestation lèvera une erreur, on l'ignore
        console.log(`Attestation non délivrée pour ${app.id_inscription}: ${e.message}`);
      }
    }

    return { 
      success: true, 
      message: `Session clôturée avec succès. ${attestationsGenerees} attestation(s) générée(s).` 
    };
  });
}