import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

// Composant pour les barres de progression propres
function ProgressBar({ value, total, color = "primary" }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="progress mb-2" style={{ height: '8px', borderRadius: '4px', backgroundColor: '#e2e8f0' }}>
      <div 
        className={`progress-bar bg-${color}`} 
        role="progressbar" 
        style={{ width: `${percentage}%`, borderRadius: '4px' }} 
        aria-valuenow={value} 
        aria-valuemin="0" 
        aria-valuemax={total}
      ></div>
    </div>
  );
}

// Composant pour les cartes de statistiques (KPI)
function KpiCard({ title, value, icon, color }) {
  return (
    <div className="col-12 col-sm-6 col-xl-4 col-xxl-2">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body p-4 d-flex align-items-center">
          <div className={`bg-${color} bg-opacity-10 p-3 rounded-3 me-3`}>
            <i className={`bi ${icon} text-${color} fs-4`}></i>
          </div>
          <div>
            <h3 className="mb-0 fw-bold">{value}</h3>
            <small className="text-muted fw-semibold">{title}</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Statistiques() {
  const toast = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api("/admin/statistiques")
      .then(setStats)
      .catch((e) => toast.erreur(e.message));
  }, [toast]);

  if (!stats) return <div className="p-5 text-center text-muted">Chargement du tableau de bord...</div>;

  const { utilisateurs, formations, inscriptions, modules, soumissions, attestations, parRole } = stats;

  // Préparation des données pour les rôles
  const rolesData = [
    { nom: "Administrateurs", valeur: parRole.find((r) => r.role === "administrateur")?.nombre || 0, color: "danger" },
    { nom: "Formateurs", valeur: parRole.find((r) => r.role === "formateur")?.nombre || 0, color: "warning" },
    { nom: "Apprenants", valeur: parRole.find((r) => r.role === "apprenant")?.nombre || 0, color: "primary" },
  ];
  const totalRoles = rolesData.reduce((a, r) => a + r.valeur, 0);

  return (
    <div className="container-fluid py-4">
      
      {/* EN-TÊTE */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Tableau de bord</h1>
          <p className="text-muted small mb-0">Vue d'ensemble de votre établissement</p>
        </div>
      </div>

      {/* LIGNE 1 : CARTES KPI (CHIFFRES CLÉS) */}
      <div className="row g-3 mb-4">
        <KpiCard title="Utilisateurs" value={utilisateurs.total} icon="bi-people" color="primary" />
        <KpiCard title="Formations" value={formations.total} icon="bi-journal-bookmark" color="success" />
        <KpiCard title="Inscriptions" value={inscriptions.total} icon="bi-person-plus" color="info" />
        <KpiCard title="Modules publiés" value={modules.publies} icon="bi-box" color="warning" />
        <KpiCard title="Travaux à corriger" value={soumissions.a_corriger} icon="bi-pencil-square" color="danger" />
        <KpiCard title="Attestations" value={attestations.total} icon="bi-award" color="secondary" />
      </div>

      {/* LIGNE 2 : RÉPARTITION & STATUTS */}
      <div className="row g-4 mb-4">
        
        {/* Rôles */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Répartition des utilisateurs</h5>
              
              {rolesData.map((r) => (
                <div key={r.nom} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="small fw-semibold text-muted">{r.nom}</span>
                    <span className="small fw-bold">{r.valeur}</span>
                  </div>
                  <ProgressBar value={r.valeur} total={totalRoles} color={r.color} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Formations */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Formations par statut</h5>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-semibold text-muted">Publiées</span>
                  <span className="small fw-bold">{formations.publiees}</span>
                </div>
                <ProgressBar value={formations.publiees} total={formations.total} color="success" />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-semibold text-muted">Brouillons</span>
                  <span className="small fw-bold">{formations.brouillons}</span>
                </div>
                <ProgressBar value={formations.brouillons} total={formations.total} color="warning" />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-semibold text-muted">Archivées</span>
                  <span className="small fw-bold">{formations.archivees}</span>
                </div>
                <ProgressBar value={formations.archivees} total={formations.total} color="secondary" />
              </div>
            </div>
          </div>
        </div>

        {/* Inscriptions */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Inscriptions par statut</h5>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-semibold text-muted">Validées</span>
                  <span className="small fw-bold">{inscriptions.validees}</span>
                </div>
                <ProgressBar value={inscriptions.validees} total={inscriptions.total} color="success" />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-semibold text-muted">En attente</span>
                  <span className="small fw-bold">{inscriptions.en_attente}</span>
                </div>
                <ProgressBar value={inscriptions.en_attente} total={inscriptions.total} color="warning" />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-semibold text-muted">Refusées</span>
                  <span className="small fw-bold">{inscriptions.refusees}</span>
                </div>
                <ProgressBar value={inscriptions.refusees} total={inscriptions.total} color="danger" />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-semibold text-muted">Annulées</span>
                  <span className="small fw-bold">{inscriptions.annulees}</span>
                </div>
                <ProgressBar value={inscriptions.annulees} total={inscriptions.total} color="secondary" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* LIGNE 3 : MODULES ET SOUMISSIONS */}
      <div className="row g-4">
        
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Modules</h5>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-semibold text-muted">Publiés</span>
                  <span className="small fw-bold">{modules.publies}</span>
                </div>
                <ProgressBar value={modules.publies} total={modules.total} color="success" />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-semibold text-muted">Brouillons</span>
                  <span className="small fw-bold">{modules.brouillons}</span>
                </div>
                <ProgressBar value={modules.brouillons} total={modules.total} color="warning" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Soumissions (Travaux)</h5>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-semibold text-muted">Corrigées</span>
                  <span className="small fw-bold">{soumissions.corrigees}</span>
                </div>
                <ProgressBar value={soumissions.corrigees} total={soumissions.total} color="success" />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-semibold text-muted">À corriger</span>
                  <span className="small fw-bold">{soumissions.a_corriger}</span>
                </div>
                <ProgressBar value={soumissions.a_corriger} total={soumissions.total} color="danger" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}