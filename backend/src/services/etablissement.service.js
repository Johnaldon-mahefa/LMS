import { AppError } from "../utils/AppError.js";
import { withTransaction } from "../config/db.js";
import { initierPaiementMvola } from "./paiement.service.js";

export async function getMonAbonnement(idEtablissement) {
  return await withTransaction(async (client) => {
    const res = await client.query(`
      SELECT e.id_etablissement, e.nom, e.id_plan, e.statut_abonnement, e.date_expiration_abonnement,
             p.nom AS nom_plan, p.prix_mensuel, p.description, p.max_utilisateurs,
             (SELECT COUNT(*) FROM utilisateur_etablissement_role WHERE id_etablissement = $1) as nb_utilisateurs_actuels
      FROM etablissement e
      LEFT JOIN plan p ON p.id_plan = e.id_plan
      WHERE e.id_etablissement = $1
    `, [idEtablissement]);
    
    if (res.rowCount === 0) throw new AppError(404, "Établissement introuvable.");
    
    const etab = res.rows[0];
    
    const featuresRes = await client.query(`
      SELECT f.code_unique FROM plan_fonctionnalite pf
      JOIN fonctionnalite f ON pf.id_fonctionnalite = f.id_fonctionnalite
      WHERE pf.id_plan = $1
    `, [etab.id_plan]);
    
    etab.fonctionnalites_actuelles = featuresRes.rows.map(r => r.code_unique);
    return etab;
  });
}

export async function getPlansDisponibles() {
  return await withTransaction(async (client) => {
    const res = await client.query(`
      SELECT p.id_plan, p.nom, p.prix_mensuel, p.description, p.max_utilisateurs,
             COALESCE(json_agg(f.code_unique) FILTER (WHERE f.code_unique IS NOT NULL), '[]') AS fonctionnalites
      FROM plan p
      LEFT JOIN plan_fonctionnalite pf ON pf.id_plan = p.id_plan
      LEFT JOIN fonctionnalite f ON pf.id_fonctionnalite = f.id_fonctionnalite
      WHERE p.est_actif = true AND p.nom NOT LIKE 'Sur mesure%'
      GROUP BY p.id_plan ORDER BY p.prix_mensuel ASC
    `);
    return res.rows;
  });
}

export async function getToutesLesFonctionnalites() {
  return await withTransaction(async (client) => {
    const res = await client.query(`SELECT id_fonctionnalite, code_unique, nom, description, prix_unitaire FROM fonctionnalite ORDER BY prix_unitaire ASC`);
    return res.rows;
  });
}

export async function payerAbonnement(idEtablissement, idPlan) {
  if (!idPlan) throw new AppError(400, "Veuillez sélectionner un plan.");
  return await withTransaction(async (client) => {
    const planRes = await client.query("SELECT * FROM plan WHERE id_plan = $1", [idPlan]);
    if (planRes.rowCount === 0) throw new AppError(404, "Plan introuvable.");
    const plan = planRes.rows[0];

    if (Number(plan.prix_mensuel) === 0) {
      const dateExpiration = new Date();
      dateExpiration.setDate(dateExpiration.getDate() + 30);
      const dateStr = dateExpiration.toISOString().split("T")[0];
      await client.query(`UPDATE etablissement SET id_plan = $1, statut_abonnement = 'actif', date_expiration_abonnement = $2 WHERE id_etablissement = $3`, [idPlan, dateStr, idEtablissement]);
      return { message: "Plan gratuit activé.", id_plan: idPlan, nom_plan: plan.nom, date_expiration: dateStr };
    }

    let resultat;
    try {
      resultat = await initierPaiementMvola(idEtablissement, 500, `Plan ${plan.nom}`);
    } catch (err) {
      throw new AppError(500, "Le service MVola est indisponible.");
    }

    const dateExpiration = new Date();
    dateExpiration.setDate(dateExpiration.getDate() + 30);
    const dateStr = dateExpiration.toISOString().split("T")[0];

    await client.query(`UPDATE etablissement SET id_plan = $1, statut_abonnement = 'actif', date_expiration_abonnement = $2 WHERE id_etablissement = $3`, [idPlan, dateStr, idEtablissement]);

    return { message: `Paiement initié !`, id_plan: idPlan, nom_plan: plan.nom, date_expiration: dateStr, transactionRef: resultat.transactionRef, serverCorrelationId: resultat.serverCorrelationId };
  });
}

export async function payerFonctionnalitesSurMesure(idEtablissement, fonctionnalitesIds, maxUtilisateurs) {
  if (!fonctionnalitesIds || fonctionnalitesIds.length === 0) {
    throw new AppError(400, "Veuillez sélectionner au moins une fonctionnalité.");
  }

  return await withTransaction(async (client) => {
    const featuresRes = await client.query("SELECT id_fonctionnalite, nom, prix_unitaire FROM fonctionnalite WHERE id_fonctionnalite = ANY($1)", [fonctionnalitesIds]);
    if (featuresRes.rowCount === 0) throw new AppError(404, "Fonctionnalités introuvables.");
    
    let prixTotal = 0;
    featuresRes.rows.forEach(f => prixTotal += Number(f.prix_unitaire));

    // Crée le plan sur-mesure avec la limite d'utilisateurs choisie
    const nomPlanCustom = `Sur mesure - ${Date.now()}`;
    const planRes = await client.query(
      "INSERT INTO plan (nom, prix_mensuel, description, est_actif, max_utilisateurs) VALUES ($1, $2, $3, true, $4) RETURNING id_plan",
      [nomPlanCustom, prixTotal, "Plan composé sur mesure", maxUtilisateurs || 10]
    );
    const idPlanCustom = planRes.rows[0].id_plan;

    for (const f of featuresRes.rows) {
      await client.query("INSERT INTO plan_fonctionnalite (id_plan, id_fonctionnalite) VALUES ($1, $2)", [idPlanCustom, f.id_fonctionnalite]);
    }

    let resultat;
    try {
      resultat = await initierPaiementMvola(idEtablissement, 500, "Plan sur mesure");
    } catch (err) {
      throw new AppError(500, "Le service MVola est indisponible.");
    }

    const dateExpiration = new Date();
    dateExpiration.setDate(dateExpiration.getDate() + 30);
    const dateStr = dateExpiration.toISOString().split("T")[0];

    await client.query(`UPDATE etablissement SET id_plan = $1, statut_abonnement = 'actif', date_expiration_abonnement = $2 WHERE id_etablissement = $3`, [idPlanCustom, dateStr, idEtablissement]);

    return { message: `Paiement initié !`, id_plan: idPlanCustom, nom_plan: nomPlanCustom, prix_total: prixTotal, date_expiration: dateStr, transactionRef: resultat.transactionRef, serverCorrelationId: resultat.serverCorrelationId };
  });
}