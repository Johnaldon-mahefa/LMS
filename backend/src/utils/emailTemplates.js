// Templates HTML des emails (charte violette).

const COULEUR_PRIMAIRE = "#6d28d9";
const COULEUR_ACCENT = "#ec4899";
const COULEUR_FOND = "#f6f4fc";

function enveloppe(contenu) {
  return `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${COULEUR_FOND};font-family:Arial,'Segoe UI',sans-serif;color:#1a1528;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COULEUR_FOND};padding:30px 15px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(109,40,217,.15);">
        <tr><td style="background:linear-gradient(135deg,#2e1065 0%,#6d28d9 60%,#ec4899 100%);padding:28px 30px;text-align:center;">
          <div style="display:inline-block;width:52px;height:52px;background:rgba(255,255,255,.15);border-radius:14px;line-height:52px;font-weight:900;color:#fff;font-size:15px;">innov</div>
          <h1 style="color:#fff;font-size:20px;margin:12px 0 0;font-weight:900;">Innov-T Learning Hub</h1>
          <p style="color:#ddd6fe;font-size:13px;margin:4px 0 0;">Centre de formation professionnelle</p>
        </td></tr>
        <tr><td style="padding:32px 30px;">${contenu}</td></tr>
        <tr><td style="background:#f5f3ff;padding:18px 30px;text-align:center;font-size:11.5px;color:#6b6485;border-top:1px solid #e7e3f4;">
          © ${new Date().getFullYear()} Innov-T Learning Hub — Tous droits réservés<br>
          Beravina, Fianarantsoa 301, Madagascar<br>
          <a href="mailto:contact@innov-t.mg" style="color:${COULEUR_PRIMAIRE};text-decoration:none;">contact@innov-t.mg</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function bouton(texte, url) {
  return `<a href="${url}" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,${COULEUR_PRIMAIRE},${COULEUR_ACCENT});color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;margin-top:16px;">${texte}</a>`;
}

/* 1. Bienvenue + identifiants */
export function emailBienvenue({ prenom, nom, identifiant, motDePasse, urlPlateforme }) {
  const contenu = `
    <h2 style="font-size:20px;color:#2e1065;margin:0 0 14px;">Bienvenue ${prenom} ${nom} 👋</h2>
    <p style="font-size:15px;line-height:1.6;color:#3d3455;margin:0 0 16px;">
      Votre compte sur la plateforme <strong>Innov-T Learning Hub</strong> a été créé par l'administrateur. Voici vos identifiants :
    </p>
    <div style="background:#f5f3ff;border-left:4px solid ${COULEUR_PRIMAIRE};border-radius:10px;padding:18px 20px;margin:20px 0;">
      <p style="margin:0 0 10px;font-size:12px;color:#6b6485;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">Vos identifiants</p>
      <p style="margin:0 0 8px;font-size:15px;"><strong>Identifiant :</strong> <code style="background:#fff;padding:3px 8px;border-radius:6px;border:1px solid #e7e3f4;color:${COULEUR_PRIMAIRE};font-weight:700;">${identifiant}</code></p>
      <p style="margin:0;font-size:15px;"><strong>Mot de passe :</strong> <code style="background:#fff;padding:3px 8px;border-radius:6px;border:1px solid #e7e3f4;color:${COULEUR_PRIMAIRE};font-weight:700;">${motDePasse}</code></p>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#6b6485;margin:0;">
      ⚠️ Nous vous recommandons de <strong>changer votre mot de passe</strong> dès votre première connexion.
    </p>
    ${bouton("Se connecter", urlPlateforme || "http://localhost:5173/connexion")}
  `;
  return {
    subject: "🎓 Bienvenue sur Innov-T Learning Hub — Vos identifiants",
    html: enveloppe(contenu),
    text: `Bienvenue ${prenom} ${nom}\n\nIdentifiant : ${identifiant}\nMot de passe : ${motDePasse}\n\nConnectez-vous : ${urlPlateforme}`,
  };
}

/* 2. Nouveau module publié */
export function emailNouveauModule({ prenom, formation, module, urlPlateforme }) {
  const contenu = `
    <h2 style="font-size:20px;color:#2e1065;margin:0 0 14px;">Nouveau contenu disponible 📚</h2>
    <p style="font-size:15px;line-height:1.6;color:#3d3455;margin:0 0 16px;">Bonjour ${prenom},</p>
    <p style="font-size:15px;line-height:1.6;color:#3d3455;margin:0 0 16px;">
      Un nouveau module vient d'être publié dans la formation <strong>${formation}</strong> :
    </p>
    <div style="background:#f5f3ff;border-left:4px solid ${COULEUR_ACCENT};border-radius:10px;padding:16px 20px;margin:18px 0;">
      <p style="margin:0;font-size:16px;font-weight:800;color:#2e1065;">📖 ${module}</p>
    </div>
    ${bouton("Consulter le module", urlPlateforme || "http://localhost:5173/mes-formations")}
  `;
  return {
    subject: `📚 Nouveau module : ${module}`,
    html: enveloppe(contenu),
    text: `Bonjour ${prenom}, un nouveau module "${module}" est disponible dans "${formation}".`,
  };
}

/* 3. Inscription validée */
export function emailInscriptionValidee({ prenom, formation, dateDebut, urlPlateforme }) {
  const contenu = `
    <h2 style="font-size:20px;color:#2e1065;margin:0 0 14px;">Inscription validée ✅</h2>
    <p style="font-size:15px;line-height:1.6;color:#3d3455;margin:0 0 16px;">Bonjour ${prenom},</p>
    <p style="font-size:15px;line-height:1.6;color:#3d3455;margin:0 0 16px;">
      Votre inscription à la formation <strong>${formation}</strong> a été <strong style="color:#047857;">validée</strong>.
    </p>
    <div style="background:#d1fae5;border-left:4px solid #10b981;border-radius:10px;padding:16px 20px;margin:18px 0;">
      <p style="margin:0;font-size:14px;color:#047857;"><strong>📅 Session :</strong> début le ${dateDebut}</p>
    </div>
    ${bouton("Accéder à mes formations", urlPlateforme || "http://localhost:5173/mes-formations")}
  `;
  return {
    subject: `✅ Inscription validée — ${formation}`,
    html: enveloppe(contenu),
    text: `Bonjour ${prenom}, votre inscription à "${formation}" est validée. Début : ${dateDebut}.`,
  };
}

/* 4. Inscription refusée */
export function emailInscriptionRefusee({ prenom, formation }) {
  const contenu = `
    <h2 style="font-size:20px;color:#2e1065;margin:0 0 14px;">Inscription refusée</h2>
    <p style="font-size:15px;line-height:1.6;color:#3d3455;margin:0 0 16px;">Bonjour ${prenom},</p>
    <p style="font-size:15px;line-height:1.6;color:#3d3455;margin:0 0 16px;">
      Votre demande d'inscription à la formation <strong>${formation}</strong> a été <strong style="color:#b91c1c;">refusée</strong>.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#6b6485;margin:0;">
      Pour plus d'informations, contactez l'administrateur du centre.
    </p>
  `;
  return {
    subject: `Inscription refusée — ${formation}`,
    html: enveloppe(contenu),
    text: `Bonjour ${prenom}, votre inscription à "${formation}" a été refusée.`,
  };
}

/* 5. Note disponible */
export function emailNoteDisponible({ prenom, evaluation, formation, note, noteMaximale, urlPlateforme }) {
  const contenu = `
    <h2 style="font-size:20px;color:#2e1065;margin:0 0 14px;">Votre note est disponible 🎯</h2>
    <p style="font-size:15px;line-height:1.6;color:#3d3455;margin:0 0 16px;">Bonjour ${prenom},</p>
    <p style="font-size:15px;line-height:1.6;color:#3d3455;margin:0 0 16px;">
      Votre travail pour l'évaluation <strong>${evaluation}</strong> (formation ${formation}) a été corrigé :
    </p>
    <div style="background:linear-gradient(135deg,#f5f3ff,#fce7f3);border-radius:14px;padding:24px;margin:20px 0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#6b6485;text-transform:uppercase;letter-spacing:.1em;font-weight:700;">Note obtenue</p>
      <p style="margin:8px 0 0;font-size:36px;font-weight:900;color:${COULEUR_PRIMAIRE};">${note} / ${noteMaximale}</p>
    </div>
    ${bouton("Voir mes résultats", urlPlateforme || "http://localhost:5173/resultats")}
  `;
  return {
    subject: `🎯 Note disponible — ${evaluation}`,
    html: enveloppe(contenu),
    text: `Bonjour ${prenom}, votre note pour "${evaluation}" est ${note}/${noteMaximale}.`,
  };
}

/* 6. Attestation délivrée */
export function emailAttestation({ prenom, formation, numero, urlPlateforme }) {
  const contenu = `
    <h2 style="font-size:20px;color:#2e1065;margin:0 0 14px;">Félicitations ! 🎉</h2>
    <p style="font-size:15px;line-height:1.6;color:#3d3455;margin:0 0 16px;">Bonjour ${prenom},</p>
    <p style="font-size:15px;line-height:1.6;color:#3d3455;margin:0 0 16px;">
      Vous avez <strong>validé tous les modules</strong> de la formation <strong>${formation}</strong>. Votre attestation est prête.
    </p>
    <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:14px;padding:20px;margin:20px 0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#b45309;text-transform:uppercase;letter-spacing:.1em;font-weight:700;">Numéro d'attestation</p>
      <p style="margin:8px 0 0;font-size:22px;font-weight:900;color:#b45309;">${numero}</p>
    </div>
    ${bouton("Télécharger mon attestation", urlPlateforme || "http://localhost:5173/resultats")}
  `;
  return {
    subject: `🎉 Votre attestation — ${formation}`,
    html: enveloppe(contenu),
    text: `Félicitations ${prenom}, votre attestation pour "${formation}" est prête. N° ${numero}`,
  };
}
