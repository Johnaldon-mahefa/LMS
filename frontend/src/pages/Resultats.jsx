import { useEffect, useState } from "react";
import { api, telecharger } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Resultats() {
  const toast = useToast();
  const confirmer = useConfirm();
  const { aAcces } = useAuth();

  const [liste, setListe] = useState([]);
  const [courante, setCourante] = useState(null);
  const [r, setR] = useState(null);

  useEffect(() => {
    api("/apprenant/formations")
      .then((data) => {
        setListe(data);
        if (data[0]) setCourante(data[0].id_inscription);
      })
      .catch((e) => toast.erreur(e.message));
  }, []);

  useEffect(() => {
    if (!courante) return;
    api(`/apprenant/inscriptions/${courante}/resultats`)
      .then(setR)
      .catch((e) => toast.erreur(e.message));
  }, [courante]);

  async function demanderAttestation() {
    const ok = await confirmer({
      titre: "Demander votre attestation ?",
      message: `Une attestation numérotée sera générée pour la formation « ${r.inscription.formation} ».`,
      confirmer: "Obtenir l'attestation",
    });
    if (!ok) return;
    try {
      await api(`/apprenant/inscriptions/${courante}/attestation`, { method: "POST" });
      toast.ok("Félicitations ! Votre attestation est délivrée.");
      const data = await api(`/apprenant/inscriptions/${courante}/resultats`);
      setR(data);
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  async function telechargerAttestation() {
    try {
      await telecharger(
        `/apprenant/inscriptions/${courante}/attestation/pdf`,
        `${r.attestation.numero_attestation}.pdf`
      );
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 fw-bold mb-4">Mes résultats</h1>

      {liste.length === 0 ? (
        <div className="alert alert-info text-center py-4 border-0 shadow-sm">
          Aucune inscription validée pour le moment.
        </div>
      ) : (
        <div className="row g-4">
          
          <div className="col-12 col-lg-4 col-xl-3">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: "90px" }}>
              <div className="card-body p-3">
                <h5 className="fw-bold mb-3 text-muted small text-uppercase">Mes formations</h5>
                <div className="list-group list-group-flush">
                  {liste.map((i) => (
                    <button
                      key={i.id_inscription}
                      type="button"
                      onClick={() => setCourante(i.id_inscription)}
                      className={`list-group-item list-group-item-action border-0 rounded mb-1 text-start ${
                        courante === i.id_inscription ? "active bg-primary text-white fw-bold" : "bg-light text-dark"
                      }`}
                      style={{ transition: 'all 0.2s' }}
                    >
                      {i.formation}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8 col-xl-9">
            {r ? (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                  
                  <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <h2 className="h4 fw-bold mb-0 text-dark">{r.inscription.formation}</h2>
                    <span className={`badge fs-6 px-3 py-2 ${r.progression === 100 ? 'bg-success' : 'bg-primary'}`}>
                      {r.progression} % complété
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="progress" style={{ height: "10px", borderRadius: "5px" }}>
                      <div 
                        className={`progress-bar ${r.progression === 100 ? 'bg-success' : 'bg-primary'}`} 
                        role="progressbar" 
                        style={{ width: `${r.progression}%`, borderRadius: "5px" }}
                      ></div>
                    </div>
                    <p className="text-muted small mt-2 mb-0">
                      <i className="bi bi-info-circle me-1"></i> Seuil de réussite d'un module : {r.seuil} % de moyenne.
                    </p>
                  </div>

                  <hr className="my-4 text-muted" />

                  <h5 className="fw-bold mb-4 text-dark">Détail par module</h5>
                  
                  <div className="row g-3">
                    {r.modules.map((m) => (
                      <div key={m.id_module} className="col-12">
                        <div className={`p-3 rounded-3 border ${m.valide ? 'bg-success bg-opacity-10 border-success' : 'bg-light border-warning'}`}>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0 text-dark">{m.titre}</h6>
                            <span className={`badge ${m.valide ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {m.valide ? <><i className="bi bi-check-circle me-1"></i> Validé</> : <><i className="bi bi-exclamation-circle me-1"></i> Non validé</>}
                            </span>
                          </div>
                          
                          <ul className="list-unstyled mb-0 ms-1">
                            {m.evaluations
                              .filter((e) => {
                                const typeEval = e.type_evaluation ? e.type_evaluation.toLowerCase() : "fichier";
                                if ((typeEval === 'qcm' || typeEval === 'mixte') && !aAcces('QCM')) return false;
                                return true;
                              })
                              .map((e) => {
                                let statutIcone = "";
                                let statutTexte = "";
                                let couleurTexte = "";

                                if (e.statut === "corrigee") {
                                  statutIcone = <i className="bi bi-check-circle-fill text-success me-1"></i>;
                                  statutTexte = `Note : ${e.note} / ${e.note_maximale}`;
                                  couleurTexte = "text-success fw-bold";
                                } else if (e.statut === "soumise") {
                                  statutIcone = <i className="bi bi-clock-history text-warning me-1"></i>;
                                  statutTexte = "En attente";
                                  couleurTexte = "text-warning fw-bold";
                                } else {
                                  statutIcone = <i className="bi bi-x-circle text-muted me-1"></i>;
                                  statutTexte = "Non déposé";
                                  couleurTexte = "text-muted fw-semibold";
                                }

                                return (
                                  <li key={e.id_evaluation} className="d-flex align-items-center mb-2 small">
                                    <span className="text-dark fw-semibold me-2" style={{ minWidth: "150px" }}>{e.intitule} :</span>
                                    <span className={couleurTexte}>{statutIcone} {statutTexte}</span>
                                    
                                    {aAcces('QCM') && e.meilleur_score !== null && e.meilleur_score !== undefined && (
                                      <span className="badge bg-secondary ms-2">QCM : {e.meilleur_score}/{e.note_maximale}</span>
                                    )}
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  {aAcces('ATTESTATION') && (
                    <div className="mt-5 p-4 rounded-4 bg-light text-center border border-2" style={{ borderStyle: 'dashed !important' }}>
                      <h5 className="fw-bold mb-3"><i className="bi bi-award me-2 text-warning fs-4"></i>Attestation</h5>
                      
                      {r.attestation ? (
                        <div>
                          <p className="text-success fw-bold mb-3">Félicitations, votre attestation est disponible !</p>
                          <button type="button" className="btn btn-success px-5" onClick={telechargerAttestation}>
                            <i className="bi bi-file-earmark-pdf me-2"></i> Télécharger mon attestation
                          </button>
                        </div>
                      ) : (
                        <div>
                          <button 
                            type="button" 
                            className="btn btn-primary px-5" 
                            onClick={demanderAttestation}
                            disabled={!r.eligible}
                          >
                            <i className="bi bi-download me-2"></i> Obtenir mon attestation
                          </button>
                          {!r.eligible && (
                            <p className="text-muted small mt-3 mb-0">
                              <i className="bi bi-lock me-1"></i> Disponible lorsque tous les modules seront validés.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="card border-0 shadow-sm h-100 d-flex align-items-center justify-content-center" style={{ minHeight: "300px" }}>
                <div className="text-center text-muted">
                  <i className="bi bi-arrow-left-circle fs-1 mb-3"></i>
                  <h5>Sélectionnez une formation</h5>
                  <p className="small">pour voir vos résultats et votre attestation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}