import * as OAuthService from "../services/oauth.service.js";
import * as AuthService from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export function demarrerGoogle(_req, res, next) {
  try {
    const url = OAuthService.getGoogleAuthUrl();
    res.redirect(url);
  } catch (e) { next(e); }
}

export function demarrerFacebook(_req, res, next) {
  try {
    const url = OAuthService.getFacebookAuthUrl();
    res.redirect(url);
  } catch (e) { next(e); }
}

export async function callbackGoogle(req, res, next) {
  try {
    if (req.query.error) {
      return res.redirect(`${FRONTEND_URL}/login?oauth_error=${encodeURIComponent("Connexion Google annulée.")}`);
    }
    if (!req.query.code) {
      return res.redirect(`${FRONTEND_URL}/login?oauth_error=${encodeURIComponent("Code OAuth manquant.")}`);
    }

    const profile = await OAuthService.echangerCodeGoogle(req.query.code);
    const { user, ecoles } = await OAuthService.connecterUtilisateurOAuth("google", profile);

    // Cas 1 : Une seule école → token direct
    if (ecoles.length === 1) {
      const e = ecoles[0];
      const features = await AuthService.getFeaturesEtablissement(e.id_etablissement);
      const result = AuthService.genererToken(user, e.id_etablissement, e.nom_etablissement, e.roles, features);
      return res.redirect(`${FRONTEND_URL}/login?oauth_token=${encodeURIComponent(result.token)}`);
    }

    // Cas 2 : Plusieurs écoles → demander le choix
    const ecolesEncoded = encodeURIComponent(JSON.stringify(ecoles.map(e => ({ id: e.id_etablissement, nom: e.nom_etablissement }))));
    return res.redirect(`${FRONTEND_URL}/login?oauth_choix_ecole=1&oauth_idUtilisateur=${user.id_utilisateur}&oauth_ecoles=${ecolesEncoded}`);

  } catch (err) {
    const msg = err instanceof AppError ? err.message : "Erreur d'authentification Google.";
    return res.redirect(`${FRONTEND_URL}/login?oauth_error=${encodeURIComponent(msg)}`);
  }
}

export async function callbackFacebook(req, res, next) {
  try {
    if (req.query.error) {
      return res.redirect(`${FRONTEND_URL}/login?oauth_error=${encodeURIComponent("Connexion Facebook annulée.")}`);
    }
    if (!req.query.code) {
      return res.redirect(`${FRONTEND_URL}/login?oauth_error=${encodeURIComponent("Code OAuth manquant.")}`);
    }

    const profile = await OAuthService.echangerCodeFacebook(req.query.code);
    const { user, ecoles } = await OAuthService.connecterUtilisateurOAuth("facebook", profile);

    if (ecoles.length === 1) {
      const e = ecoles[0];
      const features = await AuthService.getFeaturesEtablissement(e.id_etablissement);
      const result = AuthService.genererToken(user, e.id_etablissement, e.nom_etablissement, e.roles, features);
      return res.redirect(`${FRONTEND_URL}/login?oauth_token=${encodeURIComponent(result.token)}`);
    }

    const ecolesEncoded = encodeURIComponent(JSON.stringify(ecoles.map(e => ({ id: e.id_etablissement, nom: e.nom_etablissement }))));
    return res.redirect(`${FRONTEND_URL}/login?oauth_choix_ecole=1&oauth_idUtilisateur=${user.id_utilisateur}&oauth_ecoles=${ecolesEncoded}`);

  } catch (err) {
    const msg = err instanceof AppError ? err.message : "Erreur d'authentification Facebook.";
    return res.redirect(`${FRONTEND_URL}/login?oauth_error=${encodeURIComponent(msg)}`);
  }
}
