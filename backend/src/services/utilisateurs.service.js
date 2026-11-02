import { withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import bcrypt from "bcryptjs";

// 1. Lister tous les utilisateurs d'une école
export async function lister(idEtablissement) {
  return await withTransaction(async (client) => {
    const res = await client.query(`
      SELECT u.id_utilisateur, u.identifiant, u.nom, u.prenom, u.statut_compte,
             COALESCE(json_agg(r.nom_role) FILTER (WHERE r.nom_role IS NOT NULL), '[]') as roles
      FROM utilisateur u
      JOIN utilisateur_etablissement_role uer ON u.id_utilisateur = uer.id_utilisateur
      JOIN role r ON uer.id_role = r.id_role
      WHERE uer.id_etablissement = $1
      GROUP BY u.id_utilisateur
      ORDER BY u.nom ASC, u.prenom ASC
    `, [idEtablissement]);
    return res.rows;
  });
}

// 2. Lister uniquement les formateurs d'une école (AVEC LEURS SESSIONS)
export async function listerFormateurs(idEtablissement) {
  return await withTransaction(async (client) => {
    const res = await client.query(`
      SELECT u.id_utilisateur, u.identifiant, u.nom, u.prenom, u.statut_compte,
             COALESCE(json_agg(DISTINCT r.nom_role) FILTER (WHERE r.nom_role IS NOT NULL), '[]') as roles,
             COALESCE(
               (SELECT json_agg(json_build_object(
                 'id_session', s.id_session,
                 'formation', f.intitule,
                 'date_debut', s.date_debut,
                 'date_fin', s.date_fin
               ))
               FROM affectation a
               JOIN session s ON a.id_session = s.id_session
               JOIN formation f ON s.id_formation = f.id_formation
               WHERE a.id_utilisateur = u.id_utilisateur),
               '[]'::json
             ) as sessions
      FROM utilisateur u
      JOIN utilisateur_etablissement_role uer ON u.id_utilisateur = uer.id_utilisateur
      JOIN role r ON uer.id_role = r.id_role
      WHERE uer.id_etablissement = $1 AND r.nom_role = 'formateur'
      GROUP BY u.id_utilisateur
      ORDER BY u.nom ASC, u.prenom ASC
    `, [idEtablissement]);
    return res.rows;
  });
}

// 3. Créer un utilisateur (avec vérification de la limite)
export async function creer({ nom, prenom, identifiant, motDePasse, roles }, idEtablissement) {
  return await withTransaction(async (client) => {
    const infoRes = await client.query(`
      SELECT p.max_utilisateurs, 
             (SELECT COUNT(*) FROM utilisateur_etablissement_role WHERE id_etablissement = $1) as nb_actuels
      FROM etablissement e
      LEFT JOIN plan p ON e.id_plan = p.id_plan
      WHERE e.id_etablissement = $1
    `, [idEtablissement]);

    const { max_utilisateurs, nb_actuels } = infoRes.rows[0];

    if (max_utilisateurs !== null && Number(nb_actuels) >= Number(max_utilisateurs)) {
      throw new AppError(403, `Limite atteinte ! Votre plan autorise ${max_utilisateurs} utilisateurs maximum. Veuillez passer à un plan supérieur.`);
    }

    const exist = await client.query("SELECT 1 FROM utilisateur WHERE identifiant = $1", [identifiant]);
    if (exist.rowCount > 0) throw new AppError(409, "Cet identifiant est déjà utilisé.");

    const hash = await bcrypt.hash(motDePasse, 10);
    const userRes = await client.query(
      "INSERT INTO utilisateur (identifiant, mot_de_passe, nom, prenom) VALUES ($1, $2, $3, $4) RETURNING id_utilisateur",
      [identifiant, hash, nom, prenom]
    );
    const idUtilisateur = userRes.rows[0].id_utilisateur;

    for (const role of roles) {
      const roleRes = await client.query("SELECT id_role FROM role WHERE nom_role = $1", [role]);
      if (roleRes.rowCount > 0) {
        await client.query(
          "INSERT INTO utilisateur_etablissement_role (id_utilisateur, id_etablissement, id_role) VALUES ($1, $2, $3)",
          [idUtilisateur, idEtablissement, roleRes.rows[0].id_role]
        );
      }
    }

    return { id_utilisateur: idUtilisateur };
  });
}

// 4. Désactiver un utilisateur
export async function desactiver(idUtilisateur, idEtablissement) {
  return await withTransaction(async (client) => {
    const res = await client.query(
      "UPDATE utilisateur SET statut_compte = 'desactive' WHERE id_utilisateur = $1 RETURNING id_utilisateur",
      [idUtilisateur]
    );
    if (res.rowCount === 0) throw new AppError(404, "Utilisateur introuvable.");
    return { success: true };
  });
}

// 5. Réactiver un utilisateur
export async function reactiver(idUtilisateur, idEtablissement) {
  return await withTransaction(async (client) => {
    const res = await client.query(
      "UPDATE utilisateur SET statut_compte = 'actif' WHERE id_utilisateur = $1 RETURNING id_utilisateur",
      [idUtilisateur]
    );
    if (res.rowCount === 0) throw new AppError(404, "Utilisateur introuvable.");
    return { success: true };
  });
}

// 6. Modifier un utilisateur (nom, prenom, roles)
export async function modifier(idUtilisateur, idEtablissement, { nom, prenom, roles }) {
  return await withTransaction(async (client) => {
    await client.query("UPDATE utilisateur SET nom = $1, prenom = $2 WHERE id_utilisateur = $3", [nom, prenom, idUtilisateur]);
    
    await client.query("DELETE FROM utilisateur_etablissement_role WHERE id_utilisateur = $1 AND id_etablissement = $2", [idUtilisateur, idEtablissement]);
    for (const role of roles) {
      const roleRes = await client.query("SELECT id_role FROM role WHERE nom_role = $1", [role]);
      if (roleRes.rowCount > 0) {
        await client.query(
          "INSERT INTO utilisateur_etablissement_role (id_utilisateur, id_etablissement, id_role) VALUES ($1, $2, $3)",
          [idUtilisateur, idEtablissement, roleRes.rows[0].id_role]
        );
      }
    }
    return { success: true };
  });
}

// 7. Réinitialiser le mot de passe (par un admin)
export async function reinitialiserMotDePasse(idUtilisateur, idEtablissement, nouveauMotDePasse) {
  return await withTransaction(async (client) => {
    const hash = await bcrypt.hash(nouveauMotDePasse, 10);
    const res = await client.query(
      "UPDATE utilisateur SET mot_de_passe = $1 WHERE id_utilisateur = $2 RETURNING id_utilisateur",
      [hash, idUtilisateur]
    );
    if (res.rowCount === 0) throw new AppError(404, "Utilisateur introuvable.");
    return { success: true };
  });
}

// 8. Changer son propre mot de passe (par l'utilisateur connecté)
export async function changerMonMotDePasse(idUtilisateur, nouveauMotDePasse) {
  return await withTransaction(async (client) => {
    const hash = await bcrypt.hash(nouveauMotDePasse, 10);
    const res = await client.query(
      "UPDATE utilisateur SET mot_de_passe = $1 WHERE id_utilisateur = $2 RETURNING id_utilisateur",
      [hash, idUtilisateur]
    );
    if (res.rowCount === 0) throw new AppError(404, "Utilisateur introuvable.");
    return { success: true };
  });
}