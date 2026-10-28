import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { exporterCSV, exporterPDF } from "../utils/export.js";
import Loading from "../components/Loading.jsx";

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
        <div className="col-12 col-lg-4 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <h5 className="fw-bold mb-3 text-muted small text-uppercase">
                Mes sessions ({sessions.length})
              </h5>
              
              {sessions.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-calendar-x fs-1 text-muted mb-3 d-block"></i>
                  <h6 className="text-muted">Aucune session affectée.</h6>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {sessions.map((s) => (
                    <button
                      key={s.id_session}
                      type="button"
                      onClick={() => ouvrirSession(s)}
                      className={`list-group-item list-group-item-action border-0 rounded mb-1 text-start ${
                        courante?.id_session === s.id_session 
                          ? "active bg-primary text-white" 
                          : "bg-light text-dark"
                      }`}
                      style={{ transition: 'all 0.2s' }}
                    >
                      <div className="fw-bold mb-1">{s.formation}</div>
                      <div className="small" style={{ opacity: 0.8 }}>
                        <i className="bi bi-calendar-event me-1"></i>
                        Du {new Date(s.date_debut).toLocaleDateString('fr-FR')} au {new Date(s.date_fin).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="small mt-1" style={{ opacity: 0.8 }}>
                        <i className="bi bi-people me-1"></i>
                        {s.capacite_max - s.places_restantes} apprenant(s) inscrit(s)
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : Suivi et Détails */}
        <div className="col-12 col-lg-8 col-xl-9">
          {courante ? (
            <>
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <h5 className="fw-bold mb-0">
                      Apprenants de <span className="text-primary">« {courante.formation} »</span>
                    </h5>
                    
                    {suivi && suivi.apprenants.length > 0 && (
                      <div className="d-flex gap-2">
                        <button type="button" className="btn-ghost" onClick={exporterEnCSV}>
                          <i className="bi bi-file-earmark-spreadsheet me-1"></i> CSV
                        </button>
                        <button type="button" className="btn-ghost" onClick={exporterEnPDF}>
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
                      <table className="table table-hover align-middle mb-0">
                        <thead className="text-muted small text-uppercase">
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
                              <td className="fw-bold text-dark">{a.prenom} {a.nom}</td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="progress flex-grow-1" style={{ height: "8px", borderRadius: "4px" }}>
                                    <div 
                                      className={`progress-bar ${a.progression === 100 ? 'bg-success' : 'bg-primary'}`} 
                                      role="progressbar" 
                                      style={{ width: `${a.progression}%`, borderRadius: "4px" }}
                                    ></div>
                                  </div>
                                  <span className="small fw-bold" style={{ minWidth: "35px" }}>{a.progression}%</span>
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
                                  className="btn-ghost" 
                                  onClick={() => ouvrirApprenant(a.id_inscription)}
                                >
                                  Détail <i className="bi bi-arrow-right ms-1"></i>
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
                <div className="card border-0 shadow-sm border-start border-4 border-primary">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-bold mb-0">
                        Détail : <span className="text-primary">{detail.inscription.prenom} {detail.inscription.nom}</span>
                        <span className="badge bg-light text-dark border ms-2">{detail.progression}%</span>
                      </h5>
                      <button type="button" className="btn-ghost-danger" onClick={() => setDetail(null)}>
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                    
                    <div className="row g-3">
                      {detail.modules.map((m) => (
                        <div key={m.id_module} className="col-12">
                          <div className={`p-3 rounded-3 border ${m.valide ? 'bg-success bg-opacity-10 border-success' : 'bg-light border-warning'}`}>
                            <h6 className="fw-bold mb-2 d-flex justify-content-between align-items-center">
                              {m.titre} 
                              <span className={`badge ${m.valide ? "bg-success" : "bg-warning text-dark"}`}>
                                {m.valide ? "Validé" : "Non validé"}
                              </span>
                            </h6>
                            <ul className="list-unstyled mb-0 mt-2 ms-1">
                              {m.evaluations.map((e) => (
                                <li key={e.id_evaluation} className="small text-muted mb-1 d-flex align-items-center flex-wrap gap-2">
                                  <span className="text-dark fw-semibold">{e.intitule}</span>
                                  <span>:</span>
                                  {e.meilleur_score !== null && e.meilleur_score !== undefined && (
                                    <span className="badge bg-primary bg-opacity-75 text-white">QCM {e.meilleur_score}/{e.note_maximale}</span>
                                  )}
                                  {e.statut === "corrigee" ? (
                                    <span className="badge bg-success">PDF {e.note}/{e.note_maximale}</span>
                                  ) : e.statut === "soumise" ? (
                                    <span className="badge bg-warning text-dark">PDF en attente</span>
                                  ) : (
                                    <span className="badge bg-secondary">PDF non déposé</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card border-0 shadow-sm h-100 d-flex align-items-center justify-content-center" style={{ minHeight: "300px" }}>
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