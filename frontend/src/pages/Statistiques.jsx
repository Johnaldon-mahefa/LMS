import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Statistiques() {
  const toast = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api("/admin/statistiques").then(setStats).catch((e) => toast.erreur(e.message));
  }, []);

  if (!stats) return <div className="p-5 text-center text-muted">Chargement des statistiques...</div>;

  // Couleurs harmonisées avec le thème
  const COLORS = {
    primary: '#6366f1', // Indigo
    success: '#10b981', // Vert
    warning: '#f59e0b', // Orange
    danger: '#ef4444',  // Rouge
    secondary: '#64748b'// Gris
  };

  // Données pour le camembert (Utilisateurs)
  const dataUsers = {
    labels: ['Actifs', 'Désactivés'],
    datasets: [{
      data: [stats.utilisateurs.actifs, stats.utilisateurs.desactives],
      backgroundColor: [COLORS.primary, COLORS.danger],
      borderWidth: 0,
    }],
  };

  // Données pour le graphique en barres (Formations)
  const dataFormations = {
    labels: ['Brouillon', 'Publiées', 'Archivées'],
    datasets: [{
      label: 'Nombre de formations',
      data: [stats.formations.brouillons, stats.formations.publiees, stats.formations.archivees],
      backgroundColor: [COLORS.warning, COLORS.success, COLORS.secondary],
      borderRadius: 6, // Bords plus arrondis
    }],
  };

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 fw-bold mb-4">Tableau de bord</h1>

      {/* --- LIGNE 1 : LES CARTES DE CHIFFRES --- */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4 d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                <i className="bi bi-people-fill text-primary fs-4"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 fw-semibold text-uppercase small">Utilisateurs</h6>
                <h3 className="mb-0 fw-bold text-dark">{stats.utilisateurs.total}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4 d-flex align-items-center">
              <div className="bg-success bg-opacity-10 p-3 rounded-3 me-3">
                <i className="bi bi-journal-bookmark-fill text-success fs-4"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 fw-semibold text-uppercase small">Formations</h6>
                <h3 className="mb-0 fw-bold text-dark">{stats.formations.total}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4 d-flex align-items-center">
              <div className="bg-warning bg-opacity-10 p-3 rounded-3 me-3">
                <i className="bi bi-person-plus-fill text-warning fs-4"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 fw-semibold text-uppercase small">Inscriptions</h6>
                <h3 className="mb-0 fw-bold text-dark">{stats.inscriptions.total}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4 d-flex align-items-center">
              <div className="bg-info bg-opacity-10 p-3 rounded-3 me-3">
                <i className="bi bi-award-fill text-info fs-4"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 fw-semibold text-uppercase small">Attestations</h6>
                <h3 className="mb-0 fw-bold text-dark">{stats.attestations.total}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- LIGNE 2 : LES GRAPHIQUES --- */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 text-dark">Statut des utilisateurs</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Doughnut 
                  data={dataUsers} 
                  options={{ 
                    maintainAspectRatio: false, 
                    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
                    cutout: '70%' // Rend le donut plus fin et plus moderne
                  }} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 text-dark">Répartition des formations</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar 
                  data={dataFormations} 
                  options={{ 
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: false } }, 
                    scales: { 
                      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { borderDash: [5, 5] } },
                      x: { grid: { display: false } }
                    } 
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- LIGNE 3 : TABLEAU DES FORMATIONS POPULAIRES --- */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="p-4 border-bottom">
                <h5 className="fw-bold mb-0 text-dark">Top 5 des formations les plus suivies</h5>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Nom de la formation</th>
                      <th>Statut</th>
                      <th className="text-end">Nombre d'inscrits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.formationsPopulaires.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center text-muted py-4">Aucune formation pour le moment.</td>
                      </tr>
                    ) : (
                      stats.formationsPopulaires.map((f, index) => (
                        <tr key={index}>
                          <td className="fw-bold text-dark">{f.intitule}</td>
                          <td>
                            <span className={`etiquette ${f.statut_formation}`}>
                              {f.statut_formation}
                            </span>
                          </td>
                          <td className="text-end fw-semibold text-muted">
                            {f.nb_inscrits} inscrit(s)
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}