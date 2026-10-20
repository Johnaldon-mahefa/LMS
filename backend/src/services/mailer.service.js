// Service : envoi d'emails via SMTP (Gmail). Non bloquant : une erreur d'email n'annule jamais l'action métier.
import nodemailer from "nodemailer";

let transporteur = null;

function getTransporteur() {
  if (transporteur) return transporteur;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("[mailer] Configuration SMTP absente : envoi d'emails désactivé.");
    return null;
  }

  transporteur = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // false pour 587 (STARTTLS), true pour 465 (SSL)
    auth: {
      user: process.env.SMTP_USER,
      // Nettoie les espaces du mot de passe d'application
      pass: (process.env.SMTP_PASS || "").replace(/\s/g, ""),
    },
  });

  // Test de connexion au démarrage (log uniquement)
  transporteur.verify()
    .then(() => console.log("[mailer] ✅ Connexion SMTP Gmail réussie."))
    .catch((err) => console.error("[mailer] ❌ Connexion SMTP échouée :", err.message));

  return transporteur;
}

export async function envoyer({ to, subject, html, text }) {
  const t = getTransporteur();
  if (!t) return { ok: false, raison: "SMTP non configuré" };

  try {
    const info = await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: text || "",
      html,
    });
    console.log(`[mailer] ✉️  Email envoyé à ${to} — ${subject}`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[mailer] ❌ Échec pour ${to} :`, err.message);
    return { ok: false, raison: err.message };
  }
}
