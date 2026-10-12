// Test de bout en bout : rejoue les scénarios des 11 cas d'utilisation et vérifie les règles de gestion RG1 à RG15.
// Prérequis : API démarrée (npm run dev), base créée (db:schema, db:seed). Usage : npm run test:e2e
const BASE = process.env.API_URL || "http://localhost:3000/api";
const ADMIN = { identifiant: process.env.ADMIN_IDENTIFIANT || "admin", motDePasse: process.env.ADMIN_MOT_DE_PASSE || "Admin@12345" };
const SUFFIXE = Date.now().toString().slice(-6);
let echecs = 0, total = 0;

const check = (nom, condition, detail = "") => { total++; if (!condition) { echecs++; console.log(`  ECHEC  ${nom} ${detail}`); } else console.log(`  ok     ${nom}`); };
async function appel(methode, chemin, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const r = await fetch(BASE + chemin, { method: methode, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  const type = r.headers.get("content-type") || "";
  const donnees = type.includes("json") ? await r.json() : Buffer.from(await r.arrayBuffer());
  return { status: r.status, donnees };
}
const fichier = (champs, nom = "devoir.txt", contenu = "contenu du travail") => {
  const f = new FormData();
  for (const [k, v] of Object.entries(champs)) f.append(k, v);
  f.append("fichier", new Blob([contenu]), nom);
  return f;
};
const connexion = async (identifiant, motDePasse) => (await appel("POST", "/auth/login", { body: { identifiant, motDePasse } })).donnees.token;
const titre = (t) => console.log(`\n${t}`);

(async () => {
  titre("UC01 S'authentifier");
  const admin = await connexion(ADMIN.identifiant, ADMIN.motDePasse);
  check("connexion administrateur", !!admin);
  check("A1 mauvais mot de passe refusé (401)", (await appel("POST", "/auth/login", { body: { identifiant: ADMIN.identifiant, motDePasse: "faux" } })).status === 401);

  titre("UC02 Gérer les utilisateurs (RG1, RG2)");
  const MDP = "Motdepasse1";
  const creer = async (id, roles) => (await appel("POST", "/utilisateurs", { token: admin, body: { nom: id, prenom: "Test", identifiant: `${id}${SUFFIXE}`, roles, motDePasse: MDP } })).donnees;
  const F = await creer("formateurA", ["formateur"]), F2 = await creer("formateurB", ["formateur"]);
  const A1 = await creer("appr1", ["apprenant"]), A2 = await creer("appr2", ["apprenant"]), A3 = await creer("appr3", ["apprenant"]);
  check("5 comptes créés", [F, F2, A1, A2, A3].every((u) => u.id_utilisateur));
  check("RG1 : création sans rôle refusée", (await appel("POST", "/utilisateurs", { token: admin, body: { nom: "x", prenom: "y", identifiant: `zz${SUFFIXE}`, roles: [], motDePasse: MDP } })).status === 400);
  const tF = await connexion(F.identifiant, MDP), tF2 = await connexion(F2.identifiant, MDP);
  const t1 = await connexion(A1.identifiant, MDP), t2 = await connexion(A2.identifiant, MDP), t3 = await connexion(A3.identifiant, MDP);
  check("RG15 : un apprenant ne peut pas gérer les formations (403)", (await appel("GET", "/admin/formations", { token: t1 })).status === 403);
  check("RG15 : un formateur ne peut pas gérer les inscriptions (403)", (await appel("GET", "/admin/inscriptions", { token: tF })).status === 403);

  titre("UC03 Organiser les formations (RG3, RG4, RG5)");
  const formation = (await appel("POST", "/admin/formations", { token: admin, body: { intitule: `Développement web ${SUFFIXE}`, description: "Initiation", duree: 120, publicVise: "Débutants" } })).donnees;
  check("formation créée au statut brouillon", formation.statut_formation === "brouillon");
  check("intitulé déjà utilisé refusé (409)", (await appel("POST", "/admin/formations", { token: admin, body: { intitule: formation.intitule } })).status === 409);
  check("RG3 : publication sans module publié refusée (409)", (await appel("PATCH", `/admin/formations/${formation.id_formation}/publier`, { token: admin })).status === 409);
  check("dates incohérentes refusées (400)", (await appel("POST", `/admin/formations/${formation.id_formation}/sessions`, { token: admin, body: { dateDebut: "2026-12-10", dateFin: "2026-12-01", capaciteMax: 2 } })).status === 400);
  const session = (await appel("POST", `/admin/formations/${formation.id_formation}/sessions`, { token: admin, body: { dateDebut: "2026-12-01", dateFin: "2027-02-01", capaciteMax: 2 } })).donnees;
  check("session créée avec 2 places", session.places_restantes === 2);
  check("affecter un non-formateur refusé (400)", (await appel("POST", `/admin/sessions/${session.id_session}/formateurs`, { token: admin, body: { idFormateur: A1.id_utilisateur } })).status === 400);
  const affecte = await appel("POST", `/admin/sessions/${session.id_session}/formateurs`, { token: admin, body: { idFormateur: F.id_utilisateur } });
  check("formateur affecté à la session", affecte.status === 200 && affecte.donnees.formateurs.length === 1);

  titre("UC05 Gérer le contenu pédagogique (RG8, RG9)");
  check("RG9 : formateur non affecté ne peut pas créer de module (403)", (await appel("POST", `/formateur/formations/${formation.id_formation}/modules`, { token: tF2, body: { titre: "Intrus" } })).status === 403);
  const module = (await appel("POST", `/formateur/formations/${formation.id_formation}/modules`, { token: tF, body: { titre: "HTML et CSS", description: "Bases", ordre: 1 } })).donnees;
  check("module créé au statut brouillon", module.statut_module === "brouillon");
  check("RG8 : publication sans leçon ni évaluation refusée (409)", (await appel("PATCH", `/formateur/modules/${module.id_module}/publier`, { token: tF })).status === 409);
  check("leçon ajoutée", (await appel("POST", `/formateur/modules/${module.id_module}/lecons`, { token: tF, body: { titre: "Les balises", contenu: "..." } })).status === 201);
  const ressource = await appel("POST", `/formateur/modules/${module.id_module}/ressources`, { token: tF, form: fichier({}, "support.pdf", "%PDF support") });
  check("ressource déposée", ressource.status === 201 && ressource.donnees.nom_fichier === "support.pdf");
  check("type de fichier non accepté refusé (400)", (await appel("POST", `/formateur/modules/${module.id_module}/ressources`, { token: tF, form: fichier({}, "virus.exe") })).status === 400);
  check("RG8 : publication sans évaluation refusée (409)", (await appel("PATCH", `/formateur/modules/${module.id_module}/publier`, { token: tF })).status === 409);
  const evaluation = (await appel("POST", `/formateur/modules/${module.id_module}/evaluations`, { token: tF, body: { intitule: "Projet HTML", consigne: "Réaliser une page", noteMaximale: 20 } })).donnees;
  check("évaluation créée", !!evaluation.id_evaluation);
  const module2 = (await appel("POST", `/formateur/formations/${formation.id_formation}/modules`, { token: tF, body: { titre: "JavaScript", ordre: 2 } })).donnees;
  const evaluation2 = (await appel("POST", `/formateur/modules/${module2.id_module}/evaluations`, { token: tF, body: { intitule: "Quiz", noteMaximale: 10 } })).donnees;
  check("RG9 : un autre formateur ne modifie pas le module (403)", (await appel("PUT", `/formateur/modules/${module.id_module}`, { token: tF2, body: { titre: "Piraté" } })).status === 403);
  check("module publié", (await appel("PATCH", `/formateur/modules/${module.id_module}/publier`, { token: tF })).donnees.statut_module === "publie");

  titre("UC03 (suite) Publication et suppression");
  check("formation publiée (RG3)", (await appel("PATCH", `/admin/formations/${formation.id_formation}/publier`, { token: admin })).donnees.statut_formation === "publiee");
  check("RG4 : suppression d'une formation avec session refusée (409)", (await appel("DELETE", `/admin/formations/${formation.id_formation}`, { token: admin })).status === 409);
  const jetable = (await appel("POST", "/admin/formations", { token: admin, body: { intitule: `Jetable ${SUFFIXE}` } })).donnees;
  check("formation sans session supprimée (204)", (await appel("DELETE", `/admin/formations/${jetable.id_formation}`, { token: admin })).status === 204);

  titre("UC08 Demander son inscription (RG3, RG7)");
  const catalogue = (await appel("GET", "/apprenant/catalogue", { token: t1 })).donnees;
  check("la formation publiée est au catalogue", catalogue.some((f) => f.id_formation === formation.id_formation));
  const brouillon = (await appel("POST", "/admin/formations", { token: admin, body: { intitule: `Brouillon ${SUFFIXE}` } })).donnees;
  const sBrouillon = (await appel("POST", `/admin/formations/${brouillon.id_formation}/sessions`, { token: admin, body: { dateDebut: "2026-12-01", dateFin: "2027-01-01", capaciteMax: 5 } })).donnees;
  check("RG3 : inscription à une formation non publiée refusée (409)", (await appel("POST", "/apprenant/inscriptions", { token: t1, body: { idSession: sBrouillon.id_session } })).status === 409);
  const i1 = (await appel("POST", "/apprenant/inscriptions", { token: t1, body: { idSession: session.id_session } })).donnees;
  const i2 = (await appel("POST", "/apprenant/inscriptions", { token: t2, body: { idSession: session.id_session } })).donnees;
  const i3 = (await appel("POST", "/apprenant/inscriptions", { token: t3, body: { idSession: session.id_session } })).donnees;
  check("demande créée au statut en_attente", i1.statut_inscription === "en_attente");
  check("RG7 : doublon d'inscription refusé (409)", (await appel("POST", "/apprenant/inscriptions", { token: t1, body: { idSession: session.id_session } })).status === 409);

  titre("UC04 Gérer les inscriptions (RG5, RG6)");
  check("inscription validée", (await appel("PATCH", `/admin/inscriptions/${i1.id_inscription}/valider`, { token: admin })).donnees.statut_inscription === "validee");
  check("deuxième inscription validée", (await appel("PATCH", `/admin/inscriptions/${i2.id_inscription}/valider`, { token: admin })).status === 200);
  check("RG6 : validation refusée, session complète (409)", (await appel("PATCH", `/admin/inscriptions/${i3.id_inscription}/valider`, { token: admin })).status === 409);
  check("demande refusée", (await appel("PATCH", `/admin/inscriptions/${i3.id_inscription}/refuser`, { token: admin })).donnees.statut_inscription === "refusee");
  check("inscription directe d'un apprenant déjà inscrit refusée (409)", (await appel("POST", "/admin/inscriptions/directe", { token: admin, body: { idApprenant: A1.id_utilisateur, idSession: session.id_session } })).status === 409);
  check("RG5 : suppression d'une session avec inscriptions refusée (409)", (await appel("DELETE", `/admin/sessions/${session.id_session}`, { token: admin })).status === 409);

  titre("UC09 Consulter le contenu (RG8)");
  const contenu = (await appel("GET", `/apprenant/inscriptions/${i1.id_inscription}/contenu`, { token: t1 })).donnees;
  check("seul le module publié est visible", contenu.modules.length === 1 && contenu.modules[0].titre === "HTML et CSS");
  check("RG8 : inscription refusée = pas d'accès au contenu (403)", (await appel("GET", `/apprenant/inscriptions/${i3.id_inscription}/contenu`, { token: t3 })).status === 403);
  const dl = await appel("GET", `/fichiers/ressources/${ressource.donnees.id_ressource}`, { token: t1 });
  check("téléchargement de la ressource par l'apprenant inscrit", dl.status === 200 && dl.donnees.toString().startsWith("%PDF"));
  check("téléchargement refusé à un apprenant non inscrit (403)", (await appel("GET", `/fichiers/ressources/${ressource.donnees.id_ressource}`, { token: t3 })).status === 403);

  titre("UC10 Soumettre une évaluation (RG10)");
  const depot = await appel("POST", `/apprenant/evaluations/${evaluation.id_evaluation}/soumissions`, { token: t1, form: fichier({ idInscription: i1.id_inscription }) });
  check("travail déposé au statut soumise", depot.status === 201 && depot.donnees.statut_soumission === "soumise");
  check("RG10 : deuxième dépôt refusé (409)", (await appel("POST", `/apprenant/evaluations/${evaluation.id_evaluation}/soumissions`, { token: t1, form: fichier({ idInscription: i1.id_inscription }) })).status === 409);
  check("RG10 : module non publié, dépôt refusé (409)", (await appel("POST", `/apprenant/evaluations/${evaluation2.id_evaluation}/soumissions`, { token: t1, form: fichier({ idInscription: i1.id_inscription }) })).status === 409);
  check("RG10 : inscription non validée, dépôt refusé", [403, 404].includes((await appel("POST", `/apprenant/evaluations/${evaluation.id_evaluation}/soumissions`, { token: t3, form: fichier({ idInscription: i3.id_inscription }) })).status));

  titre("UC06 Corriger les soumissions (RG11)");
  const liste = (await appel("GET", "/formateur/soumissions/a-corriger", { token: tF })).donnees;
  check("la soumission apparaît chez le formateur affecté", liste.some((s) => s.id_soumission === depot.donnees.id_soumission));
  check("RG11 : formateur non affecté ne voit rien", (await appel("GET", "/formateur/soumissions/a-corriger", { token: tF2 })).donnees.length === 0);
  check("RG11 : formateur non affecté ne peut pas corriger (403)", (await appel("PUT", `/formateur/soumissions/${depot.donnees.id_soumission}/correction`, { token: tF2, body: { note: 10 } })).status === 403);
  check("RG11 : note supérieure au maximum refusée (400)", (await appel("PUT", `/formateur/soumissions/${depot.donnees.id_soumission}/correction`, { token: tF, body: { note: 25 } })).status === 400);
  const corr = await appel("PUT", `/formateur/soumissions/${depot.donnees.id_soumission}/correction`, { token: tF, body: { note: 15, commentaire: "Bon travail" } });
  check("correction enregistrée (statut corrigee)", corr.status === 200 && corr.donnees.statut_soumission === "corrigee");
  check("RG11 : note non modifiable après correction (409)", (await appel("PUT", `/formateur/soumissions/${depot.donnees.id_soumission}/correction`, { token: tF, body: { note: 20 } })).status === 409);

  titre("UC07 Suivre la progression (RG12, RG13)");
  const suivi = (await appel("GET", `/formateur/sessions/${session.id_session}/progression`, { token: tF })).donnees;
  const p1 = suivi.apprenants.find((a) => a.id_inscription === i1.id_inscription), p2 = suivi.apprenants.find((a) => a.id_inscription === i2.id_inscription);
  check("RG12/RG13 : apprenant 1, moyenne 75 % >= seuil, progression 100 %", p1.progression === 100);
  check("RG13 : apprenant 2 sans travail, progression 0 %", p2.progression === 0);
  check("RG11 : formateur non affecté refusé (403)", (await appel("GET", `/formateur/sessions/${session.id_session}/progression`, { token: tF2 })).status === 403);

  titre("UC11 Résultats et attestation (RG14)");
  const res = (await appel("GET", `/apprenant/inscriptions/${i1.id_inscription}/resultats`, { token: t1 })).donnees;
  check("résultats : module validé, apprenant éligible", res.modules[0].valide === true && res.eligible === true);
  const att = await appel("POST", `/apprenant/inscriptions/${i1.id_inscription}/attestation`, { token: t1 });
  check("attestation délivrée avec un numéro", att.status === 201 && /^ATT-\d{4}-\d{6}$/.test(att.donnees.numero_attestation), JSON.stringify(att.donnees));
  const att2 = await appel("POST", `/apprenant/inscriptions/${i1.id_inscription}/attestation`, { token: t1 });
  check("RG14 : une seule attestation par inscription", att2.donnees.id_attestation === att.donnees.id_attestation);
  const pdf = await appel("GET", `/apprenant/inscriptions/${i1.id_inscription}/attestation/pdf`, { token: t1 });
  check("document PDF généré", pdf.status === 200 && pdf.donnees.slice(0, 4).toString() === "%PDF");
  check("RG14 : apprenant non éligible, attestation refusée (409)", (await appel("POST", `/apprenant/inscriptions/${i2.id_inscription}/attestation`, { token: t2 })).status === 409);

  titre("UC02 (suite) Désactivation (RG2)");
  check("RG2 : l'administrateur ne peut pas désactiver son propre compte (403)", (await appel("PATCH", `/utilisateurs/${(await appel("GET", "/auth/moi", { token: admin })).donnees.id_utilisateur}/desactiver`, { token: admin })).status === 403);
  check("compte désactivé", (await appel("PATCH", `/utilisateurs/${A3.id_utilisateur}/desactiver`, { token: admin })).donnees.statut_compte === "desactive");
  check("connexion d'un compte désactivé refusée (403)", (await appel("POST", "/auth/login", { body: { identifiant: A3.identifiant, motDePasse: MDP } })).status === 403);

  console.log(`\n${total - echecs}/${total} vérifications réussies.`);
  process.exit(echecs ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
