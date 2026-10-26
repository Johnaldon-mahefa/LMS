import { AppError } from "../utils/AppError.js";
import * as Etablissement from "../models/etablissement.model.js";

export async function getMonAbonnement(idEtablissement) {
  const etab = await Etablissement.findById(idEtablissement);
  if (!etab) throw new AppError(404, "Établissement introuvable.");
  return etab;
}

export async function payerAbonnement(idEtablissement, plan) {
  const etab = await Etablissement.findById(idEtablissement);
  if (!etab) throw new AppError(404, "Établissement introuvable.");

  // Simulation : On calcule la nouvelle date d'expiration (ici + 30 jours)
  const dateExpiration = new Date();
  dateExpiration.setDate(dateExpiration.getDate() + 30);
  const dateStr = dateExpiration.toISOString().split('T')[0];

  // Mise à jour en base de données (le "paiement" est validé)
  await Etablissement.updateAbonnement(idEtablissement, { 
    plan: plan, // 'basique' ou 'premium'
    dateExpiration: dateStr 
  });

  return { message: "Paiement simulé validé avec succès !", dateExpiration: dateStr };
}
