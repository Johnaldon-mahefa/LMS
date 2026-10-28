import { AppError } from "../utils/AppError.js";
import { withTransaction } from "../config/db.js";
import { initierPaiementMvola } from "./paiement.service.js";

export async function getMonAbonnement(idEtablissement) {
  return await withTransaction(async (client) => {
    const res = await client.query(`
      SELECT e.id_etablissement, e.nom, e.id_plan, e.statut_abonnement, e.date_expiration_abonnement,
             p.nom AS nom_plan, p.prix_mensuel, p.description
      FROM etablissement e
      LEFT JOIN plan p ON p.id_plan = e.id_plan
      WHERE e.id_etablissement = $1
    `, [idEtablissement]);
    if (res.rowCount === 0) throw new AppError(404, "Établissement introuvable.");
    return res.rows[0];
  });
}

export async function getPlansDisponibles() {
  return await withTransaction(async (client) => {
    const res = await client.query(`
      SELECT p.id_plan, p.nom, p.prix_mensuel, p.description,
             COALESCE(
               json_agg(f.code_unique) FILTER (WHERE f.code_unique IS NOT NULL),
               '[]'
             ) AS fonctionnalites
      FROM plan p
      LEFT JOIN plan_fonctionnalite pf ON pf.id_plan = p.id_plan
      LEFT JOIN fonctionnalite f ON f.id_fonctionnalite = pf.id_fonctionnalite
      WHERE p.est_actif = true
      GROUP BY p.id_plan
      ORDER BY p.prix_mensuel ASC
    `);
    return res.rows;
  });
}

export async function payerAbonnement(idEtablissement, idPlan) {
  if (!idPlan) throw new AppError(400, "Veuillez sélectionner un plan.");

  return await withTransaction(async (client) => {
    const planRes = await client.query("SELECT * FROM plan WHERE id_plan = $1", [idPlan]);
    if (planRes.rowCount === 0) throw new AppError(404, "Plan introuvable.");
    const plan = planRes.rows[0];

    // Plan gratuit (Découverte) : accès direct sans paiement
    if (Number(plan.prix_mensuel) === 0) {
      const dateExpiration = new Date();
      dateExpiration.setDate(dateExpiration.getDate() + 30);
      const dateStr = dateExpiration.toISOString().split("T")[0];

      await client.query(`
        UPDATE etablissement 
        SET id_plan = $1, statut_abonnement = 'actif', date_expiration_abonnement = $2
        WHERE id_etablissement = $3
      `, [idPlan, dateStr, idEtablissement]);

      return { message: "Plan gratuit activé.", id_plan: idPlan, nom_plan: plan.nom, date_expiration: dateStr };
    }

    // Plan payant : appel à MVola
    let resultat;
    try {
      resultat = await initierPaiementMvola(idEtablissement, Number(plan.prix_mensuel), plan.nom);

      console.log("✅✅✅ PAIEMENT MVOLA INITIÉ AVEC SUCCÈS ✅✅✅");
      console.log(`Statut : ${resultat.status}`);
      console.log(`Référence : ${resultat.transactionRef}`);
      console.log(`ID de corrélation : ${resultat.serverCorrelationId}`);

    } catch (err) {
      console.error("Erreur MVola:", err.message);
      throw new AppError(500, err.message || "Le service MVola est indisponible.");
    }

    // Mise à jour de la base de données suite à l'initiation réussie
    const dateExpiration = new Date();
    dateExpiration.setDate(dateExpiration.getDate() + 30);
    const dateStr = dateExpiration.toISOString().split("T")[0];

    await client.query(`
      UPDATE etablissement 
      SET id_plan = $1, statut_abonnement = 'actif', date_expiration_abonnement = $2
      WHERE id_etablissement = $3
    `, [idPlan, dateStr, idEtablissement]);

    return {
      message: `Paiement MVola initié. Statut : en attente.`,
      id_plan: idPlan,
      nom_plan: plan.nom,
      date_expiration: dateStr,
      transactionRef: resultat.transactionRef,
      serverCorrelationId: resultat.serverCorrelationId,
    };
  });
}