// Jeu de données de démonstration (npm run db:demo) : de quoi présenter les quatre flux fonctionnels sans tout saisir à la main.
// Le script passe par les services : les règles de gestion sont donc appliquées comme dans l'application.
import { pool } from "../config/db.js";
import * as Utilisateurs from "../services/utilisateurs.service.js";
import * as Formations from "../services/formations.service.js";
import * as Contenu from "../services/contenu.service.js";
import * as Inscriptions from "../services/inscriptions.service.js";
import * as Utilisateur from "../models/utilisateur.model.js";

async function compte(identifiant, nom, prenom, role, motDePasse) {
  const existant = await Utilisateur.findForLogin(identifiant);
  if (existant) return existant.id_utilisateur;
  return (await Utilisateurs.creer({ identifiant, nom, prenom, roles: [role], motDePasse })).id_utilisateur;
}

try {
  const formateur = await compte("formateur1", "Rakoto", "Jean", "formateur", "Formateur@123");
  const a1 = await compte("apprenant1", "Rabe", "Lala", "apprenant", "Apprenant@123");
  const a2 = await compte("apprenant2", "Randria", "Hery", "apprenant", "Apprenant@123");
  await compte("apprenant3", "Rasoa", "Miora", "apprenant", "Apprenant@123");

  const INTITULE = "Développement web (démonstration)";
  if ((await Formations.lister()).some((f) => f.intitule === INTITULE)) {
    console.log("Données de démonstration déjà présentes.");
  } else {
    const formation = await Formations.creer({ intitule: INTITULE, description: "HTML, CSS et JavaScript", duree: 120, publicVise: "Débutants" });
    const session = await Formations.creerSession(formation.id_formation, { dateDebut: "2026-12-01", dateFin: "2027-02-28", capaciteMax: 10 });
    await Formations.affecterFormateur(session.id_session, formateur);
    const module = await Contenu.creerModule(formation.id_formation, formateur, { titre: "HTML et CSS", description: "Les bases du web", ordre: 1 });
    await Contenu.ajouterLecon(module.id_module, formateur, { titre: "Les balises HTML", contenu: "Structure d'une page web." });
    await Contenu.creerEvaluation(module.id_module, formateur, { intitule: "Projet : ma première page", consigne: "Réaliser une page personnelle.", noteMaximale: 20 });
    await Contenu.publierModule(module.id_module, formateur);
    await Formations.publier(formation.id_formation);
    await Inscriptions.inscrireDirectement(a1, session.id_session);   // apprenant1 : inscription validée
    await Inscriptions.demander(a2, session.id_session);              // apprenant2 : demande en attente de validation
    console.log("Données de démonstration créées.");
  }
  console.log(`
Comptes de démonstration :
  formateur1  / Formateur@123   (formateur)
  apprenant1  / Apprenant@123   (inscription validée)
  apprenant2  / Apprenant@123   (demande en attente)
  apprenant3  / Apprenant@123   (aucune inscription)
  admin       / mot de passe défini dans .env`);
} catch (err) { console.error(err.message); process.exitCode = 1; } finally { await pool.end(); }
