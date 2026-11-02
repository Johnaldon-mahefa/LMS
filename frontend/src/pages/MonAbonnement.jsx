import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const LABELS_FEATURES = {
  QCM: { texte: "QCM interactifs", icone: "bi-patch-question" },
  ATTESTATION: { texte: "Attestations PDF", icone: "bi-award" },
  EXPORT_PDF: { texte: "Statistiques & exports PDF", icone: "bi-bar-chart-line" },
  MULTI_FORMATEUR: { texte: "Multi-formateurs", icone: "bi-people" },
};

export default function MonAbonnement() {
  const toast = useToast();
  const { rafraichirFeatures } = useAuth();
  const [abonnement, setAbonnement] = useState(null);
  const [plans, setPlans] = useState([]);
  const [fonctionnalites, setFonctionnalites] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [paiementEnCours, setPaiementEnCours] = useState(false);
  
  const [afficherModalCustom, setAfficherModalCustom] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [prixTotal, setPrixTotal] = useState(0);
  const [maxUtilisateurs, setMaxUtilisateurs] = useState(10);

  const [paiementEnAttente, setPaiementEnAttente] = useState(null);

  const charger = () => {
    setChargement(true);
    Promise.all([
      api("/etablissement/mon-abonnement"),
      api("/etablissement/plans"),
      api("/etablissement/fonctionnalites")
    ])
      .then(([dataAbonnement, dataPlans, dataFonctionnalites]) => {
        setAbonnement(dataAbonnement);
        setPlans(dataPlans);
        setFonctionnalites(dataFonctionnalites);
        
        if (dataAbonnement.nom_plan.startsWith("Sur mesure")) {
          const currentIds = dataFonctionnalites
            .filter(f => dataAbonnement.fonctionnalites_actuelles.includes(f.code_unique))
            .map(f => f.id_fonctionnalite);
          setSelectedFeatures(currentIds);
          const total = currentIds.reduce((acc, id) => {
            const f = dataFonctionnalites.find(x => x.id_fonctionnalite === id);
            return acc + (f ? Number(f.prix_unitaire) : 0);
          }, 0);
          setPrixTotal(total);
          setMaxUtilisateurs(dataAbonnement.max_utilisateurs || 10);
        } else {
          setSelectedFeatures([]);
          setPrixTotal(0);
        }
        setChargement(false);
      })
      .catch((e) => {
        toast.erreur(e.message);
        setChargement(false);
      });
  };

  useEffect(() => { charger(); }, []);

  const toggleFeature = (id, prix) => {
    let newSelected;
    if (selectedFeatures.includes(id)) {
      newSelected = selectedFeatures.filter(f => f !== id);
      setPrixTotal(prev => prev - prix);
    } else {
      newSelected = [...selectedFeatures, id];
      setPrixTotal(prev => prev + prix);
    }
    setSelectedFeatures(newSelected);
  };

  const retirerFeature = (id, prix, e) => {
    e.stopPropagation();
    const newSelected = selectedFeatures.filter(f => f !== id);
    setSelectedFeatures(newSelected);
    setPrixTotal(prev => prev - prix);
  };

  async function payer(idPlan) {
    setPaiementEnCours(true);
    try {
      const res = await api("/etablissement/payer", { method: "POST", body: { id_plan: idPlan } });
      if (res.serverCorrelationId) {
        setPaiementEnAttente({ serverCorrelationId: res.serverCorrelationId, message: res.message });
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

  async function payerSurMesure() {
    if (selectedFeatures.length === 0) {
      const planDecouverte = plans.find(p => Number(p.prix_mensuel) === 0);
      if (planDecouverte) payer(planDecouverte.id_plan);
      setAfficherModalCustom(false);
      return;
    }
    
    setPaiementEnCours(true);
    try {
      const res = await api("/etablissement/payer-sur-mesure", { 
        method: "POST", 
        body: { fonctionnalites: selectedFeatures, max_utilisateurs: maxUtilisateurs } 
      });
      setAfficherModalCustom(false);
      setPaiementEnAttente({ serverCorrelationId: res.serverCorrelationId, message: res.message });
      toast.ok(res.message);
    } catch (err) {
      toast.erreur(err.message);
    } finally {
      setPaiementEnCours(false);
    }
  }

  useEffect(() => {
    if (!paiementEnAttente) return;
    let intervalId;
    let tentatives = 0;
    const maxTentatives = 24;

    const verifierStatut = async () => {
      tentatives++;
      try {
        const statut = await api(`/etablissement/statut-paiement/${paiementEnAttente.serverCorrelationId}`);
        if (statut.status === "completed") {
          clearInterval(intervalId);
          setPaiementEnAttente(null);
          toast.ok("Paiement validé ! Votre abonnement est actif.");
          charger();
          await rafraichirFeatures();
        } else if (statut.status === "failed") {
          clearInterval(intervalId);
          setPaiementEnAttente(null);
          toast.erreur("Le paiement a échoué.");
        } else if (tentatives >= maxTentatives) {
          clearInterval(intervalId);
          setPaiementEnAttente(null);
          toast.info("Le paiement est toujours en attente.");
        }
      } catch (err) {
        if (tentatives >= maxTentatives) clearInterval(intervalId);
      }
    };

    verifierStatut();
    intervalId = setInterval(verifierStatut, 5000);
    return () => clearInterval(intervalId);
  }, [paiementEnAttente]);

  if (chargement) return <div className="p-5 text-center">Chargement...</div>;

  const dateExp = abonnement.date_expiration_abonnement ? new Date(abonnement.date_expiration_abonnement) : null;
  const estExpire = dateExp ? dateExp < new Date() : false;

  const planDecouverte = plans.find(p => Number(p.prix_mensuel) === 0);
  const autresPlans = plans.filter(p => Number(p.prix_mensuel) > 0);

  return (
    <div className="container py-4" style={{ maxWidth: '1000px' }}>
      <h1 className="h3 fw-bold mb-4">Mon abonnement</h1>

      {paiementEnAttente && (
        <div className="alert alert-info border-0 shadow-sm mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="spinner-border text-primary" role="status"></div>
            <div>
              <strong>Paiement en attente de validation</strong>
              <p className="mb-0 small">{paiementEnAttente.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Carte de statut */}
      <div className={`card shadow-sm border-0 mb-5 ${estExpire ? 'border-start border-4 border-danger' : 'border-start border-4 border-success'}`}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h5 className="fw-bold mb-1">Établissement : {abonnement.nom}</h5>
              <p className="text-muted mb-0">Plan actuel : <strong className="text-primary">{abonnement.nom_plan}</strong></p>
              <p className="text-muted small mb-0 mt-1">
                <i className="bi bi-people me-1"></i>
                Utilisateurs : <strong>{abonnement.nb_utilisateurs_actuels} / {abonnement.max_utilisateurs === null ? "∞" : abonnement.max_utilisateurs}</strong>
              </p>
            </div>
            <div className="text-end">
              <span className={`badge fs-6 ${estExpire ? 'bg-danger' : 'bg-success'}`}>{estExpire ? "Expiré" : "Actif"}</span>
              <p className="text-muted small mt-2 mb-0">Expire le {dateExp ? dateExp.toLocaleDateString('fr-FR') : 'Non défini'}</p>
            </div>
          </div>
        </div>
      </div>

      <h5 className="fw-bold mb-3">Changer de plan</h5>
      
      <div className="row g-4 justify-content-center">
        
        {/* CARTE DÉCOUVERTE */}
        {planDecouverte && (
          <div className="col-md-4">
            <div className={`card shadow-sm border-0 h-100 ${abonnement.id_plan === planDecouverte.id_plan ? 'border-primary border-2' : ''}`}>
              <div className="card-body p-4 d-flex flex-column">
                {abonnement.id_plan === planDecouverte.id_plan && <span className="badge bg-primary align-self-start mb-2">Plan actuel</span>}
                <h4 className="fw-bold">{planDecouverte.nom}</h4>
                <h2 className="text-primary my-2">
                  {prixTotal.toLocaleString('fr-FR')} Ar<span className="fs-6 text-muted"> / mois</span>
                </h2>
                <p className="text-muted small mb-2">{planDecouverte.description}</p>
                <p className="small text-muted mb-3">
                  <i className="bi bi-people me-1"></i> {maxUtilisateurs} utilisateurs max
                </p>
                
                <div className="mb-3 flex-grow-1">
                  <ul className="list-unstyled small mb-0">
                    {selectedFeatures.length === 0 ? (
                      <li className="text-muted fst-italic"><i className="bi bi-info-circle me-1"></i>Fonctionnalités essentielles</li>
                    ) : (
                      selectedFeatures.map((id) => {
                        const f = fonctionnalites.find(x => x.id_fonctionnalite === id);
                        if (!f) return null;
                        return (
                          <li key={id} className="mb-2 d-flex justify-content-between align-items-center">
                            <span className="text-dark">
                              <i className={`bi ${LABELS_FEATURES[f.code_unique]?.icone || 'bi-check2'} text-success me-2`}></i>
                              {LABELS_FEATURES[f.code_unique]?.texte || f.nom}
                            </span>
                            <button type="button" className="btn-remove-feature" onClick={(e) => retirerFeature(id, Number(f.prix_unitaire), e)}>
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>

                <div className="d-flex flex-column gap-2 mt-auto">
                  <button className="btn btn-outline-primary w-100 fw-semibold" onClick={() => setAfficherModalCustom(true)}>
                    <i className="bi bi-sliders me-2"></i> Ajouter des options
                  </button>
                  {prixTotal > 0 && (
                    <button className="btn btn-primary w-100" onClick={payerSurMesure} disabled={paiementEnCours || !!paiementEnAttente}>
                      {paiementEnCours ? "Traitement..." : `Payer ${prixTotal.toLocaleString('fr-FR')} Ar`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUTRES CARTES */}
        {autresPlans.map((plan) => {
          const estActuel = abonnement.id_plan === plan.id_plan;
          const features = plan.fonctionnalites || [];
          return (
            <div className="col-md-4" key={plan.id_plan}>
              <div className={`card shadow-sm border-0 h-100 ${estActuel ? 'border-primary border-2' : ''}`}>
                <div className="card-body p-4 d-flex flex-column">
                  {estActuel && <span className="badge bg-primary align-self-start mb-2">Plan actuel</span>}
                  <h4 className="fw-bold">{plan.nom}</h4>
                  <h2 className="text-primary my-2">
                    {Number(plan.prix_mensuel).toLocaleString('fr-FR')} Ar<span className="fs-6 text-muted"> / mois</span>
                  </h2>
                  <p className="text-muted small mb-2">{plan.description}</p>
                  <p className="small text-muted mb-3">
                    <i className="bi bi-people me-1"></i> {plan.max_utilisateurs === null ? "Utilisateurs illimités" : `${plan.max_utilisateurs} utilisateurs max`}
                  </p>
                  
                  <div className="mb-3 flex-grow-1">
                    <ul className="list-unstyled small mb-0">
                      {features.map((code) => (
                        <li key={code} className="mb-1"><i className={`bi ${LABELS_FEATURES[code]?.icone || 'bi-check2'} text-success me-2`}></i>{LABELS_FEATURES[code]?.texte || code}</li>
                      ))}
                    </ul>
                  </div>

                  <button className={`btn w-100 mt-auto ${estActuel ? 'btn-outline-secondary' : 'btn-primary'}`} onClick={() => payer(plan.id_plan)} disabled={paiementEnCours || estActuel || !!paiementEnAttente}>
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
        <strong>Note :</strong> Le paiement est initié via l'API MVola (mode Sandbox). Le montant réel débité est de 500 Ar pour le test.
      </div>

      {/* MODALE */}
      {afficherModalCustom && (
        <div className="lms-modal-overlay" onClick={(e) => e.target === e.currentTarget && setAfficherModalCustom(false)}>
          <div className="lms-modal-box" style={{ maxWidth: '600px' }}>
            <div className="lms-modal-header">
              <h2>Composer mon offre sur mesure</h2>
              <button type="button" onClick={() => setAfficherModalCustom(false)}>✕</button>
            </div>
            <div className="lms-modal-body">
              <p className="text-muted small mb-3">Cochez les fonctionnalités à ajouter à votre plan.</p>
              
              <div className="row g-3 mb-4">
                {fonctionnalites.map((f) => (
                  <div className="col-md-6" key={f.id_fonctionnalite}>
                    <div 
                      className={`custom-feature-card p-3 rounded-3 border d-flex align-items-center gap-3 ${selectedFeatures.includes(f.id_fonctionnalite) ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'}`} 
                      onClick={() => toggleFeature(f.id_fonctionnalite, Number(f.prix_unitaire))}
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      <input type="checkbox" className="form-check-input mt-0" checked={selectedFeatures.includes(f.id_fonctionnalite)} readOnly />
                      <div className="flex-grow-1">
                        <strong className="d-block text-dark">{LABELS_FEATURES[f.code_unique]?.texte || f.nom}</strong>
                        <small className="text-muted">+ {Number(f.prix_unitaire).toLocaleString('fr-FR')} Ar / mois</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Limite utilisateurs */}
              <div className="p-3 bg-light rounded-3 border">
                <label className="form-label small fw-bold">
                  <i className="bi bi-people me-1"></i> Nombre maximum d'utilisateurs
                </label>
                <select className="form-select" value={maxUtilisateurs} onChange={(e) => setMaxUtilisateurs(Number(e.target.value))}>
                  <option value={10}>10 utilisateurs</option>
                  <option value={50}>50 utilisateurs</option>
                  <option value={100}>100 utilisateurs</option>
                  <option value={500}>500 utilisateurs</option>
                </select>
              </div>
            </div>
            
            <div className="lms-modal-footer d-flex justify-content-between align-items-center bg-light">
              <div>
                <span className="text-muted small d-block">Total à payer :</span>
                <span className="fs-3 fw-bold text-primary">{prixTotal.toLocaleString('fr-FR')} Ar<span className="fs-6 text-muted"> /mois</span></span>
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn-ghost" onClick={() => setAfficherModalCustom(false)}>Annuler</button>
                <button type="button" className="btn btn-primary px-4" onClick={payerSurMesure} disabled={paiementEnCours}>
                  {paiementEnCours ? "Traitement..." : (prixTotal > 0 ? "Payer cette offre" : "Enregistrer (Gratuit)")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}