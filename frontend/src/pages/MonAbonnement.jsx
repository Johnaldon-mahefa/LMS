import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function MonAbonnement() {
  const { utilisateur } = useAuth();
  const toast = useToast();
  const [abonnement, setAbonnement] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [paiementEnCours, setPaiementEnCours] = useState(false);

  const charger = () => {
    api("/etablissement/mon-abonnement")
      .then((data) => {
        setAbonnement(data);
        setChargement(false);
      })
      .catch((e) => {
        toast.erreur(e.message);
        setChargement(false);
      });
  };

  useEffect(() => { charger(); }, []);

  async function simulerPaiement(plan) {
    setPaiementEnCours(true);
    try {
      await new Promise(r => setTimeout(r, 1500)); // Simulation d'un délai réseau
      await api("/etablissement/payer", { method: "POST", body: { plan } });
      toast.ok("Paiement simulé validé ! Votre abonnement est actif.");
      charger();
    } catch (err) {
      toast.erreur(err.message);
    } finally {
      setPaiementEnCours(false);
    }
  }

  if (chargement) return <div className="p-5 text-center">Chargement...</div>;

  const dateExp = new Date(abonnement.date_expiration);
  const estExpire = dateExp < new Date();
  const estEssai = abonnement.plan_abonnement === "essai";

  return (
    <div className="container py-4" style={{ maxWidth: '800px' }}>
      <h1 className="h3 fw-bold mb-4">Mon abonnement</h1>

      {/* Carte de statut */}
      <div className={`card shadow-sm border-0 mb-5 ${estExpire ? 'border-start border-4 border-danger' : 'border-start border-4 border-success'}`}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold mb-1">Établissement : {abonnement.nom}</h5>
              <p className="text-muted mb-0">
                Plan actuel : <strong className="text-capitalize">{abonnement.plan_abonnement}</strong>
              </p>
            </div>
            <div className="text-end">
              <span className={`badge fs-6 ${estExpire ? 'bg-danger' : 'bg-success'}`}>
                {estExpire ? "Expiré" : "Actif"}
              </span>
              <p className="text-muted small mt-2 mb-0">
                Expire le {dateExp.toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Paiement */}
      <h5 className="fw-bold mb-3">Changer de plan</h5>
      <div className="row g-4">
        
        {/* Plan Basique */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center p-4">
              <h4 className="fw-bold">Basique</h4>
              <h2 className="text-primary my-3">50 000 Ar <span className="fs-6 text-muted">/ mois</span></h2>
              <ul className="list-unstyled text-start mb-4 small text-muted">
                <li><i className="bi bi-check2 text-success me-2"></i>Jusqu'à 100 apprenants</li>
                <li><i className="bi bi-check2 text-success me-2"></i>Gestion des formations</li>
                <li><i className="bi bi-check2 text-success me-2"></i>QCM interactifs</li>
              </ul>
              <button 
                className="btn btn-outline-primary w-100" 
                onClick={() => simulerPaiement("basique")}
                disabled={paiementEnCours || abonnement.plan_abonnement === "basique"}
              >
                {paiementEnCours ? "Traitement..." : abonnement.plan_abonnement === "basique" ? "Plan actuel" : "Payer 50 000 Ar"}
              </button>
            </div>
          </div>
        </div>

        {/* Plan Premium */}
        <div className="col-md-6">
          <div className="card shadow-sm border-primary border-2 h-100">
            <div className="card-body text-center p-4">
              <span className="badge bg-primary mb-2">Recommandé</span>
              <h4 className="fw-bold">Premium</h4>
              <h2 className="text-primary my-3">100 000 Ar <span className="fs-6 text-muted">/ mois</span></h2>
              <ul className="list-unstyled text-start mb-4 small text-muted">
                <li><i className="bi bi-check2 text-success me-2"></i>Apprenants illimités</li>
                <li><i className="bi bi-check2 text-success me-2"></i>Attestations personnalisées</li>
                <li><i className="bi bi-check2 text-success me-2"></i>Support prioritaire</li>
              </ul>
              <button 
                className="btn btn-primary w-100" 
                onClick={() => simulerPaiement("premium")}
                disabled={paiementEnCours || abonnement.plan_abonnement === "premium"}
              >
                {paiementEnCours ? "Traitement..." : abonnement.plan_abonnement === "premium" ? "Plan actuel" : "Payer 100 000 Ar"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
