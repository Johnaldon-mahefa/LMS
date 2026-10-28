import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const LABELS_FEATURES = {
  QCM: { texte: "QCM interactifs chronométrés", icone: "bi-patch-question" },
  ATTESTATION: { texte: "Attestations PDF personnalisées", icone: "bi-award" },
  EXPORT_PDF: { texte: "Statistiques & exports PDF", icone: "bi-bar-chart-line" },
  MULTI_FORMATEUR: { texte: "Multi-formateurs par session", icone: "bi-people" },
};

export default function MonAbonnement() {
  const toast = useToast();
  const { rafraichirFeatures } = useAuth();
  const [abonnement, setAbonnement] = useState(null);
  const [plans, setPlans] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [paiementEnCours, setPaiementEnCours] = useState(false);
  
  const [paiementEnAttente, setPaiementEnAttente] = useState(null);
  const [tempsRestant, setTempsRestant] = useState(30); // Réduit à 30 secondes

  const charger = () => {
    setChargement(true);
    Promise.all([
      api("/etablissement/mon-abonnement"),
      api("/etablissement/plans")
    ])
      .then(([dataAbonnement, dataPlans]) => {
        setAbonnement(dataAbonnement);
        setPlans(dataPlans);
        setChargement(false);
      })
      .catch((e) => {
        toast.erreur(e.message);
        setChargement(false);
      });
  };

  useEffect(() => { charger(); }, []);

  async function payer(idPlan) {
    setPaiementEnCours(true);
    try {
      const res = await api("/etablissement/payer", { method: "POST", body: { id_plan: idPlan } });
      
      if (res.serverCorrelationId) {
        setPaiementEnAttente({
          serverCorrelationId: res.serverCorrelationId,
          message: res.message
        });
        setTempsRestant(30); // On remet le chrono à 30s
        toast.ok(res.message);
      } else {
        toast.ok(res.message);
        charger();
        await rafraichirFeatures();
      }
    } catch (err) {
      toast.erreur(err.message);
    } finally {
      setPaiementEnCours(false);
    }
  }

  useEffect(() => {
    if (!paiementEnAttente) return;

    let intervalId;
    let chronoId;
    
    // Chronomètre
    chronoId = setInterval(() => {
      setTempsRestant((prev) => {
        if (prev <= 1) {
          clearInterval(chronoId);
          clearInterval(intervalId);
          // On ne dit pas "échec", on dit "toujours en attente"
          toast.info("Le paiement est toujours en attente de validation sur MVola.");
          setPaiementEnAttente(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Polling toutes les 5 secondes
    const verifierStatut = async () => {
      try {
        const statut = await api(`/etablissement/statut-paiement/${paiementEnAttente.serverCorrelationId}`);
        
        if (statut.status === "completed") {
          clearInterval(intervalId);
          clearInterval(chronoId);
          setPaiementEnAttente(null);
          toast.ok("Paiement validé ! Votre abonnement est actif.");
          charger();
          await rafraichirFeatures();
        } else if (statut.status === "failed") {
          clearInterval(intervalId);
          clearInterval(chronoId);
          setPaiementEnAttente(null);
          toast.erreur("Le paiement a été refusé par MVola.");
        }
      } catch (err) {
        console.error("Erreur vérification statut:", err);
      }
    };

    verifierStatut();
    intervalId = setInterval(verifierStatut, 5000);

    return () => {
      clearInterval(intervalId);
      clearInterval(chronoId);
    };
  }, [paiementEnAttente]);

  const formatTemps = (secondes) => {
    const m = Math.floor(secondes / 60);
    const s = secondes % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (chargement) return <div className="p-5 text-center">Chargement...</div>;

  const dateExp = abonnement.date_expiration_abonnement
    ? new Date(abonnement.date_expiration_abonnement)
    : null;
  const estExpire = dateExp ? dateExp < new Date() : false;

  return (
    <div className="container py-4" style={{ maxWidth: '1000px' }}>
      <h1 className="h3 fw-bold mb-4">Mon abonnement</h1>

      {/* Carte de statut */}
      <div className={`card shadow-sm border-0 mb-5 ${estExpire ? 'border-start border-4 border-danger' : 'border-start border-4 border-success'}`}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h5 className="fw-bold mb-1">Établissement : {abonnement.nom}</h5>
              <p className="text-muted mb-0">
                Plan actuel : <strong className="text-primary">{abonnement.nom_plan}</strong>
              </p>
            </div>
            <div className="text-end">
              <span className={`badge fs-6 ${estExpire ? 'bg-danger' : 'bg-success'}`}>
                {estExpire ? "Expiré" : "Actif"}
              </span>
              <p className="text-muted small mt-2 mb-0">
                Expire le {dateExp ? dateExp.toLocaleDateString('fr-FR') : 'Non défini'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section des plans */}
      <h5 className="fw-bold mb-3">Changer de plan</h5>
      <div className="row g-4">
        {plans.map((plan) => {
          const estActuel = abonnement.id_plan === plan.id_plan;
          const features = plan.fonctionnalites || [];
          
          return (
            <div className="col-md-4" key={plan.id_plan}>
              <div className={`card shadow-sm border-0 h-100 ${estActuel ? 'border-primary border-2' : ''}`}>
                <div className="card-body p-4 d-flex flex-column">
                  {estActuel && <span className="badge bg-primary align-self-start mb-2">Plan actuel</span>}
                  
                  <h4 className="fw-bold">{plan.nom}</h4>
                  <h2 className="text-primary my-2">
                    {Number(plan.prix_mensuel).toLocaleString('fr-FR')} Ar
                    <span className="fs-6 text-muted"> / mois</span>
                  </h2>
                  <p className="text-muted small mb-3">{plan.description}</p>

                  <div className="mb-3 flex-grow-1">
                    <div className="fw-semibold small text-muted mb-2">Fonctionnalités incluses :</div>
                    <ul className="list-unstyled small mb-0">
                      {features.length === 0 ? (
                        <li className="text-muted fst-italic">
                          <i className="bi bi-info-circle me-1"></i>Plan de base (fonctionnalités essentielles)
                        </li>
                      ) : (
                        features.map((code) => {
                          const info = LABELS_FEATURES[code] || { texte: code, icone: "bi-check2" };
                          return (
                            <li key={code} className="mb-1">
                              <i className={`bi ${info.icone} text-success me-2`}></i>
                              {info.texte}
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>

                  <button 
                    className={`btn w-100 mt-auto ${estActuel ? 'btn-outline-secondary' : 'btn-primary'}`}
                    onClick={() => payer(plan.id_plan)}
                    disabled={paiementEnCours || estActuel || !!paiementEnAttente}
                  >
                    {paiementEnCours ? "Traitement..." : estActuel ? "Plan sélectionné" : "Choisir ce plan"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="alert alert-info mt-5 small">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Note :</strong> Le paiement est initié via l'API MVola (mode Sandbox). Le statut de la transaction est vérifié automatiquement toutes les 5 secondes. <br/>
        <em>Pour valider en Sandbox, allez sur le portail MVola Developer et approuvez la transaction.</em>
      </div>

      {/* MODALE D'ATTENTE DE PAIEMENT */}
      {paiementEnAttente && (
        <div className="lms-modal-overlay" style={{ zIndex: 99999, backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
          <div className="lms-modal-box text-center p-5" style={{ maxWidth: '450px', borderRadius: '24px' }}>
            
            <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3.5rem', height: '3.5rem' }}>
              <span className="visually-hidden">Chargement...</span>
            </div>
            
            <h4 className="fw-bold mb-3">Paiement en cours</h4>
            
            <p className="text-muted mb-4">
              Veuillez confirmer le paiement sur votre téléphone ou via le portail MVola.
            </p>
            
            <div className="display-4 fw-bold text-primary mb-4" style={{ letterSpacing: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {formatTemps(tempsRestant)}
            </div>
            
            <div className="progress mb-4" style={{ height: '6px', borderRadius: '3px' }}>
              <div 
                className="progress-bar bg-primary progress-bar-striped progress-bar-animated" 
                role="progressbar" 
                style={{ width: `${(tempsRestant / 30) * 100}%` }}
              ></div>
            </div>
            
            <div className="d-flex flex-column gap-2">
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={() => setPaiementEnAttente(null)}
              >
                Fermer et vérifier plus tard
              </button>
            </div>
            
            <p className="small text-muted mt-3 mb-0">
              <i className="bi bi-exclamation-triangle me-1"></i> En attendant, vous pouvez continuer à utiliser l'application.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}