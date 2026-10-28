import { AppError } from "../utils/AppError.js";

export async function verifierTurnstile(req, _res, next) {
  // Le widget Cloudflare envoie le token sous le nom "cf-turnstile-response"
  const token = req.body["cf-turnstile-response"];

  if (!token || typeof token !== "string") {
    return next(new AppError(400, "Veuillez valider le CAPTCHA."));
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: req.ip,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      console.error("Échec Turnstile:", data["error-codes"]);
      return next(new AppError(400, "La vérification anti-robot a échoué. Veuillez réessayer."));
    }

    next();
  } catch (error) {
    console.error("Erreur réseau Turnstile:", error);
    return next(new AppError(500, "Impossible de vérifier le CAPTCHA."));
  }
}
