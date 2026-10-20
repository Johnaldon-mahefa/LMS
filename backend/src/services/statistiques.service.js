// Service : statistiques globales de la plateforme (réservé à l'administrateur).
import { query } from "../config/db.js";

export async function globales() {
  const [
    utilisateurs,
    formations,
    inscriptions,
    modules,
    soumissions,
    attestations,
  ] = await Promise.all([
    // Utilisateurs par rôle et par statut
    query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE statut_compte = 'actif')::int AS actifs,
        COUNT(*) FILTER (WHERE statut_compte = 'desactive')::int AS desactives
      FROM utilisateur
    `),
    query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE statut_formation = 'brouillon')::int AS brouillons,
        COUNT(*) FILTER (WHERE statut_formation = 'publiee')::int AS publiees,
        COUNT(*) FILTER (WHERE statut_formation = 'archivee')::int AS archivees
      FROM formation
    `),
    query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE statut_inscription = 'en_attente')::int AS en_attente,
        COUNT(*) FILTER (WHERE statut_inscription = 'validee')::int AS validees,
        COUNT(*) FILTER (WHERE statut_inscription = 'refusee')::int AS refusees,
        COUNT(*) FILTER (WHERE statut_inscription = 'annulee')::int AS annulees
      FROM inscription
    `),
    query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE statut_module = 'publie')::int AS publies,
        COUNT(*) FILTER (WHERE statut_module = 'brouillon')::int AS brouillons
      FROM module
    `),
    query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE statut_soumission = 'soumise')::int AS a_corriger,
        COUNT(*) FILTER (WHERE statut_soumission = 'corrigee')::int AS corrigees
      FROM soumission
    `),
    query(`SELECT COUNT(*)::int AS total FROM attestation`),
  ]);

  // Nombre d'utilisateurs par rôle
  const parRole = (
    await query(`
      SELECT r.nom_role AS role, COUNT(ur.id_utilisateur)::int AS nombre
      FROM role r
      LEFT JOIN utilisateur_role ur ON ur.id_role = r.id_role
      GROUP BY r.nom_role
      ORDER BY r.nom_role
    `)
  ).rows;

  return {
    utilisateurs: utilisateurs.rows[0],
    formations: formations.rows[0],
    inscriptions: inscriptions.rows[0],
    modules: modules.rows[0],
    soumissions: soumissions.rows[0],
    attestations: attestations.rows[0],
    parRole,
  };
}
