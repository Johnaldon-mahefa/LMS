import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import Loading from "../components/Loading.jsx";

export default function Formations() {
  const toast = useToast();
  const confirmer = useConfirm();

  const [formations, setFormations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [formateurs, setFormateurs] = useState([]);
  const [ouverte, setOuverte] = useState(null);
  const [sessions, setSessions] = useState([]);
  
  // État pour la création
  const [form, setForm] = useState({ intitule: "", description: "", duree: "", publicVise: "" });
  const [afficherForm, setAfficherForm] = useState(false);
  
  // État pour la session et la modification
  const [session, setSession] = useState({ dateDebut: "", dateFin: "", capaciteMax: "" });
  const [modif, setModif] = useState(null);
  
  // États pour les filtres
  const [filtre, setFiltre] = useState("toutes");
  const [recherche, setRecherche] = useState("");

  const charger = () => {
    const debut = Date.now();
    return api("/admin/formations")
      .then((data) => {
        const restant = Math.max(0, 400 - (Date.now() - debut));
        setTimeout(() => { setFormations(data); setChargement(false); }, restant);
      })
      .catch((e) => {
        const restant = Math.max(0, 400 - (Date.now() - debut));
        setTimeout(() => { toast.erreur(e.message); setChargement(false); }, restant);
      });
  };

  const chargerSessions = (id) => api(`/admin/formations/${id}`).then((d) => setSessions(d.sessions));

  useEffect(() => {
    charger();
    api("/utilisateurs").then((u) =>
      setFormateurs(u.filter((x) => x.roles.includes("formateur") && x.statut_compte === "actif"))
    );
  }, []);

  const listeFiltree = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return formations.filter((f) => {
      if (filtre !== "toutes" && f.statut_formation !== filtre) return false;
      if (!q) return true;
      return `${f.intitule} ${f.description || ""}`.toLowerCase().includes(q);
    });
  }, [formations, filtre, recherche]);

  const compte = (statut) => formations.filter((f) => f.statut_formation === statut).length;

  async function agir(fn, texteOk) {
    try {
      await fn();
      toast.ok(texteOk);
      await charger();
      if (ouverte) await chargerSessions(ouverte);
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  const ouvrir = (id) => {
    setOuverte(ouverte === id ? null : id);
    if (ouverte !== id) chargerSessions(id);
  };

  function ouvrirModif(f) {
    setModif({ id: f.id_formation, intitule: f.intitule, description: f.description || "", duree: f.duree || "", publicVise: f.public_vise || "" });
  }
  
  async function enregistrerModif(e) {
    e.preventDefault();
    try {
      await api(`/admin/formations/${modif.id}`, {
        method: "PUT",
        body: { intitule: modif.intitule, description: modif.description, duree: modif.duree, publicVise: modif.publicVise },
      });
      toast.ok("Formation modifiée.");
      setModif(null);
      charger();
    } catch (err) { toast.erreur(err.message); }
  }

  async function supprimerFormation(f) {
    const ok = await confirmer({ titre: "Supprimer cette formation ?", message: `« ${f.intitule} » sera supprimée définitivement.`, danger: true, confirmer: "Supprimer" });
    if (!ok) return;
    agir(() => api(`/admin/formations/${f.id_formation}`, { method: "DELETE" }), "Formation supprimée.");
  }
  
  async function supprimerSession(s) {
    const ok = await confirmer({ titre: "Supprimer cette session ?", message: "Une session qui possède des inscriptions ne peut pas être supprimée.", danger: true, confirmer: "Supprimer" });
    if (!ok) return;
    agir(() => api(`/admin/sessions/${s.id_session}`, { method: "DELETE" }), "Session supprimée.");
  }

  return (
    <div className="container-fluid py-4">
      
      {/* EN-TÊTE */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h1 className="h3 fw-bold mb-0">Organiser les formations</h1>
        <button className="btn btn-primary" onClick={() => setAfficherForm(true)}>
          <i className="bi bi-plus-lg me-2"></i> Nouvelle formation
        </button>
      </div>

      {/* FILTRES */}
      <div className="filtres-haut mb-4">
        <button type="button" onClick={() => setFiltre("toutes")} className={filtre === "toutes" ? "actif" : ""}>Toutes ({formations.length})</button>
        <button type="button" onClick={() => setFiltre("brouillon")} className={filtre === "brouillon" ? "actif" : ""}>Brouillons ({compte("brouillon")})</button>
        <button type="button" onClick={() => setFiltre("publiee")} className={filtre === "publiee" ? "actif" : ""}>Publiées ({compte("publiee")})</button>
        <button type="button" onClick={() => setFiltre("archivee")} className={filtre === "archivee" ? "actif" : ""}>Archivées ({compte("archivee")})</button>
        <input type="search" placeholder="Rechercher par intitulé..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
      </div>

      {/* GRILLE DE CARTES */}
      {chargement ? (
        <Loading texte="Chargement des formations…" />
      ) : listeFiltree.length === 0 ? (
        <div className="text-center p-5 bg-white rounded-4 border">
          <i className="bi bi-folder-x fs-1 text-muted mb-3 d-block"></i>
          <h5 className="text-muted">Aucune formation trouvée.</h5>
        </div>
      ) : (
        <div className="row g-4">
          {listeFiltree.map((f) => (
            <div key={f.id_formation} className={ouverte === f.id_formation ? "col-12" : "col-12 col-md-6 col-xl-4"}>
              <div className="card h-100 border-0 shadow-sm hover-shadow">
                <div className="card-body p-4 d-flex flex-column">
                  
                  {/* Statut + Titre */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className={`etiquette ${f.statut_formation}`}>{f.statut_formation}</span>
                  </div>
                  <h4 className="fw-bold mb-2 text-dark">{f.intitule}</h4>
                  <p className="text-muted small mb-3">
                    <i className="bi bi-calendar-event me-1"></i> {f.nb_sessions} session(s) • <i className="bi bi-collection-play ms-2 me-1"></i> {f.nb_modules_publies}/{f.nb_modules} module(s) publié(s)
                  </p>

                  {/* Boutons d'action (Ghost) */}
                  <div className="d-flex flex-wrap gap-2 mt-auto pt-3 border-top">
                    <button type="button" className="btn-ghost" onClick={() => ouvrir(f.id_formation)}>
                      <i className="bi bi-calendar-event me-1"></i> {ouverte === f.id_formation ? "Masquer" : "Sessions"}
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => ouvrirModif(f)}>
                      <i className="bi bi-pencil me-1"></i> Modifier
                    </button>
                    
                    {f.statut_formation === "brouillon" && (
                      <button type="button" className="btn-ghost" style={{ color: '#10b981', borderColor: '#a7f3d0' }} onClick={() => agir(() => api(`/admin/formations/${f.id_formation}/publier`, { method: "PATCH" }), "Formation publiée.")}>
                        <i className="bi bi-cloud-arrow-up me-1"></i> Publier
                      </button>
                    )}
                    {f.statut_formation === "publiee" && (
                      <button type="button" className="btn-ghost" style={{ color: '#f59e0b', borderColor: '#fcd34d' }} onClick={() => agir(() => api(`/admin/formations/${f.id_formation}/archiver`, { method: "PATCH" }), "Formation archivée.")}>
                        <i className="bi bi-archive me-1"></i> Archiver
                      </button>
                    )}
                    {f.statut_formation === "archivee" && (
                      <button type="button" className="btn-ghost" onClick={() => agir(() => api(`/admin/formations/${f.id_formation}/restaurer`, { method: "PATCH" }), "Formation restaurée.")}>
                        <i className="bi bi-arrow-counterclockwise me-1"></i> Restaurer
                      </button>
                    )}
                    
                    <button type="button" className="btn-ghost-danger ms-auto" onClick={() => supprimerFormation(f)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>

                {/* SECTION SESSIONS (Si ouverte) */}
                {ouverte === f.id_formation && (
                  <div className="card-footer bg-light border-top p-4">
                    <h6 className="fw-bold mb-3">Sessions de la formation</h6>
                    
                    <div className="table-responsive mb-4">
                      <table className="table table-sm table-borderless align-middle">
                        <thead className="text-muted small text-uppercase">
                          <tr><th>Début</th><th>Fin</th><th>Places</th><th>Formateurs</th><th></th></tr>
                        </thead>
                        <tbody>
                          {sessions.length === 0 ? (
                            <tr><td colSpan="5" className="text-center text-muted py-3">Aucune session créée.</td></tr>
                          ) : (
                            sessions.map((s) => (
                              <tr key={s.id_session}>
                                <td>{new Date(s.date_debut).toLocaleDateString('fr-FR')}</td>
                                <td>{new Date(s.date_fin).toLocaleDateString('fr-FR')}</td>
                                <td><span className="badge bg-secondary">{s.places_restantes} / {s.capacite_max}</span></td>
                                <td>
                                  {s.formateurs.map((x) => (
                                    <span key={x.id_utilisateur} className="badge bg-light text-dark border me-1 mb-1">
                                      {x.prenom} {x.nom}
                                      <button type="button" className="btn-close ms-1" style={{ fontSize: '0.5rem' }} onClick={() => agir(() => api(`/admin/sessions/${s.id_session}/formateurs/${x.id_utilisateur}`, { method: "DELETE" }), "Formateur retiré.")}></button>
                                    </span>
                                  ))}
                                  <select className="form-select form-select-sm d-inline-block" style={{ width: 'auto' }} defaultValue="" onChange={(e) => { if (e.target.value) agir(() => api(`/admin/sessions/${s.id_session}/formateurs`, { method: "POST", body: { idFormateur: Number(e.target.value) } }), "Formateur affecté."); e.target.value = ""; }}>
                                    <option value="">+ Affecter</option>
                                    {formateurs.map((x) => <option key={x.id_utilisateur} value={x.id_utilisateur}>{x.prenom} {x.nom}</option>)}
                                  </select>
                                </td>
                                <td>
                                  <button type="button" className="btn-ghost-danger p-1" onClick={() => supprimerSession(s)} title="Supprimer la session">
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Formulaire d'ajout de session */}
                    <form className="d-flex flex-wrap gap-2 align-items-end bg-white p-3 rounded-3 border" onSubmit={(e) => { e.preventDefault(); agir(() => api(`/admin/formations/${f.id_formation}/sessions`, { method: "POST", body: session }), "Session créée."); setSession({ dateDebut: "", dateFin: "", capaciteMax: "" }); }}>
                      <div className="flex-grow-1">
                        <label className="small fw-bold text-muted mb-1">Début</label>
                        <input type="date" className="form-control form-control-sm" value={session.dateDebut} onChange={(e) => setSession({ ...session, dateDebut: e.target.value })} required />
                      </div>
                      <div className="flex-grow-1">
                        <label className="small fw-bold text-muted mb-1">Fin</label>
                        <input type="date" className="form-control form-control-sm" value={session.dateFin} onChange={(e) => setSession({ ...session, dateFin: e.target.value })} required />
                      </div>
                      <div style={{ width: '100px' }}>
                        <label className="small fw-bold text-muted mb-1">Places</label>
                        <input type="number" min="1" className="form-control form-control-sm" value={session.capaciteMax} onChange={(e) => setSession({ ...session, capaciteMax: e.target.value })} required />
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm"><i className="bi bi-plus-circle me-1"></i> Ajouter</button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALE DE CRÉATION DE FORMATION */}
      {afficherForm && (
        <div className="lms-modal-overlay" onClick={(e) => e.target === e.currentTarget && setAfficherForm(false)}>
          <div className="lms-modal-box">
            <div className="lms-modal-header">
              <h2>Nouvelle formation</h2>
              <button type="button" onClick={() => setAfficherForm(false)}>✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); agir(async () => { await api("/admin/formations", { method: "POST", body: form }); setForm({ intitule: "", description: "", duree: "", publicVise: "" }); setAfficherForm(false); }, "Formation créée au statut brouillon."); }}>
              <div className="lms-modal-body">
                <label>Intitulé de la formation</label>
                <input value={form.intitule} onChange={(e) => setForm({ ...form, intitule: e.target.value })} required />
                <div className="row">
                  <div className="col-md-6">
                    <label>Durée (heures)</label>
                    <input type="number" value={form.duree} onChange={(e) => setForm({ ...form, duree: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label>Public visé</label>
                    <input value={form.publicVise} onChange={(e) => setForm({ ...form, publicVise: e.target.value })} />
                  </div>
                </div>
                <label>Description</label>
                <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
              </div>
              <div className="lms-modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setAfficherForm(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer la formation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE MODIFICATION */}
      {modif && (
        <div className="lms-modal-overlay" onClick={(e) => e.target === e.currentTarget && setModif(null)}>
          <div className="lms-modal-box">
            <div className="lms-modal-header">
              <h2>Modifier la formation</h2>
              <button type="button" onClick={() => setModif(null)}>✕</button>
            </div>
            <form onSubmit={enregistrerModif}>
              <div className="lms-modal-body">
                <label>Intitulé</label>
                <input value={modif.intitule} onChange={(e) => setModif({ ...modif, intitule: e.target.value })} required />
                <div className="row">
                  <div className="col-md-6">
                    <label>Durée (heures)</label>
                    <input type="number" value={modif.duree} onChange={(e) => setModif({ ...modif, duree: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label>Public visé</label>
                    <input value={modif.publicVise} onChange={(e) => setModif({ ...modif, publicVise: e.target.value })} />
                  </div>
                </div>
                <label>Description</label>
                <input value={modif.description} onChange={(e) => setModif({ ...modif, description: e.target.value })} />
              </div>
              <div className="lms-modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setModif(null)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}