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
  const [afficher, setAfficher] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function changerMotDePasse(e) {
    e.preventDefault();
    if (nouveau !== confirmation) {
      return toast.erreur("Les nouveaux mots de passe ne correspondent pas.");
    }
    if (nouveau.length < 8) {
      return toast.erreur("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    }

    setChargement(true);
    try {
      await api("/auth/mot-de-passe", {
        method: "PUT",
        body: { ancien, nouveau },
      });
      toast.ok("Mot de passe modifié avec succès.");
      setAncien("");
      setNouveau("");
      setConfirmation("");
    } catch (err) {
      toast.erreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 fw-bold mb-4">Mon profil</h1>

      <div className="row g-4">
        
        {/* COLONNE GAUCHE : INFORMATIONS */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4 text-primary">
                <i className="bi bi-person-badge me-2"></i> Mes informations
              </h5>

              <div className="d-flex justify-content-between py-3 border-bottom">
                <span className="text-muted fw-semibold">Nom</span>
                <span className="fw-bold">{utilisateur.nom}</span>
              </div>
              <div className="d-flex justify-content-between py-3 border-bottom">
                <span className="text-muted fw-semibold">Prénom</span>
                <span className="fw-bold">{utilisateur.prenom}</span>
              </div>
              <div className="d-flex justify-content-between py-3 border-bottom">
                <span className="text-muted fw-semibold">Identifiant</span>
                <span className="fw-bold">{utilisateur.identifiant}</span>
              </div>
              <div className="d-flex justify-content-between py-3">
                <span className="text-muted fw-semibold">Rôles</span>
                <span className="fw-bold text-capitalize">{utilisateur.roles.join(", ")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : MOT DE PASSE */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4 text-primary">
                <i className="bi bi-shield-lock me-2"></i> Changer mon mot de passe
              </h5>

              <form onSubmit={changerMotDePasse}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Ancien mot de passe</label>
                  <input
                    type={afficher ? "text" : "password"}
                    className="form-control"
                    value={ancien}
                    onChange={(e) => setAncien(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Nouveau mot de passe (min. 8 caractères)</label>
                  <input
                    type={afficher ? "text" : "password"}
                    className="form-control"
                    value={nouveau}
                    onChange={(e) => setNouveau(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Confirmer le nouveau mot de passe</label>
                  <input
                    type={afficher ? "text" : "password"}
                    className="form-control"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>

                <div className="form-check mb-4">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="afficherMdp"
                    checked={afficher}
                    onChange={(e) => setAfficher(e.target.checked)}
                  />
                  <label className="form-check-label text-muted" htmlFor="afficherMdp" style={{ cursor: "pointer" }}>
                    Afficher les mots de passe
                  </label>
                </div>

                <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={chargement}>
                  {chargement ? "Modification en cours..." : "Modifier le mot de passe"}
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}