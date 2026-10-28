import { ok } from "../utils/http.js";
import * as Service from "../services/ia.service.js";

export const chat = ok(async (req) => {
  const { question, historique } = req.body;
  const nomEcole = req.user.nom_etablissement || "notre école";
  const roleUtilisateur = req.user.roles[0] || "apprenant"; // Récupère 'administrateur', 'formateur' ou 'apprenant'
  
  return await Service.poserQuestion(question, historique, nomEcole, roleUtilisateur);
});