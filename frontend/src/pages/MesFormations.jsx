import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, telecharger } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
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
    <div className="container py-4">
      <h1 className="h3 fw-bold mb-4">Mes formations</h1>
      {liste.length === 0 ? (
        <div className="alert alert-info text-center py-4">
          Aucune inscription validée. Demandez votre inscription depuis le catalogue.
        </div>
      ) : (
        <div className="row g-4">
          {liste.map((i) => (
            <div key={i.id_inscription} className="col-12 col-md-6 col-lg-4">
              <Link to={`/mes-formations/${i.id_inscription}`} className="text-decoration-none">
                <div className="card h-100 shadow-sm border-0 hover-shadow">
                  <div className="card-body">
                    <h5 className="card-title fw-bold text-dark mb-2">{i.formation}</h5>
                    <p className="text-muted small mb-4">
                      <i className="bi bi-calendar-event me-1"></i> Session du {new Date(i.date_debut).toLocaleDateString()}
                    </p>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small fw-semibold">Progression</span>
                      <span className="text-primary fw-bold">{i.progression}%</span>
                    </div>
                    <div className="progress" style={{ height: "8px" }}>
                      <div 
                        className="progress-bar bg-primary" 
                        role="progressbar" 
                        style={{ width: `${i.progression}%` }} 
                        aria-valuenow={i.progression} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Contenu d'une formation suivie (Leçons -> Évaluations -> Suivant).
   ============================================================ */
export function ContenuFormation() {
  const { id } = useParams();
  const toast = useToast();
  const confirmer = useConfirm();
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

  // Fonction pour scroller vers le module suivant
  const scrollToModule = (index) => {
    const element = document.getElementById(`module-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!c) return <div className="p-5 text-center text-muted">Chargement...</div>;

  return (
    <div className="container py-4" style={{ maxWidth: '900px' }}>
      <div className="mb-4">
        <Link to="/mes-formations" className="text-decoration-none text-muted small">
          <i className="bi bi-arrow-left me-1"></i> Retour à mes formations
        </Link>
        <h1 className="h3 fw-bold mt-2">{c.inscription.formation}</h1>
      </div>

      {c.modules.length === 0 && <div className="alert alert-warning">Aucun module n'est encore publié.</div>}

      {c.modules.map((m, index) => (
        <div 
          key={m.id_module} 
          id={`module-${index}`} 
          className="card shadow-sm border-0 mb-5"
          style={{ scrollMarginTop: '80px' }} // Evite que le titre soit caché sous une barre de nav
        >
          {/* EN-TÊTE DU MODULE */}
          <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
            <span className="badge bg-secondary mb-2">Module {index + 1}</span>
            <h3 className="fw-bold text-primary mb-1">{m.titre}</h3>
            {m.description && <p className="text-muted mb-0">{m.description}</p>}
          </div>

          <div className="card-body">
            {/* LEÇONS (MARKDOWN) */}
            {m.lecons.map((l) => (
              <div key={l.id_lecon} className="mb-5">
                <h4 className="fw-bold border-bottom pb-2 mb-3">{l.titre}</h4>
                <div className="markdown-content">
                  <ReactMarkdown>{l.contenu || ""}</ReactMarkdown>
                </div>
              </div>
            ))}

            {/* RESSOURCES */}
            {m.ressources.length > 0 && (
              <div className="mt-4 pt-3 border-top">
                <h6 className="fw-bold text-muted mb-3"><i className="bi bi-paperclip me-2"></i>Ressources téléchargeables</h6>
                <div className="d-flex flex-wrap gap-2">
                  {m.ressources.map((r) => (
                    <button 
                      key={r.id_ressource} 
                      className="btn btn-outline-secondary btn-sm" 
                      onClick={() => telechargerRessource(r)}
                    >
                      <i className="bi bi-file-earmark-arrow-down me-1"></i> {r.nom_fichier}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ÉVALUATIONS (En bas du module) */}
          {m.evaluations.length > 0 && (
            <div className="card-footer bg-light border-top p-4">
              <h5 className="fw-bold mb-4"><i className="bi bi-pencil-square me-2"></i>Évaluations de ce module</h5>
              <div className="row g-3">
                {m.evaluations.map((e) => {
                  const typeEval = e.type_evaluation ? e.type_evaluation.toLowerCase() : "fichier";
                  return (
                    <div key={e.id_evaluation} className="col-12 col-md-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <strong className="text-dark">{e.intitule}</strong>
                            <span className={`badge bg-${typeEval === 'qcm' ? 'primary' : typeEval === 'mixte' ? 'info' : 'secondary'}`}>
                              {typeEval.toUpperCase()}
                            </span>
                          </div>
                          
                          {e.meilleur_score !== null && e.meilleur_score !== undefined && (
                            <div className="alert alert-success py-1 px-2 small mb-3">
                              <i className="bi bi-check-circle-fill me-1"></i> Score QCM : {e.meilleur_score} / {e.note_maximale}
                            </div>
                          )}

                          {(typeEval === 'qcm' || typeEval === 'mixte') && (
                            <Link to={`/apprenant/qcm/${e.id_evaluation}`} className="btn btn-primary btn-sm w-100 mb-2">
                              {e.meilleur_score !== null ? "Repasser le QCM" : "Passer le QCM"}
                            </Link>
                          )}

                          {(typeEval === 'fichier' || typeEval === 'mixte') && (
                            e.soumission ? (
                              <div className="alert alert-secondary py-1 px-2 small mb-0">
                                Déposé le {new Date(e.soumission.date_depot).toLocaleDateString()} <br/>
                                {e.soumission.statut_soumission === "corrigee" ? `Note : ${e.soumission.note} / ${e.note_maximale}` : "En attente"}
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

          {/* BOUTON CONTINUER */}
          <div className="text-center p-4">
            {index < c.modules.length - 1 ? (
              <button 
                type="button" 
                onClick={() => scrollToModule(index + 1)} 
                className="btn btn-primary rounded-pill px-5 py-2 fw-bold"
              >
                Continuer vers le module suivant <i className="bi bi-arrow-down ms-2"></i>
              </button>
            ) : (
              <div>
                <p className="text-success fw-bold mb-2"> Félicitations, vous avez terminé tous les modules !</p>
                <Link to="/mes-formations">
                  <button type="button" className="btn btn-outline-primary rounded-pill px-4">
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