import { withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import bcrypt from "bcryptjs";

export async function getEcolesPubliques() {
  return await withTransaction(async (client) => {
    const res = await client.query(`
      SELECT e.id_etablissement, e.nom, e.code_acces, COUNT(f.id_formation) as nb_formations
      FROM etablissement e
      LEFT JOIN formation f ON f.id_etablissement = e.id_etablissement AND f.statut_formation = 'publiee'
      GROUP BY e.id_etablissement
      ORDER BY e.nom ASC
    `);
    return res.rows;
  });
}

export async function getFormationsPubliques(idEtablissement) {
  return await withTransaction(async (client) => {
    const res = await client.query(`
      SELECT f.id_formation, f.intitule, f.description, f.duree, 
             (SELECT COUNT(*) FROM module WHERE id_formation = f.id_formation AND statut_module = 'publie') as nb_modules,
             COALESCE(
               (SELECT json_agg(m.titre ORDER BY m.ordre ASC) FROM module m WHERE m.id_formation = f.id_formation AND m.statut_module = 'publie'),
               '[]'::json
             ) as modules
      FROM formation f
      WHERE f.id_etablissement = $1 AND f.statut_formation = 'publiee'
      ORDER BY f.intitule ASC
    `, [idEtablissement]);
    return res.rows;
  });
}

export async function inscrireApprenantPublic({ nom, prenom, email, motDePasse, codeAccesEcole }) {
  if (!nom || !prenom || !email || !motDePasse || !codeAccesEcole) {
    throw new AppError(400, "Tous les champs sont obligatoires.");
  }

  return await withTransaction(async (client) => {
    const etabRes = await client.query("SELECT id_etablissement, nom FROM etablissement WHERE code_acces = $1", [codeAccesEcole]);
    if (etabRes.rowCount === 0) throw new AppError(404, "Code d'école invalide.");
    const idEtablissement = etabRes.rows[0].id_etablissement;
    const nomEcole = etabRes.rows[0].nom;

    const userRes = await client.query("SELECT id_utilisateur, mot_de_passe FROM utilisateur WHERE identifiant = $1", [email]);
    
    let idUtilisateur;
    let isNewUser = false;

    if (userRes.rowCount > 0) {
      const user = userRes.rows[0];
      idUtilisateur = user.id_utilisateur;

      const motDePasseValide = await bcrypt.compare(motDePasse, user.mot_de_passe);
      if (!motDePasseValide) {
        throw new AppError(401, "Un compte existe déjà avec cet email, mais le mot de passe est incorrect.");
      }

      const lienRes = await client.query(
        "SELECT 1 FROM utilisateur_etablissement_role WHERE id_utilisateur = $1 AND id_etablissement = $2",
        [idUtilisateur, idEtablissement]
      );
      
      if (lienRes.rowCount > 0) {
        throw new AppError(409, `Vous êtes déjà inscrit à l'école ${nomEcole}.`);
      }

    } else {
      isNewUser = true;
      const hash = await bcrypt.hash(motDePasse, 10);
      const newUser = await client.query(
        "INSERT INTO utilisateur (identifiant, mot_de_passe, nom, prenom) VALUES ($1, $2, $3, $4) RETURNING id_utilisateur",
        [email, hash, nom, prenom]
      );
      idUtilisateur = newUser.rows[0].id_utilisateur;
    }

    const roleRes = await client.query("SELECT id_role FROM role WHERE nom_role = 'apprenant'");
    const idRole = roleRes.rows[0].id_role;

    await client.query(
      "INSERT INTO utilisateur_etablissement_role (id_utilisateur, id_etablissement, id_role) VALUES ($1, $2, $3)",
      [idUtilisateur, idEtablissement, idRole]
    );

    return { 
      message: isNewUser 
        ? "Compte créé avec succès. Vous pouvez maintenant vous connecter." 
        : `Vous avez rejoint l'école ${nomEcole} avec succès. Connectez-vous avec votre mot de passe.`,
      isNewUser
    };
  });
}