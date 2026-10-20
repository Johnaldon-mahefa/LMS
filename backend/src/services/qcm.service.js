import { AppError } from "../utils/AppError.js";
import * as Evaluation from "../models/evaluation.model.js";
import * as Module from "../models/module.model.js";
import * as Question from "../models/question.model.js";
import * as Proposition from "../models/proposition.model.js";
import * as Tentative from "../models/tentative.model.js";
import * as Reponse from "../models/reponse_tentative.model.js";
import * as Inscription from "../models/inscription.model.js";

// --- CÔTÉ FORMATEUR ---
export async function listerQuestions(idEvaluation) {
  const questions = await Question.findByEvaluation(idEvaluation);
  for (const q of questions) {
    q.propositions = await Proposition.findByQuestion(q.id_question);
  }
  return questions;
}

export async function creerQuestion(idEvaluation, { enonce, typeQuestion, ordre }) {
  const evaluation = await Evaluation.findById(idEvaluation);
  if (!evaluation) throw new AppError(404, "Évaluation introuvable.");
  if (evaluation.type_evaluation === 'fichier') throw new AppError(400, "Cette évaluation est un simple fichier PDF.");
  if (!enonce || !enonce.trim()) throw new AppError(400, "L'énoncé est obligatoire.");
  return Question.insert(idEvaluation, { enonce: enonce.trim(), typeQuestion, ordre });
}

export async function ajouterProposition(idQuestion, { texte, estCorrecte, ordre }) {
  const question = await Question.findById(idQuestion);
  if (!question) throw new AppError(404, "Question introuvable.");
  if (!texte || !texte.trim()) throw new AppError(400, "Le texte de la proposition est obligatoire.");
  return Proposition.insert(idQuestion, { texte: texte.trim(), estCorrecte, ordre });
}

// --- CÔTÉ APPRENANT ---
async function getQuestionsSafe(idEvaluation) {
  const questions = await Question.findByEvaluation(idEvaluation);
  for (const q of questions) {
    const propositions = await Proposition.findByQuestion(q.id_question);
    q.propositions = propositions.map(p => ({ id_proposition: p.id_proposition, texte: p.texte }));
  }
  return questions;
}

export async function demarrerTentative(idEvaluation, idUtilisateur) {
  const evaluation = await Evaluation.findById(idEvaluation);
  if (!evaluation) throw new AppError(404, "Évaluation introuvable.");
  if (evaluation.type_evaluation === 'fichier') throw new AppError(400, "Cette évaluation ne contient pas de QCM.");

  const module = await Module.findById(evaluation.id_module);
  const inscriptions = await Inscription.findValideesByApprenant(idUtilisateur);
  const inscription = inscriptions.find(i => i.id_formation === module.id_formation);
  if (!inscription) throw new AppError(403, "Vous n'êtes pas inscrit à cette formation.");

  // 1. Chercher une tentative en cours
  const tentativeEnCours = await Tentative.findEnCours(inscription.id_inscription, idEvaluation);
  
  if (tentativeEnCours) {
    // Si le chrono existe, on vérifie s'il est dépassé
    if (evaluation.duree_minutes && evaluation.duree_minutes > 0) {
      const dateDebut = new Date(tentativeEnCours.date_debut).getTime();
      const dateFinTheorique = dateDebut + (evaluation.duree_minutes * 60000);
      
      if (Date.now() > dateFinTheorique) {
        await Tentative.terminer(tentativeEnCours.id_tentative, { score: 0, scoreMax: evaluation.note_maximale, statut: 'expiree' });
      } else {
        const questions = await getQuestionsSafe(idEvaluation);
        const tempsRestantMinutes = Math.ceil((dateFinTheorique - Date.now()) / 60000);
        return { idTentative: tentativeEnCours.id_tentative, dureeMinutes: tempsRestantMinutes, questions, reprise: true };
      }
    } else {
      // Pas de chrono, on reprend
      const questions = await getQuestionsSafe(idEvaluation);
      return { idTentative: tentativeEnCours.id_tentative, dureeMinutes: null, questions, reprise: true };
    }
  }

  // 2. Si pas de tentative en cours, vérifier la limite
  const nbDejaFaites = await Tentative.compterTentatives(inscription.id_inscription, idEvaluation);
  if (nbDejaFaites >= evaluation.nb_tentatives_max) {
    throw new AppError(403, `Limite atteinte : vous avez droit à ${evaluation.nb_tentatives_max} tentative(s).`);
  }

  // 3. Créer la tentative
  const idTentative = await Tentative.insert({
    idInscription: inscription.id_inscription,
    idEvaluation: idEvaluation,
    numeroTentative: nbDejaFaites + 1
  });

  const questions = await getQuestionsSafe(idEvaluation);
  return { idTentative, dureeMinutes: evaluation.duree_minutes, questions, reprise: false };
}


export async function soumettreTentative(idTentative, idUtilisateur, reponsesSoumises) {
  const tentative = await Tentative.findById(idTentative);
  if (!tentative) throw new AppError(404, "Tentative introuvable.");
  if (tentative.statut !== 'en_cours') throw new AppError(400, "Cette tentative est déjà terminée.");

  const evaluation = await Evaluation.findById(tentative.id_evaluation);
  const questions = await Question.findByEvaluation(evaluation.id_evaluation);

  // VÉRIFICATION DU CHRONOMÈTRE
  if (evaluation.duree_minutes) {
    const dateDebut = new Date(tentative.date_debut).getTime();
    const dateFinTheorique = dateDebut + (evaluation.duree_minutes * 60000);
    if (Date.now() > dateFinTheorique + 30000) { // 30 sec de tolérance
      await calculerEtSauvegarderScore(idTentative, evaluation, questions, reponsesSoumises, 'expiree');
      throw new AppError(403, "Le temps imparti est écoulé. Votre tentative a été soumise automatiquement.");
    }
  }

  return calculerEtSauvegarderScore(idTentative, evaluation, questions, reponsesSoumises, 'soumise');
}

async function calculerEtSauvegarderScore(idTentative, evaluation, questions, reponsesSoumises, statutFinal) {
  let bonnesReponses = 0;
  const reponsesAInserer = [];

  for (const q of questions) {
    const reponseApprenant = reponsesSoumises.find(r => r.id_question === q.id_question);
    if (reponseApprenant) {
      const propositions = await Proposition.findByQuestion(q.id_question);
      const propChoisie = propositions.find(p => p.id_proposition === reponseApprenant.id_proposition);
      if (propChoisie && propChoisie.est_correcte) bonnesReponses++;
      reponsesAInserer.push({
        id_question: q.id_question,
        id_proposition: reponseApprenant.id_proposition,
        est_correcte: propChoisie ? propChoisie.est_correcte : false
      });
    }
  }

  if (reponsesAInserer.length > 0) await Reponse.insertMany(idTentative, reponsesAInserer);

  const totalQuestions = questions.length;
  const scoreMax = totalQuestions > 0 ? evaluation.note_maximale : 0;
  const score = totalQuestions > 0 ? (bonnesReponses / totalQuestions) * evaluation.note_maximale : 0;

  await Tentative.terminer(idTentative, { score, scoreMax, statut: statutFinal });
  return { score, scoreMax, bonnesReponses, total: totalQuestions, statut: statutFinal };
}