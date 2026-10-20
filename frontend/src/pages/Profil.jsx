import { useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Profil() {
  const { utilisateur } = useAuth();
  const toast = useToast();

  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [voir, setVoir] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(e) {
    e.preventDefault();
    if (nouveau.length < 8) {
      toast.erreur("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (nouveau !== confirmation) {
      toast.erreur("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setEnvoi(true);
    try {
      await api("/profil/mot-de-passe", {
        method: "PATCH",
        body: { ancien, nouveau },
      });
      toast.ok("Mot de passe modifié avec succès.");
      setAncien("");
      setNouveau("");
      setConfirmation("");
    } catch (err) {
      toast.erreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <h1 style={{ marginBottom: 20 }}>Mon profil</h1>

      <div className="page-split">
        {/* COLONNE GAUCHE : informations */}
        <div className="colonne gauche">
          <h2>Mes informations</h2>

          <div className="profil-info">
            <div className="profil-info-ligne">
              <span>Nom</span>
              <strong>{utilisateur.nom}</strong>
            </div>
            <div className="profil-info-ligne">
              <span>Prénom</span>
              <strong>{utilisateur.prenom}</strong>
            </div>
            <div className="profil-info-ligne">
              <span>Identifiant</span>
              <strong>{utilisateur.identifiant}</strong>
            </div>
            <div className="profil-info-ligne">
              <span>Rôles</span>
              <strong>{utilisateur.roles.join(", ")}</strong>
            </div>
          </div>

          <p style={{ marginTop: 16, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
            Pour modifier vos informations personnelles (nom, prénom, identifiant), contactez l'administrateur du centre.
          </p>
        </div>

        {/* COLONNE DROITE : changement de mot de passe */}
        <div className="colonne droite">
          <h2>Changer mon mot de passe</h2>

          <form onSubmit={soumettre} className="grille" style={{ maxWidth: 480 }}>
            <label>
              Ancien mot de passe
              <input
                type={voir ? "text" : "password"}
                value={ancien}
                onChange={(e) => setAncien(e.target.value)}
                required
                autoFocus
              />
            </label>

            <label>
              Nouveau mot de passe (min. 8 caractères)
              <input
                type={voir ? "text" : "password"}
                value={nouveau}
                onChange={(e) => setNouveau(e.target.value)}
                minLength={8}
                required
              />
            </label>

            <label>
              Confirmer le nouveau mot de passe
              <input
                type={voir ? "text" : "password"}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                minLength={8}
                required
              />
            </label>

            <div className="ligne" style={{ marginBottom: 8 }}>
              <label className="case-active">
                <input
                  type="checkbox"
                  checked={voir}
                  onChange={(e) => setVoir(e.target.checked)}
                />
                Afficher les mots de passe
              </label>
            </div>

            <button type="submit" disabled={envoi}>
              {envoi ? "Modification…" : "Modifier le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
