import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { exporterCSV, exporterPDF } from "../utils/export.js";
import Loading from "../components/Loading.jsx";

// Définition des colonnes pour l'export CSV/PDF
const COLONNES_EXPORT = [
  { cle: "nom_complet", titre: "Apprenant" },
  { cle: "progression", titre: "Progression (%)" },
  { cle: "soumissions_a_corriger", titre: "Travaux à corriger" }
];

export default function Suivi() {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [courante, setCourante] = useState(null);
  const [suivi, setSuivi] = useState(null);
  const [detail, setDetail] = useState(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    api("/formateur/sessions").then(setSessions).catch((e) => toast.erreur(e.message));
  }, []);

  const ouvrirSession = (s) => {
    setCourante(s);
    setDetail(null);
    setChargement(true);
    api(`/formateur/sessions/${s.id_session}/progression`)
      .then((data) => {
        setSuivi(data);
        setChargement(false);
      })
      .catch((e) => {
        toast.erreur(e.message);
        setChargement(false);
      });
  };

  const ouvrirApprenant = (id) =>
    api(`/formateur/inscriptions/${id}/detail`).then(setDetail).catch((e) => toast.erreur(e.message));

  // --- FONCTIONS D'EXPORT ---
  function preparerDonnees() {
    return suivi.apprenants.map(a => ({
      ...a,
      nom_complet: `${a.prenom} ${a.nom}`
    }));
  }

  function exporterEnCSV() {
    if (!suivi || !courante) return;
    const data = preparerDonnees();
    const nomFichier = `suivi_${courante.formation.replace(/\s+/g, '_')}`;
    exporterCSV(data, COLONNES_EXPORT, nomFichier);
    toast.ok(`Export CSV de ${data.length} apprenant(s).`);
  }

  function exporterEnPDF() {
    if (!suivi || !courante) return;
    const data = preparerDonnees();
    const nomFichier = `suivi_${courante.formation.replace(/\s+/g, '_')}`;
    exporterPDF(data, COLONNES_EXPORT, nomFichier, `Suivi de la session : ${courante.formation}`);
    toast.ok(`Export PDF de ${data.length} apprenant(s).`);
  }

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 fw-bold mb-4">Suivre la progression des apprenants</h1>

      <div className="row g-4">
        {/* COLONNE GAUCHE : Sessions */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-3">Mes sessions ({sessions.length})</h5>
              {sessions.length === 0 ? (
                <p className="text-muted text-center py-3">Aucune session affectée.</p>
              ) : (
                <div className="list-group">
                  {sessions.map((s) => (
                    <button
                      key={s.id_session}
                      type="button"
                      onClick={() => ouvrirSession(s)}
                      className={`list-group-item list-group-item-action ${courante?.id_session === s.id_session ? 'active' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <strong className="mb-1">{s.formation}</strong>
                      </div>
                      <small className={courante?.id_session === s.id_session ? "text-white-50" : "text-muted"}>
                        Du {new Date(s.date_debut).toLocaleDateString('fr-FR')} au {new Date(s.date_fin).toLocaleDateString('fr-FR')}
                      </small>
                      <br />
                      <small className={courante?.id_session === s.id_session ? "text-white-50" : "text-muted"}>
                        {s.capacite_max - s.places_restantes} apprenant(s) inscrit(s)
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : Suivi et Détails */}
        <div className="col-12 col-lg-8">
          {courante ? (
            <>
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <h5 className="card-title fw-bold mb-0">Apprenants de « {courante.formation} »</h5>
                    
                    {/* BOUTONS D'EXPORT */}
                    {suivi && suivi.apprenants.length > 0 && (
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-outline-success btn-sm" onClick={exporterEnCSV}>
                          <i className="bi bi-file-earmark-spreadsheet me-1"></i> CSV
                        </button>
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={exporterEnPDF}>
                          <i className="bi bi-file-earmark-pdf me-1"></i> PDF
                        </button>
                      </div>
                    )}
                  </div>

                  {chargement ? (
                    <Loading texte="Chargement des apprenants..." />
                  ) : suivi.apprenants.length === 0 ? (
                    <p className="text-muted text-center py-4">Aucun apprenant inscrit à cette session.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Apprenant</th>
                            <th>Progression</th>
                            <th>À corriger</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {suivi.apprenants.map((a) => (
                            <tr key={a.id_inscription}>
                              <td className="fw-semibold">{a.prenom} {a.nom}</td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="progress flex-grow-1" style={{ height: "6px", minWidth: "80px" }}>
                                    <div 
                                      className={`progress-bar ${a.progression === 100 ? 'bg-success' : 'bg-primary'}`} 
                                      role="progressbar" 
                                      style={{ width: `${a.progression}%` }}
                                    ></div>
                                  </div>
                                  <span className="small fw-bold">{a.progression}%</span>
                                </div>
                              </td>
                              <td>
                                {a.soumissions_a_corriger > 0 ? (
                                  <span className="badge bg-danger rounded-pill">{a.soumissions_a_corriger}</span>
                                ) : (
                                  <span className="badge bg-secondary rounded-pill">0</span>
                                )}
                              </td>
                              <td className="text-end">
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-outline-primary" 
                                  onClick={() => ouvrirApprenant(a.id_inscription)}
                                >
                                  Détail
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION DÉTAIL */}
              {detail && (
                <div className="card shadow-sm border-0 border-start border-4 border-primary">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">
                        Détail : {detail.inscription.prenom} {detail.inscription.nom} ({detail.progression}%)
                      </h5>
                      <button type="button" className="btn-close" onClick={() => setDetail(null)}></button>
                    </div>
                    
                    {detail.modules.map((m) => (
                      <div key={m.id_module} className="mb-3 p-3 bg-light rounded">
                        <h6 className="fw-bold">
                          {m.titre} 
                          <span className={`badge ms-2 bg-${m.valide ? "success" : "warning"}`}>
                            {m.valide ? "Validé" : "Non validé"}
                          </span>
                        </h6>
                        <ul className="list-unstyled mb-0 mt-2">
                          {m.evaluations.map((e) => (
                            <li key={e.id_evaluation} className="small text-muted mb-1">
                              <i className="bi bi-dot"></i> {e.intitule} : 
                              {e.meilleur_score !== null && e.meilleur_score !== undefined && (
                                <span className="text-success fw-bold ms-1">QCM {e.meilleur_score}/{e.note_maximale}</span>
                              )}
                              {e.statut === "corrigee" ? (
                                <span className="text-primary fw-bold ms-1">PDF {e.note}/{e.note_maximale}</span>
                              ) : e.statut === "soumise" ? (
                                <span className="text-warning ms-1">PDF en attente</span>
                              ) : (
                                <span className="text-muted ms-1">PDF non déposé</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card shadow-sm border-0 h-100 d-flex align-items-center justify-content-center" style={{ minHeight: "300px" }}>
              <div className="text-center text-muted">
                <i className="bi bi-arrow-left-circle fs-1 mb-3"></i>
                <h5>Sélectionnez une session</h5>
                <p className="small">pour afficher la progression des apprenants</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}