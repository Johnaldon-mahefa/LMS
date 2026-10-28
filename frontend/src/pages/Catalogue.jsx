import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";

export default function Catalogue() {
  const toast = useToast();
  const confirmer = useConfirm();
  const navigate = useNavigate();

  const [formations, setFormations] = useState([]);
  const [mes, setMes] = useState([]);

  const charger = () => {
    api("/apprenant/catalogue").then(setFormations).catch((e) => toast.erreur(e.message));
    // On récupère les inscriptions de l'apprenant pour savoir où il en est
    api("/apprenant/inscriptions").then(setMes).catch(() => {});
  };
  
  useEffect(() => { charger(); }, []);

  async function demander(f, s) {
    const ok = await confirmer({
      titre: "Demander votre inscription ?",
      message: `Formation « ${f.intitule} », session du ${new Date(s.date_debut).toLocaleDateString('fr-FR')}. Votre demande sera examinée par l'administrateur.`,
      confirmer: "Envoyer la demande",
    });
    if (!ok) return;
    try {
      await api("/apprenant/inscriptions", { method: "POST", body: { idSession: s.id_session } });
      toast.ok("Demande envoyée avec succès.");
      charger(); // Recharger pour mettre à jour l'état du bouton
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h1 className="h3 fw-bold mb-0">Catalogue des formations</h1>
        <button className="btn-ghost" onClick={() => navigate("/mes-inscriptions")}>
          <i className="bi bi-card-checklist me-2"></i> Voir mes inscriptions ({mes.length})
        </button>
      </div>

      {formations.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <i className="bi bi-journal-x fs-1 text-muted mb-3 d-block"></i>
            <h5 className="text-muted">Aucune formation n'est publiée pour le moment.</h5>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {formations.map((f) => (
            <div key={f.id_formation} className="col-12 col-xl-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h4 className="fw-bold text-dark mb-2">{f.intitule}</h4>
                  <p className="text-muted small mb-4">
                    {f.description || "Aucune description fournie."} 
                    {f.duree && <span className="ms-2 badge bg-light text-dark border">{f.duree} heures</span>}
                  </p>

                  <h6 className="fw-bold text-muted small text-uppercase mb-3">Sessions disponibles</h6>
                  
                  {f.sessions.length === 0 ? (
                    <p className="text-muted small fst-italic">Aucune session ouverte pour cette formation.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-borderless align-middle mb-0">
                        <tbody>
                          {f.sessions.map((s) => {
                            // VÉRIFICATION : L'apprenant a-t-il déjà une inscription pour cette session ?
                            const monInscription = mes.find(m => m.id_session === s.id_session);
                            const estDejaInscrit = !!monInscription;
                            const statut = monInscription?.statut_inscription;

                            return (
                              <tr key={s.id_session} className="border-bottom">
                                <td className="ps-0 py-3">
                                  <div className="fw-semibold text-dark">
                                    Du {new Date(s.date_debut).toLocaleDateString('fr-FR')}
                                  </div>
                                  <div className="small text-muted">
                                    au {new Date(s.date_fin).toLocaleDateString('fr-FR')} • {s.places_restantes} place(s) restante(s)
                                  </div>
                                </td>
                                <td className="text-end pe-0 py-3" style={{ width: '220px' }}>
                                  
                                  {/* GESTION DES BOUTONS SELON L'ÉTAT */}
                                  {estDejaInscrit ? (
                                    <button 
                                      className={`btn w-100 ${statut === 'validee' ? 'btn-success' : 'btn-secondary'} py-2`} 
                                      disabled
                                    >
                                      {statut === 'validee' ? (
                                        <><i className="bi bi-check-circle me-1"></i> Déjà inscrit</>
                                      ) : (
                                        <><i className="bi bi-hourglass-split me-1"></i> En attente</>
                                      )}
                                    </button>
                                  ) : (
                                    <button 
                                      type="button" 
                                      className="btn btn-primary w-100 py-2 fw-semibold" 
                                      onClick={() => demander(f, s)}
                                      disabled={s.places_restantes <= 0}
                                    >
                                      <i className="bi bi-send me-1"></i> Demander mon inscription
                                    </button>
                                  )}
                                  
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}