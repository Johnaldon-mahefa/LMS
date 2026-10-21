// Service : statistiques globales de la plateforme (filtrées par école).
import { query } from "../config/db.js";

export async function globales(idEtablissement) {
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
      WHERE id_etablissement = $1
    `, [idEtablissement]),
    
    // Formations
    query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE statut_formation = 'brouillon')::int AS brouillons,
        COUNT(*) FILTER (WHERE statut_formation = 'publiee')::int AS publiees,
        COUNT(*) FILTER (WHERE statut_formation = 'archivee')::int AS archivees
      FROM formation
      WHERE id_etablissement = $1
    `, [idEtablissement]),
    
    // Inscriptions (via les sessions de l'école)
    query(`
      SELECT
        COUNT(i.id_inscription)::int AS total,
        COUNT(i.id_inscription) FILTER (WHERE i.statut_inscription = 'en_attente')::int AS en_attente,
        COUNT(i.id_inscription) FILTER (WHERE i.statut_inscription = 'validee')::int AS validees,
        COUNT(i.id_inscription) FILTER (WHERE i.statut_inscription = 'refusee')::int AS refusees,
        COUNT(i.id_inscription) FILTER (WHERE i.statut_inscription = 'annulee')::int AS annulees
      FROM inscription i
      JOIN session s ON i.id_session = s.id_session
      JOIN formation f ON s.id_formation = f.id_formation
      WHERE f.id_etablissement = $1
    `, [idEtablissement]),
    
    // Modules (via les formations de l'école)
    query(`
      SELECT
        COUNT(m.id_module)::int AS total,
        COUNT(m.id_module) FILTER (WHERE m.statut_module = 'publie')::int AS publies,
        COUNT(m.id_module) FILTER (WHERE m.statut_module = 'brouillon')::int AS brouillons
      FROM module m
      JOIN formation f ON m.id_formation = f.id_formation
      WHERE f.id_etablissement = $1
    `, [idEtablissement]),
    
    // Soumissions (via la chaîne inscription -> session -> formation)
    query(`
      SELECT
        COUNT(s.id_soumission)::int AS total,
        COUNT(s.id_soumission) FILTER (WHERE s.statut_soumission = 'soumise')::int AS a_corriger,
        COUNT(s.id_soumission) FILTER (WHERE s.statut_soumission = 'corrigee')::int AS corrigees
      FROM soumission s
      JOIN inscription i ON s.id_inscription = i.id_inscription
      JOIN session sess ON i.id_session = sess.id_session
      JOIN formation f ON sess.id_formation = f.id_formation
      WHERE f.id_etablissement = $1
    `, [idEtablissement]),
    
    // Attestations
    query(`
      SELECT COUNT(a.id_attestation)::int AS total
      FROM attestation a
      JOIN inscription i ON a.id_inscription = i.id_inscription
      JOIN session sess ON i.id_session = sess.id_session
      JOIN formation f ON sess.id_formation = f.id_formation
      WHERE f.id_etablissement = $1
    `, [idEtablissement]),
  ]);

  // Nombre d'utilisateurs par rôle
  const parRole = (
    await query(`
      SELECT r.nom_role AS role, 
             (SELECT COUNT(*)::int FROM utilisateur_role ur 
              JOIN utilisateur u ON ur.id_utilisateur = u.id_utilisateur 
              WHERE ur.id_role = r.id_role AND u.id_etablissement = $1) AS nombre
      FROM role r
      ORDER BY r.nom_role
    `, [idEtablissement])
  ).rows;

  // NOUVEAU : Top 5 des formations les plus populaires
  const formationsPopulaires = (await query(`
    SELECT f.intitule, f.statut_formation, COUNT(i.id_inscription)::int AS nb_inscrits
    FROM formation f
    LEFT JOIN session s ON f.id_formation = s.id_formation
    LEFT JOIN inscription i ON s.id_session = i.id_session AND i.statut_inscription = 'validee'
    WHERE f.id_etablissement = $1
    GROUP BY f.id_formation
    ORDER BY nb_inscrits DESC
    LIMIT 5
  `, [idEtablissement])).rows;

  return {
    utilisateurs: utilisateurs.rows[0],
    formations: formations.rows[0],
    inscriptions: inscriptions.rows[0],
    modules: modules.rows[0],
    soumissions: soumissions.rows[0],
    attestations: attestations.rows[0],
    parRole,
    formationsPopulaires, // <-- On l'ajoute au retour
  };
}