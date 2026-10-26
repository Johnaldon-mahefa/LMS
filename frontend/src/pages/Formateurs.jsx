import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import Loading from "../components/Loading.jsx";

export default function Formateurs() {
  const toast = useToast();
  const [formateurs, setFormateurs] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api("/utilisateurs/formateurs")
      .then((data) => {
        setFormateurs(data);
        setChargement(false);
      })
      .catch((e) => {
        toast.erreur(e.message);
        setChargement(false);
      });
  }, []);

  // Fonction pour générer les initiales du formateur
  const getInitiales = (prenom, nom) => {
    return `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className="container-fluid py-4">
      {/* En-tête de la page */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Affectations des formateurs</h1>
          <p className="text-muted mb-0">Consultez les formateurs de votre établissement et leurs sessions actives.</p>
        </div>
        <span className="badge bg-primary fs-6 py-2 px-3 rounded-pill">
          <i className="bi bi-person-badge me-1"></i>
          {formateurs.length} formateur(s)
        </span>
      </div>

      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-body p-0">
          {chargement ? (
            <div className="p-5">
              <Loading texte="Chargement des formateurs..." />
            </div>
          ) : formateurs.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="text-muted mt-3">Aucun formateur enregistré dans votre établissement.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3" style={{ width: '30%' }}>Formateur</th>
                    <th className="py-3" style={{ width: '20%' }}>Identifiant</th>
                    <th className="py-3 pe-4" style={{ width: '50%' }}>Sessions affectées</th>
                  </tr>
                </thead>
                <tbody>
                  {formateurs.map((f) => (
                    <tr key={f.id_utilisateur}>
                      {/* Colonne Formateur avec Avatar */}
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-3">
                          <div 
                            className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center fw-bold"
                            style={{ width: '40px', height: '40px', fontSize: '14px' }}
                          >
                            {getInitiales(f.prenom, f.nom)}
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{f.prenom} {f.nom}</div>
                            <small className="text-muted">Formateur</small>
                          </div>
                        </div>
                      </td>
                      
                      {/* Colonne Identifiant */}
                      <td className="text-muted">
                        <i className="bi bi-envelope me-1"></i> {f.identifiant}
                      </td>
                      
                      {/* Colonne Sessions */}
                      <td className="pe-4 py-3">
                        {f.sessions.length === 0 ? (
                          <span className="badge bg-warning bg-opacity-10 text-warning border border-warning px-3 py-2 rounded-pill">
                            <i className="bi bi-exclamation-circle me-1"></i> Aucune session affectée
                          </span>
                        ) : (
                          <div className="d-flex flex-wrap gap-2">
                            {f.sessions.map((s, index) => (
                              <div 
                                key={index} 
                                className="card border-0 bg-light"
                                style={{ borderRadius: '8px', minWidth: '200px' }}
                              >
                                <div className="card-body p-2 px-3">
                                  <div className="d-flex align-items-center gap-2 mb-1">
                                    <i className="bi bi-journal-bookmark text-primary"></i>
                                    <strong className="text-dark" style={{ fontSize: '13px' }}>{s.formation}</strong>
                                  </div>
                                  <div className="text-muted" style={{ fontSize: '12px' }}>
                                    <i className="bi bi-calendar3 me-1"></i>
                                    Du {new Date(s.date_debut).toLocaleDateString('fr-FR')} au {new Date(s.date_fin).toLocaleDateString('fr-FR')}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}