import { useEffect, useState } from "react";
import { api, telecharger } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import Loading from "../components/Loading.jsx";

export default function Corrections() {
  const toast = useToast();
  const confirmer = useConfirm();

  const [liste, setListe] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [choisie, setChoisie] = useState(null);
  const [correction, setCorrection] = useState({ note: "", commentaire: "" });

  const charger = () => {
    const debut = Date.now();
    return api("/formateur/soumissions/a-corriger")
      .then((data) => {
        const restant = Math.max(0, 400 - (Date.now() - debut));
        setTimeout(() => { setListe(data); setChargement(false); }, restant);
      })
      .catch((e) => {
        const restant = Math.max(0, 400 - (Date.now() - debut));
        setTimeout(() => { toast.erreur(e.message); setChargement(false); }, restant);
      });
  };

  useEffect(() => { charger(); }, []);

  async function enregistrer(e) {
    e.preventDefault();
    const ok = await confirmer({
      titre: "Enregistrer cette correction ?",
      message: `Note : ${correction.note} / ${choisie.note_maximale}. Après validation, la note ne pourra plus être modifiée.`,
      confirmer: "Enregistrer",
    });
    if (!ok) return;
    try {
      await api(`/formateur/soumissions/${choisie.id_soumission}/correction`, {
        method: "PUT",
        body: correction,
      });
      toast.ok("Correction enregistrée.");
      setChoisie(null);
      setCorrection({ note: "", commentaire: "" });
      charger();
    } catch (err) {
      toast.erreur(err.message);
    }
  }

  async function telechargerTravail(s) {
    try {
      await telecharger(`/fichiers/soumissions/${s.id_soumission}`, s.nom_fichier);
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 fw-bold mb-4">Corriger les soumissions</h1>

      <div className="row g-4">
        {/* COLONNE GAUCHE : Liste des soumissions */}
        <div className="col-12 col-lg-4 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <h5 className="fw-bold mb-3 text-muted small text-uppercase">
                À corriger ({liste.length})
              </h5>
              
              {chargement ? (
                <Loading texte="Chargement…" />
              ) : liste.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-check2-circle fs-1 text-success mb-3 d-block"></i>
                  <h6 className="text-muted">Aucune soumission en attente.</h6>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {liste.map((s) => (
                    <button
                      key={s.id_soumission}
                      type="button"
                      onClick={() => { setChoisie(s); setCorrection({ note: "", commentaire: "" }); }}
                      className={`list-group-item list-group-item-action border-0 rounded mb-1 text-start ${
                        choisie?.id_soumission === s.id_soumission 
                          ? "active bg-primary text-white" 
                          : "bg-light text-dark"
                      }`}
                      style={{ transition: 'all 0.2s' }}
                    >
                      <div className="fw-bold">{s.prenom} {s.nom}</div>
                      <div className="small" style={{ opacity: 0.8 }}>{s.evaluation}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : Détail et Formulaire */}
        <div className="col-12 col-lg-8 col-xl-9">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              {choisie ? (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3 flex-wrap gap-2">
                    <h2 className="h4 fw-bold mb-0">
                      Correction : <span className="text-primary">{choisie.prenom} {choisie.nom}</span>
                    </h2>
                    <span className="badge bg-light text-dark border">
                      Note max : {choisie.note_maximale}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h6 className="fw-bold text-muted mb-1">
                      <i className="bi bi-journal-text me-1"></i> Évaluation
                    </h6>
                    <p className="fs-5 mb-1">{choisie.evaluation}</p>
                    {choisie.consigne && (
                      <p className="text-muted small mb-0">{choisie.consigne}</p>
                    )}
                  </div>

                  <div className="mb-5">
                    <button 
                      type="button" 
                      className="btn-ghost" 
                      onClick={() => telechargerTravail(choisie)}
                    >
                      <i className="bi bi-paperclip me-2"></i> Télécharger le travail ({choisie.nom_fichier})
                    </button>
                  </div>

                  <hr className="my-4 text-muted" />
                  
                  <h5 className="fw-bold mb-4">Grille d'évaluation</h5>
                  
                  <form onSubmit={enregistrer}>
                    <div className="row g-4">
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold text-muted">
                          Note obtenue (sur {choisie.note_maximale})
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max={choisie.note_maximale}
                          className="form-control form-control-lg"
                          value={correction.note}
                          onChange={(e) => setCorrection({ ...correction, note: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted">
                          Commentaire (optionnel)
                        </label>
                        <textarea
                          className="form-control"
                          rows={4}
                          placeholder="Ajoutez des remarques ou des conseils pour l'apprenant..."
                          value={correction.commentaire}
                          onChange={(e) => setCorrection({ ...correction, commentaire: e.target.value })}
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3">
                      <button type="submit" className="btn btn-primary px-4 py-2">
                        <i className="bi bi-check-lg me-2"></i> Enregistrer la correction
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-center text-muted py-5">
                  <div>
                    <i className="bi bi-arrow-left-circle fs-1 mb-3"></i>
                    <h5>Sélectionnez une soumission</h5>
                    <p className="small">à gauche pour commencer la correction.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}