import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, telecharger } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";

export default function Module() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirmer = useConfirm();

  const [m, setM] = useState(null);
  const [lecon, setLecon] = useState({ titre: "", contenu: "" });
  
  const [evaluation, setEvaluation] = useState({ 
    intitule: "", 
    consigne: "", 
    noteMaximale: 20,
    typeEvaluation: "fichier",
    dureeMinutes: "",
    seuilReussite: "",
    nbTentativesMax: 1
  });

  const charger = () =>
    api(`/formateur/modules/${id}`).then(setM).catch((e) => toast.erreur(e.message));

  useEffect(() => { charger(); }, [id]);

  async function agir(fn, texteOk) {
    try {
      await fn();
      toast.ok(texteOk);
      await charger();
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  if (!m) return <div className="p-5 text-center">Chargement...</div>;
  const lecture = !m.modifiable;

  async function confirmerSuppression(type, itemId, nom) {
    const ok = await confirmer({
      titre: `Supprimer ${type} ?`,
      message: `« ${nom} » sera supprimé définitivement.`,
      danger: true,
      confirmer: "Supprimer",
    });
    if (!ok) return;
    const urls = {
      module: `/formateur/modules/${itemId}`,
      lecon: `/formateur/lecons/${itemId}`,
      ressource: `/formateur/ressources/${itemId}`,
      evaluation: `/formateur/evaluations/${itemId}`,
    };
    try {
      await api(urls[type], { method: "DELETE" });
      toast.ok(`${type.charAt(0).toUpperCase() + type.slice(1)} supprimé.`);
      if (type === "module") navigate("/contenu");
      else charger();
    } catch (e) { toast.erreur(e.message); }
  }

  async function publier() {
    const ok = await confirmer({
      titre: "Publier ce module ?",
      message: "Les apprenants inscrits pourront consulter son contenu.",
      confirmer: "Publier",
    });
    if (!ok) return;
    agir(() => api(`/formateur/modules/${id}/publier`, { method: "PATCH" }), "Module publié.");
  }

  async function retirerPublication() {
    const ok = await confirmer({
      titre: "Retirer de la publication ?",
      message: "Le module ne sera plus visible des apprenants.",
      danger: true,
      confirmer: "Retirer",
    });
    if (!ok) return;
    agir(() => api(`/formateur/modules/${id}/retirer-publication`, { method: "PATCH" }), "Module retiré de la publication.");
  }

  async function telechargerRessource(r) {
    try {
      await telecharger(`/fichiers/ressources/${r.id_ressource}`, r.nom_fichier);
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <Link to="/contenu" className="text-decoration-none text-muted small">
          <i className="bi bi-arrow-left me-1"></i> Retour aux formations
        </Link>
        <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap">
          <div>
            <h1 className="h2 fw-bold mb-1">
              {m.titre} 
              <span className={`badge ms-2 ${m.statut_module === 'publie' ? 'bg-success' : 'bg-warning text-dark'}`}>
                {m.statut_module}
              </span>
            </h1>
            <p className="text-muted mb-0">{m.description}</p>
          </div>

          {!lecture && (
            <div className="d-flex gap-2">
              {m.statut_module === "brouillon" ? (
                <button type="button" className="btn btn-success" onClick={publier}>
                  <i className="bi bi-cloud-arrow-up me-1"></i> Publier le module
                </button>
              ) : (
                <button type="button" className="btn btn-outline-warning" onClick={retirerPublication}>
                  <i className="bi bi-eye-slash me-1"></i> Retirer de la publication
                </button>
              )}
              {m.statut_module === "brouillon" && (
                <button type="button" className="btn btn-outline-danger" onClick={() => confirmerSuppression("module", id, m.titre)}>
                  <i className="bi bi-trash me-1"></i> Supprimer le module
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Leçons ---------- */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3"><i className="bi bi-journal-text me-2"></i>Leçons</h5>
          
          {m.lecons.length === 0 ? (
            <p className="text-muted">Aucune leçon pour le moment.</p>
          ) : (
            <ul className="list-group list-group-flush mb-4">
              {m.lecons.map((l) => (
                <li key={l.id_lecon} className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span className="fw-semibold">{l.titre}</span>
                  {!lecture && (
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => confirmerSuppression("lecon", l.id_lecon, l.titre)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!lecture && (
            <div className="bg-light p-3 rounded border">
              <h6 className="fw-bold mb-3">Ajouter une nouvelle leçon</h6>
              <form onSubmit={(e) => { e.preventDefault(); agir(async () => { await api(`/formateur/modules/${id}/lecons`, { method: "POST", body: lecon }); setLecon({ titre: "", contenu: "" }); }, "Leçon ajoutée."); }}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Titre de la leçon</label>
                  <input className="form-control" value={lecon.titre} onChange={(e) => setLecon({ ...lecon, titre: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Contenu (Markdown supporté : # Titre, **gras**, - liste)</label>
                  <textarea 
                    className="form-control font-monospace" 
                    value={lecon.contenu} 
                    onChange={(e) => setLecon({ ...lecon, contenu: e.target.value })} 
                    rows={6}
                    placeholder="# Introduction&#10;Docker est un outil de **conteneurisation**."
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-1"></i> Ajouter la leçon
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Ressources ---------- */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3"><i className="bi bi-paperclip me-2"></i>Ressources</h5>
          
          {m.ressources.length === 0 ? (
            <p className="text-muted">Aucune ressource.</p>
          ) : (
            <div className="d-flex flex-wrap gap-2 mb-4">
              {m.ressources.map((r) => (
                <div key={r.id_ressource} className="d-flex align-items-center bg-light rounded px-3 py-2 border">
                  <i className="bi bi-file-earmark-arrow-down text-primary me-2 fs-5"></i>
                  <button type="button" className="btn btn-link p-0 text-decoration-none text-dark me-3" onClick={() => telechargerRessource(r)}>
                    {r.nom_fichier}
                  </button>
                  {!lecture && (
                    <button type="button" className="btn btn-sm text-danger p-0" onClick={() => confirmerSuppression("ressource", r.id_ressource, r.nom_fichier)}>
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!lecture && (
            <div className="bg-light p-3 rounded border">
              <form className="d-flex gap-2 align-items-center" onSubmit={(e) => { e.preventDefault(); const f = new FormData(); f.append("fichier", e.target.fichier.files[0]); agir(async () => { await api(`/formateur/modules/${id}/ressources`, { method: "POST", form: f }); e.target.reset(); }, "Ressource déposée."); }}>
                <input type="file" className="form-control form-control-sm" name="fichier" required />
                <button type="submit" className="btn btn-outline-primary btn-sm text-nowrap">
                  <i className="bi bi-upload me-1"></i> Déposer
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Évaluations ---------- */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3"><i className="bi bi-pencil-square me-2"></i>Évaluations</h5>
          
          {m.evaluations.length === 0 ? (
            <p className="text-muted">Aucune évaluation pour le moment.</p>
          ) : (
            <ul className="list-group list-group-flush mb-4">
              {m.evaluations.map((ev) => {
                const typeEval = ev.type_evaluation ? ev.type_evaluation.toLowerCase() : "fichier";
                return (
                  <li key={ev.id_evaluation} className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <div>
                      <strong className="me-2">{ev.intitule}</strong>
                      <span className={`badge bg-${typeEval === 'qcm' ? 'primary' : typeEval === 'mixte' ? 'info' : 'secondary'} me-2`}>
                        {typeEval.toUpperCase()}
                      </span>
                      <small className="text-muted">(Note max {ev.note_maximale}) {ev.consigne}</small>
                    </div>
                    <div className="d-flex gap-2">
                      {(typeEval === 'qcm' || typeEval === 'mixte') && (
                        <Link to={`/formateur/qcm/${ev.id_evaluation}`} className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-gear me-1"></i> Questions
                        </Link>
                      )}
                      {!lecture && (
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => confirmerSuppression("evaluation", ev.id_evaluation, ev.intitule)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!lecture && (
            <div className="bg-light p-3 rounded border">
              <h6 className="fw-bold mb-3">Créer une nouvelle évaluation</h6>
              <form className="row g-3" onSubmit={(e) => { 
                e.preventDefault(); 
                agir(async () => { 
                  await api(`/formateur/modules/${id}/evaluations`, { method: "POST", body: evaluation }); 
                  setEvaluation({ intitule: "", consigne: "", noteMaximale: 20, typeEvaluation: "fichier", dureeMinutes: "", seuilReussite: "", nbTentativesMax: 1 }); 
                }, "Évaluation créée."); 
              }}>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Intitulé</label>
                  <input className="form-control" value={evaluation.intitule} onChange={(e) => setEvaluation({ ...evaluation, intitule: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Type d'évaluation</label>
                  <select className="form-select" value={evaluation.typeEvaluation} onChange={(e) => setEvaluation({ ...evaluation, typeEvaluation: e.target.value })}>
                    <option value="fichier">Dépôt de fichier (PDF)</option>
                    <option value="qcm">QCM Interactif</option>
                    <option value="mixte">Mixte (PDF + QCM)</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Consigne</label>
                  <input className="form-control" value={evaluation.consigne} onChange={(e) => setEvaluation({ ...evaluation, consigne: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Note maximale</label>
                  <input type="number" min="1" className="form-control" value={evaluation.noteMaximale} onChange={(e) => setEvaluation({ ...evaluation, noteMaximale: e.target.value })} required />
                </div>

                {(evaluation.typeEvaluation === 'qcm' || evaluation.typeEvaluation === 'mixte') && (
                  <>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Durée (minutes)</label>
                      <input type="number" min="1" className="form-control" value={evaluation.dureeMinutes} onChange={(e) => setEvaluation({ ...evaluation, dureeMinutes: e.target.value })} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Seuil de réussite (%)</label>
                      <input type="number" min="0" max="100" className="form-control" value={evaluation.seuilReussite} onChange={(e) => setEvaluation({ ...evaluation, seuilReussite: e.target.value })} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Tentatives max</label>
                      <input type="number" min="1" className="form-control" value={evaluation.nbTentativesMax} onChange={(e) => setEvaluation({ ...evaluation, nbTentativesMax: e.target.value })} required />
                    </div>
                  </>
                )}

                <div className="col-12 mt-3">
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-plus-circle me-1"></i> Créer l'évaluation
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}