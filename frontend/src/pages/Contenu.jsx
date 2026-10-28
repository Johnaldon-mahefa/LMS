import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

export default function Contenu() {
  const toast = useToast();
  const [formations, setFormations] = useState([]);
  const [nouveau, setNouveau] = useState({});
  const [choisie, setChoisie] = useState(null);

  const charger = () =>
    api("/formateur/formations").then(setFormations).catch((e) => toast.erreur(e.message));

  useEffect(() => { charger(); }, []);

  async function creer(e, idFormation) {
    e.preventDefault();
    try {
      await api(`/formateur/formations/${idFormation}/modules`, {
        method: "POST",
        body: nouveau[idFormation],
      });
      toast.ok("Module créé au statut brouillon.");
      setNouveau({ ...nouveau, [idFormation]: { titre: "", description: "" } });
      charger();
    } catch (err) {
      toast.erreur(err.message);
    }
  }

  const courante = choisie ?? formations[0]?.id_formation ?? null;
  const formationCourante = formations.find((f) => f.id_formation === courante);

  if (formations.length === 0) {
    return (
      <div className="container-fluid py-4">
        <h1 className="h3 fw-bold mb-4">Gérer le contenu pédagogique</h1>
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <i className="bi bi-journal-x fs-1 text-muted mb-3 d-block"></i>
            <h5 className="text-muted">Aucune session ne vous est affectée pour le moment.</h5>
            <p className="text-muted small">Contactez l'administrateur pour être affecté à une session.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 fw-bold mb-4">Gérer le contenu pédagogique</h1>

      <div className="row g-4">
        {/* COLONNE GAUCHE : Liste des formations + Formulaire */}
        <div className="col-12 col-lg-4 col-xl-3">
          
          {/* Liste des formations */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-3">
              <h5 className="fw-bold mb-3 text-muted small text-uppercase">Mes formations</h5>
              <div className="list-group list-group-flush">
                {formations.map((f) => (
                  <button
                    key={f.id_formation}
                    type="button"
                    onClick={() => setChoisie(f.id_formation)}
                    className={`list-group-item list-group-item-action border-0 rounded mb-1 text-start ${
                      courante === f.id_formation ? "active bg-primary text-white fw-bold" : "bg-light text-dark"
                    }`}
                    style={{ transition: 'all 0.2s' }}
                  >
                    {f.intitule}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Formulaire de création */}
          {formationCourante && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3 text-muted small text-uppercase">Nouveau module</h5>
                <form onSubmit={(e) => creer(e, formationCourante.id_formation)}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Titre</label>
                    <input
                      className="form-control"
                      placeholder="Ex: Introduction à React"
                      value={nouveau[formationCourante.id_formation]?.titre || ""}
                      onChange={(e) =>
                        setNouveau({
                          ...nouveau,
                          [formationCourante.id_formation]: {
                            ...nouveau[formationCourante.id_formation],
                            titre: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Brève description du module..."
                      value={nouveau[formationCourante.id_formation]?.description || ""}
                      onChange={(e) =>
                        setNouveau({
                          ...nouveau,
                          [formationCourante.id_formation]: {
                            ...nouveau[formationCourante.id_formation],
                            description: e.target.value,
                          },
                        })
                      }
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="bi bi-plus-lg me-1"></i> Créer le module
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* COLONNE DROITE : Liste des modules */}
        <div className="col-12 col-lg-8 col-xl-9">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              {formationCourante ? (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                    <h2 className="h4 fw-bold mb-0">
                      Modules de <span className="text-primary">« {formationCourante.intitule} »</span>
                    </h2>
                    <span className="badge bg-light text-dark border fs-6">
                      {formationCourante.modules.length} module(s)
                    </span>
                  </div>

                  {formationCourante.modules.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-folder-plus fs-1 text-muted mb-3 d-block"></i>
                      <h5 className="text-muted">Aucun module pour le moment.</h5>
                      <p className="text-muted small">Utilisez le formulaire à gauche pour créer votre premier module.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="text-muted small text-uppercase">
                          <tr>
                            <th>Titre du module</th>
                            <th>Statut</th>
                            <th>Accès</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formationCourante.modules.map((m) => (
                            <tr key={m.id_module}>
                              <td>
                                <div className="fw-bold text-dark">{m.titre}</div>
                              </td>
                              <td>
                                <span className={`etiquette ${m.statut_module}`}>
                                  {m.statut_module}
                                </span>
                              </td>
                              <td>
                                <span className="text-muted small">
                                  {m.modifiable ? (
                                    <><i className="bi bi-pencil-square me-1"></i> Modifiable</>
                                  ) : (
                                    <><i className="bi bi-lock me-1"></i> Lecture seule</>
                                  )}
                                </span>
                              </td>
                              <td className="text-end">
                                <Link to={`/contenu/${m.id_module}`} className="btn-ghost text-decoration-none">
                                  Ouvrir <i className="bi bi-arrow-right ms-1"></i>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-center text-muted py-5">
                  <div>
                    <i className="bi bi-arrow-left-circle fs-1 mb-3"></i>
                    <h5>Sélectionnez une formation</h5>
                    <p className="small">pour voir ses modules.</p>
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