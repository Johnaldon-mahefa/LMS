// Service : notifications in-app. Création non bloquante (ne lève jamais d'erreur).
import * as Notification from "../models/notification.model.js";

// Créer une notification (à appeler après les événements métier : module publié, note, inscription...)
export async function creer({ idUtilisateur, type, titre, message, lien }) {
  try {
    if (!idUtilisateur) return null;
    return await Notification.insert({ idUtilisateur, type, titre, message, lien });
  } catch (err) {
    console.error("[notifications.creer]", err.message);
    return null;
  }
}

export const lister = (idUtilisateur) => Notification.findByUtilisateur(idUtilisateur);
export const compterNonLues = (idUtilisateur) => Notification.compterNonLues(idUtilisateur);
export const marquerLue = (id, idUtilisateur) => Notification.marquerLue(id, idUtilisateur);
export const marquerToutesLues = (idUtilisateur) => Notification.marquerToutesLues(idUtilisateur);
export const supprimer = (id, idUtilisateur) => Notification.remove(id, idUtilisateur);