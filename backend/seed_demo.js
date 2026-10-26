import bcrypt from 'bcryptjs';
import { query, withTransaction } from './src/config/db.js';

async function seed() {
  console.log("🧹 1. Nettoyage complet de la base de données...");
  // CORRECTION : On ajoute 'role' dans la liste des tables à vider
  await query(`
    TRUNCATE TABLE 
      affectation, attestation, evaluation, formation, inscription, 
      lecon, module, notification, proposition, question, 
      reponse_tentative, ressource, session, soumission, tentative, 
      utilisateur_etablissement_role, utilisateur, role, etablissement 
    RESTART IDENTITY CASCADE;
  `);
  
  // Réinsertion des rôles de base
  await query(`INSERT INTO role (nom_role) VALUES ('administrateur'), ('formateur'), ('apprenant') ON CONFLICT DO NOTHING;`);

  console.log("🏫 2. Création des établissements...");
  const etabs = [
    { nom: 'Innov-T Learning Hub', code: 'innov-t' },
    { nom: 'Langue Plus', code: 'langue-plus' }
  ];
  const idEtabs = [];
  for (const e of etabs) {
    const res = await query("INSERT INTO etablissement (nom, code_acces) VALUES ($1, $2) RETURNING id_etablissement", [e.nom, e.code]);
    idEtabs.push(res.rows[0].id_etablissement);
  }
  const [idInnov, idLangue] = idEtabs;

  console.log("👤 3. Création des utilisateurs...");
  const passwordHash = await bcrypt.hash("test123", 10);
  
  const users = [
    { email: 'admin@innov-t.mg', nom: 'Dupont', prenom: 'Jean', etab: idInnov, role: 'administrateur' },
    { email: 'admin@langueplus.mg', nom: 'Martin', prenom: 'Alice', etab: idLangue, role: 'administrateur' },
    { email: 'prof@innov-t.mg', nom: 'Rakoto', prenom: 'Paul', etab: idInnov, role: 'formateur' },
    { email: 'prof@langueplus.mg', nom: 'Smith', prenom: 'John', etab: idLangue, role: 'formateur' },
    { email: 'etu1@innov-t.mg', nom: 'Rabe', prenom: 'Lala', etab: idInnov, role: 'apprenant' },
    { email: 'etu2@innov-t.mg', nom: 'Rasoa', prenom: 'Miora', etab: idInnov, role: 'apprenant' },
    { email: 'etu3@innov-t.mg', nom: 'Randria', prenom: 'Koto', etab: idInnov, role: 'apprenant' },
    { email: 'etu1@langueplus.mg', nom: 'Diallo', prenom: 'Awa', etab: idLangue, role: 'apprenant' },
    { email: 'etu2@langueplus.mg', nom: 'Traoré', prenom: 'Bakary', etab: idLangue, role: 'apprenant' },
    { email: 'etu3@langueplus.mg', nom: 'Keita', prenom: 'Fatou', etab: idLangue, role: 'apprenant' },
  ];

  const userIds = {};

  for (const u of users) {
    const resU = await query(
      "INSERT INTO utilisateur (identifiant, mot_de_passe, nom, prenom, statut_compte) VALUES ($1, $2, $3, $4, 'actif') RETURNING id_utilisateur",
      [u.email, passwordHash, u.nom, u.prenom]
    );
    const uid = resU.rows[0].id_utilisateur;
    userIds[u.email] = uid;

    const resR = await query("SELECT id_role FROM role WHERE nom_role = $1", [u.role]);
    await query(
      "INSERT INTO utilisateur_etablissement_role (id_utilisateur, id_etablissement, id_role) VALUES ($1, $2, $3)",
      [uid, u.etab, resR.rows[0].id_role]
    );
  }

  console.log("📚 4. Création des formations...");
  const formationsData = [
    { etab: idInnov, titre: "Formation DevOps", desc: "De Linux à AWS", auteur: 'prof@innov-t.mg', complete: true },
    { etab: idInnov, titre: "Développement Web React", desc: "Frontend moderne", auteur: 'prof@innov-t.mg', complete: false },
    { etab: idInnov, titre: "Python pour Data Science", desc: "Analyse de données", auteur: 'prof@innov-t.mg', complete: false },
    { etab: idLangue, titre: "Anglais Professionnel", desc: "Business English", auteur: 'prof@langueplus.mg', complete: true },
    { etab: idLangue, titre: "Espagnol Débutant", desc: "Les bases", auteur: 'prof@langueplus.mg', complete: false },
    { etab: idLangue, titre: "Français des Affaires", desc: "Communication pro", auteur: 'prof@langueplus.mg', complete: false },
  ];

  const mainFormations = [];

  for (const f of formationsData) {
    const resF = await query(
      "INSERT INTO formation (id_etablissement, intitule, description, statut_formation) VALUES ($1, $2, $3, 'publiee') RETURNING id_formation",
      [f.etab, f.titre, f.desc]
    );
    const fid = resF.rows[0].id_formation;
    
    const resS = await query(
      "INSERT INTO session (id_formation, date_debut, date_fin, capacite_max) VALUES ($1, '2026-10-01', '2026-12-31', 20) RETURNING id_session",
      [fid]
    );
    const sid = resS.rows[0].id_session;

    await query("INSERT INTO affectation (id_session, id_utilisateur) VALUES ($1, $2)", [sid, userIds[f.auteur]]);

    if (f.complete) {
      mainFormations.push({ id: fid, idSession: sid, etab: f.etab });
      const apprenants = users.filter(u => u.etab === f.etab && u.role === 'apprenant');
      for (const a of apprenants) {
        await query(
          "INSERT INTO inscription (id_utilisateur, id_session, statut_inscription) VALUES ($1, $2, 'validee')",
          [userIds[a.email], sid]
        );
      }
    }
  }

  console.log("🧠 5. Création des 5 modules + leçons + QCM (10 questions)...");
  
  const modulesDevOps = ["Introduction à Linux", "Docker", "GitLab CI/CD", "Kubernetes", "AWS Cloud"];
  const modulesAnglais = ["Grammar Basics", "Business Vocabulary", "Speaking & Pronunciation", "Listening Comprehension", "Writing Emails"];

  const genererQCM = async (idModule, indexModule) => {
    const resEval = await query(
      "INSERT INTO evaluation (id_module, intitule, consigne, note_maximale, type_evaluation, duree_minutes, seuil_reussite, nb_tentatives_max) VALUES ($1, $2, 'Testez vos connaissances.', 20, 'qcm', 15, 50, 3) RETURNING id_evaluation",
      [idModule, `QCM Module ${indexModule}`]
    );
    const idEval = resEval.rows[0].id_evaluation;

    for (let i = 1; i <= 10; i++) {
      const resQ = await query(
        "INSERT INTO question (id_evaluation, enonce, type_question, ordre) VALUES ($1, $2, 'choix_unique', $3) RETURNING id_question",
        [idEval, `Question ${i} pour le module ${indexModule} : Quelle est la bonne réponse ?`, i]
      );
      const idQ = resQ.rows[0].id_question;

      await query(
        "INSERT INTO proposition (id_question, texte, est_correcte, ordre) VALUES ($1, 'La bonne réponse', true, 1), ($1, 'Mauvaise réponse A', false, 2), ($1, 'Mauvaise réponse B', false, 3), ($1, 'Mauvaise réponse C', false, 4)",
        [idQ]
      );
    }
  };

  for (const f of mainFormations) {
    const modulesList = (f.etab === idInnov) ? modulesDevOps : modulesAnglais;
    const auteurId = userIds[(f.etab === idInnov) ? 'prof@innov-t.mg' : 'prof@langueplus.mg'];

    for (let i = 0; i < modulesList.length; i++) {
      const resM = await query(
        "INSERT INTO module (id_formation, id_auteur, titre, description, ordre, statut_module) VALUES ($1, $2, $3, $4, $5, 'publie') RETURNING id_module",
        [f.id, auteurId, modulesList[i], `Description du module ${modulesList[i]}`, i + 1]
      );
      const mid = resM.rows[0].id_module;

      await query(
        "INSERT INTO lecon (id_module, titre, contenu) VALUES ($1, $2, $3)",
        [mid, `Leçon : ${modulesList[i]}`, `# Bienvenue dans ce module\n\nContenu complet en Markdown pour le module **${modulesList[i]}**.\n\n\`\`\`bash\necho "Hello World"\n\`\`\``]
      );

      await genererQCM(mid, i + 1);
    }
  }

  console.log("✅ SUCCÈS TOTAL ! La base de données est prête pour la démonstration.");
  console.log("==================================================");
  console.log("🔐 MOT DE PASSE POUR TOUS LES COMPTES : test123");
  console.log("--------------------------------------------------");
  console.log("🏫 INNOV-T LEARNING HUB :");
  console.log("👤 Admin     : admin@innov-t.mg");
  console.log("👨‍🏫 Formateur : prof@innov-t.mg");
  console.log("🎓 Apprenants : etu1@innov-t.mg, etu2@innov-t.mg, etu3@innov-t.mg");
  console.log("--------------------------------------------------");
  console.log("🏫 LANGUE PLUS :");
  console.log("👤 Admin     : admin@langueplus.mg");
  console.log("👨‍🏫 Formateur : prof@langueplus.mg");
  console.log("🎓 Apprenants : etu1@langueplus.mg, etu2@langueplus.mg, etu3@langueplus.mg");
  console.log("==================================================");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});