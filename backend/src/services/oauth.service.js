import { withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

// URLs Google
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// URLs Facebook (Graph API v18)
const FB_AUTH_URL = "https://www.facebook.com/v18.0/dialog/oauth";
const FB_TOKEN_URL = "https://graph.facebook.com/v18.0/oauth/access_token";
const FB_USERINFO_URL = "https://graph.facebook.com/me";

export function getGoogleAuthUrl() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new AppError(503, "OAuth Google non configuré. Contactez l'administrateur.");
  }
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

export function getFacebookAuthUrl() {
  if (!process.env.FACEBOOK_CLIENT_ID) {
    throw new AppError(503, "OAuth Facebook non configuré. Contactez l'administrateur.");
  }
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID,
    redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
    response_type: "code",
    scope: "email",
  });
  return `${FB_AUTH_URL}?${params}`;
}

export async function echangerCodeGoogle(code) {
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  });
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!tokenRes.ok) throw new AppError(400, "Échec de l'authentification Google.");
  const { access_token } = await tokenRes.json();

  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) throw new AppError(400, "Impossible de récupérer le profil Google.");
  const profile = await userRes.json();

  return {
    email: profile.email,
    nom: profile.family_name || "",
    prenom: profile.given_name || "",
    providerId: profile.id,
  };
}

export async function echangerCodeFacebook(code) {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID,
    client_secret: process.env.FACEBOOK_CLIENT_SECRET,
    redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
    code,
  });
  const tokenRes = await fetch(`${FB_TOKEN_URL}?${params}`);
  if (!tokenRes.ok) throw new AppError(400, "Échec de l'authentification Facebook.");
  const { access_token } = await tokenRes.json();

  const userParams = new URLSearchParams({
    fields: "id,email,first_name,last_name",
    access_token,
  });
  const userRes = await fetch(`${FB_USERINFO_URL}?${userParams}`);
  if (!userRes.ok) throw new AppError(400, "Impossible de récupérer le profil Facebook.");
  const profile = await userRes.json();

  return {
    email: profile.email,
    nom: profile.last_name || "",
    prenom: profile.first_name || "",
    providerId: profile.id,
  };
}

/**
 * Trouve l'utilisateur par email ou par providerId, attache le provider ID si absent, et retourne ses écoles.
 * @param {string} provider - "google" ou "facebook"
 */
export async function connecterUtilisateurOAuth(provider, { email, providerId }) {
  if (!email) {
    throw new AppError(400, `${provider === "google" ? "Google" : "Facebook"} n'a pas partagé votre email. Impossible de vous identifier.`);
  }

  return await withTransaction(async (client) => {
    const providerCol = provider === "google" ? "google_id" : "facebook_id";
    
    const userRes = await client.query(
      `SELECT id_utilisateur, identifiant, nom, prenom, statut_compte, google_id, facebook_id
       FROM utilisateur WHERE identifiant = $1 OR ${providerCol} = $2 LIMIT 1`,
      [email, providerId]
    );

    if (userRes.rowCount === 0) {
      throw new AppError(404, "Aucun compte associé à cet email. Veuillez d'abord créer un espace ou vous inscrire avec email/mot de passe.");
    }

    const user = userRes.rows[0];
    if (user.statut_compte !== "actif") throw new AppError(403, "Compte désactivé.");

    // Attacher le provider ID s'il n'est pas encore enregistré
    if (!user[providerCol]) {
      await client.query(
        `UPDATE utilisateur SET ${providerCol} = $1 WHERE id_utilisateur = $2`,
        [providerId, user.id_utilisateur]
      );
    }

    // Récupérer les écoles de l'utilisateur (même logique que la connexion classique)
    const ecolesRes = await client.query(
      `SELECT e.id_etablissement, e.nom, r.nom_role
       FROM utilisateur_etablissement_role uer
       JOIN etablissement e ON e.id_etablissement = uer.id_etablissement
       JOIN role r ON r.id_role = uer.id_role
       WHERE uer.id_utilisateur = $1`,
      [user.id_utilisateur]
    );

    // Grouper les rôles par école
    const ecolesMap = {};
    for (const row of ecolesRes.rows) {
      if (!ecolesMap[row.id_etablissement]) {
        ecolesMap[row.id_etablissement] = {
          id_etablissement: row.id_etablissement,
          nom_etablissement: row.nom,
          roles: [],
        };
      }
      ecolesMap[row.id_etablissement].roles.push(row.nom_role);
    }

    return { user, ecoles: Object.values(ecolesMap) };
  });
}
