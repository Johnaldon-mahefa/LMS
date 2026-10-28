import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, telecharger } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import ReactMarkdown from "react-markdown";

/* ============================================================
   Liste des formations suivies.
   ============================================================ */
export function MesFormations() {
  const toast = useToast();
  const [liste, setListe] = useState([]);

  useEffect(() => {
    api("/apprenant/formations").then(setListe).catch((e) => toast.erreur(e.message));
  }, []);

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 fw-bold mb-4">Mes formations</h1>
      {liste.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <i className="bi bi-mortarboard fs-1 text-muted mb-3 d-block"></i>
            <h5 className="text-muted">Aucune inscription validée.</h5>
            <p className="small mb-0">Rendez-vous dans le catalogue pour demander une inscription.</p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {liste.map((i) => (
            <div key={i.id_inscription} className="col-12 col-md-6 col-xl-4">
              <div className="card h-100 border-0 shadow-sm hover-shadow d-flex flex-column">
                <div className="card-body p-4 flex-grow-1">
                  <h5 className="card-title fw-bold text-dark mb-2">{i.formation}</h5>
                  <p className="text-muted small mb-4">
                    <i className="bi bi-calendar-event me-1"></i> Début : {new Date(i.date_debut).toLocaleDateString('fr-FR')}
                  </p>
                  
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted small fw-semibold">Progression</span>
                    <span className={`badge ${i.progression === 100 ? 'bg-success' : 'bg-primary'}`}>{i.progression}%</span>
                  </div>
                  <div className="progress" style={{ height: "10px", borderRadius: "5px" }}>
                    <div 
                      className={`progress-bar ${i.progression === 100 ? 'bg-success' : 'bg-primary'}`} 
                      role="progressbar" 
                      style={{ width: `${i.progression}%`, borderRadius: "5px" }} 
                    ></div>
                  </div>
                </div>
                <div className="card-footer bg-transparent border-top-0 p-4 pt-0">
                  <Link to={`/mes-formations/${i.id_inscription}`} className="btn btn-primary w-100">
                    {i.progression === 0 ? "Commencer" : i.progression === 100 ? "Revoir le cours" : "Continuer"} <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Contenu d'une formation suivie.
   ============================================================ */
export function ContenuFormation() {
  const { id } = useParams();
  const toast = useToast();
  const confirmer = useConfirm();
  const { aAcces } = useAuth();
  const [c, setC] = useState(null);

  const charger = () => api(`/apprenant/inscriptions/${id}/contenu`).then(setC).catch((e) => toast.erreur(e.message));

  useEffect(() => { charger(); }, [id]);

  async function deposer(e, idEvaluation) {
    e.preventDefault();
    const fichier = e.target.fichier.files[0];
    if (!fichier) return toast.erreur("Choisissez un fichier.");
    const ok = await confirmer({ titre: "Confirmer le dépôt ?", message: "Après le dépôt, votre travail ne pourra plus être modifié.", confirmer: "Déposer" });
    if (!ok) return;
    const f = new FormData();
    f.append("fichier", fichier);
    f.append("idInscription", id);
    try {
      await api(`/apprenant/evaluations/${idEvaluation}/soumissions`, { method: "POST", form: f });
      toast.ok("Travail déposé.");
      charger();
    } catch (err) { toast.erreur(err.message); }
  }

  async function telechargerRessource(r) {
    try { await telecharger(`/fichiers/ressources/${r.id_ressource}`, r.nom_fichier); } catch (e) { toast.erreur(e.message); }
  }

  const scrollToModule = (index) => {
    const element = document.getElementById(`module-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!c) return <div className="p-5 text-center text-muted">Chargement...</div>;

  return (
    <div className="container py-4" style={{ maxWidth: '900px' }}>
      <div className="mb-4 pb-3 border-bottom">
        <Link to="/mes-formations" className="text-decoration-none text-muted small fw-semibold">
          <i className="bi bi-arrow-left me-1"></i> Retour à mes formations
        </Link>
        <h1 className="h3 fw-bold mt-3 text-primary">{c.inscription.formation}</h1>
      </div>

      {c.modules.length === 0 && <div className="alert alert-warning border-0 shadow-sm">Aucun module n'est encore publié.</div>}

      {c.modules.map((m, index) => (
        <div 
          key={m.id_module} 
          id={`module-${index}`} 
          className="card border-0 shadow-sm mb-5"
          style={{ scrollMarginTop: '90px' }}
        >
          <div className="card-header bg-white border-bottom pt-4 pb-3 px-4">
            <span className="badge bg-primary mb-2">Module {index + 1}</span>
            <h3 className="fw-bold text-dark mb-0">{m.titre}</h3>
            {m.description && <p className="text-muted mb-0 mt-1 small">{m.description}</p>}
          </div>

          <div className="card-body p-4">
            {m.lecons.map((l) => (
              <div key={l.id_lecon} className="mb-5">
                <h4 className="fw-bold mb-3 text-dark">{l.titre}</h4>
                <div className="markdown-content">
                  <ReactMarkdown>{l.contenu || ""}</ReactMarkdown>
                </div>
              </div>
            ))}

            {m.ressources.length > 0 && (
              <div className="mt-4 pt-4 border-top">
                <h6 className="fw-bold text-muted small text-uppercase mb-3"><i className="bi bi-paperclip me-2"></i>Ressources</h6>
                <div className="d-flex flex-wrap gap-2">
                  {m.ressources.map((r) => (
                    <button key={r.id_ressource} className="btn-ghost btn-sm" onClick={() => telechargerRessource(r)}>
                      <i className="bi bi-file-earmark-arrow-down me-1"></i> {r.nom_fichier}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {m.evaluations.length > 0 && (
            <div className="card-footer bg-light border-top p-4">
              <h5 className="fw-bold mb-4 text-dark"><i className="bi bi-pencil-square me-2 text-primary"></i>Évaluations</h5>
              <div className="row g-3">
                {m.evaluations.map((e) => {
                  const typeEval = e.type_evaluation ? e.type_evaluation.toLowerCase() : "fichier";
                  const aQcmAccess = aAcces('QCM');

                  if (typeEval === 'qcm' && !aQcmAccess) return null;

                  return (
                    <div key={e.id_evaluation} className="col-12 col-md-6">
                      <div className="card border-0 shadow-sm h-100 bg-white">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <strong className="text-dark">{e.intitule}</strong>
                            <span className={`badge bg-${typeEval === 'qcm' ? 'primary' : typeEval === 'mixte' ? 'info' : 'secondary'}`}>
                              {typeEval.toUpperCase()}
                            </span>
                          </div>
                          
                          {e.meilleur_score !== null && e.meilleur_score !== undefined && (
                            <div className="alert alert-success py-2 px-3 small mb-3 border-0">
                              <i className="bi bi-check-circle-fill me-1"></i> Score : <strong>{e.meilleur_score} / {e.note_maximale}</strong>
                            </div>
                          )}

                          {(typeEval === 'qcm' || typeEval === 'mixte') && aQcmAccess && (
                            <Link to={`/apprenant/qcm/${e.id_evaluation}`} className="btn btn-primary btn-sm w-100 mb-2">
                              {e.meilleur_score !== null ? "Repasser le QCM" : "Passer le QCM"}
                            </Link>
                          )}

                          {(typeEval === 'fichier' || typeEval === 'mixte') && (
                            e.soumission ? (
                              <div className="alert alert-secondary py-2 px-3 small mb-0 border-0">
                                Déposé le {new Date(e.soumission.date_depot).toLocaleDateString()} <br/>
                                {e.soumission.statut_soumission === "corrigee" 
                                  ? <span className="text-success fw-bold">Note : {e.soumission.note} / {e.note_maximale}</span> 
                                  : <span className="text-warning fw-bold">En attente de correction</span>}
                              </div>
                            ) : (
                              <form onSubmit={(ev) => deposer(ev, e.id_evaluation)}>
                                <div className="input-group input-group-sm">
                                  <input type="file" className="form-control" name="fichier" required />
                                  <button className="btn btn-outline-primary" type="submit">Envoyer</button>
                                </div>
                              </form>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card-footer bg-white text-center p-4 border-top">
            {index < c.modules.length - 1 ? (
              <button 
                type="button" 
                onClick={() => scrollToModule(index + 1)} 
                className="btn btn-primary rounded-pill px-5"
              >
                Module suivant <i className="bi bi-arrow-down ms-2"></i>
              </button>
            ) : (
              <div>
                <p className="text-success fw-bold mb-3"> Félicitations, vous avez terminé tous les modules !</p>
                <Link to="/mes-formations">
                  <button type="button" className="btn-ghost rounded-pill px-4">
                    Retour à mes formations
                  </button>
                </Link>
              </div>
            )}
          </div>

        </div>
      ))}
    </div>
  );
}