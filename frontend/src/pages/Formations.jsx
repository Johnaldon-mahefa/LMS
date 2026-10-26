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
  const [form, setForm] = useState({ intitule: "", description: "", duree: "", publicVise: "" });
  const [session, setSession] = useState({ dateDebut: "", dateFin: "", capaciteMax: "" });
  const [modif, setModif] = useState(null);
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
    <>
      <h1 style={{ marginBottom: 20 }}>Organiser les formations</h1>

      <div className="page-split">
        <div className="colonne gauche">
          <h2>Nouvelle formation</h2>
          <form className="grille" onSubmit={(e) => { e.preventDefault(); agir(async () => { await api("/admin/formations", { method: "POST", body: form }); setForm({ intitule: "", description: "", duree: "", publicVise: "" }); }, "Formation créée au statut brouillon."); }}>
            <label>Intitulé<input value={form.intitule} onChange={(e) => setForm({ ...form, intitule: e.target.value })} required /></label>
            <label>Durée (heures)<input type="number" value={form.duree} onChange={(e) => setForm({ ...form, duree: e.target.value })} /></label>
            <label>Description<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label>Public visé<input value={form.publicVise} onChange={(e) => setForm({ ...form, publicVise: e.target.value })} /></label>
            <button type="submit">Créer la formation</button>
          </form>
        </div>

        <div className="colonne droite">
          <div className="filtres-haut">
            <button type="button" onClick={() => setFiltre("toutes")} className={filtre === "toutes" ? "actif" : ""}>Toutes ({formations.length})</button>
            <button type="button" onClick={() => setFiltre("brouillon")} className={filtre === "brouillon" ? "actif" : ""}>Brouillons ({compte("brouillon")})</button>
            <button type="button" onClick={() => setFiltre("publiee")} className={filtre === "publiee" ? "actif" : ""}>Publiées ({compte("publiee")})</button>
            <button type="button" onClick={() => setFiltre("archivee")} className={filtre === "archivee" ? "actif" : ""}>Archivées ({compte("archivee")})</button>
            <input type="search" placeholder="Rechercher par intitulé…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          </div>

          <h2>Liste des formations ({listeFiltree.length})</h2>

          {chargement ? (
            <Loading texte="Chargement des formations…" />
          ) : listeFiltree.length === 0 ? (
            <p style={{ textAlign: "center", padding: 20, color: "#6b6485" }}>Aucune formation ne correspond à ce filtre.</p>
          ) : (
            listeFiltree.map((f) => (
              <section key={f.id_formation} className="bloc">
                <h2>{f.intitule} <span className={`etiquette ${f.statut_formation}`}>{f.statut_formation}</span></h2>
                <p>{f.nb_sessions} session(s), {f.nb_modules_publies}/{f.nb_modules} module(s) publié(s)</p>
                <div className="actions">
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => ouvrir(f.id_formation)} title="Voir les sessions">
                    <i className="bi bi-calendar-event me-1"></i> {ouverte === f.id_formation ? "Masquer" : "Sessions"}
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => ouvrirModif(f)} title="Modifier la formation">
                    <i className="bi bi-pencil me-1"></i> Modifier
                  </button>
                  {f.statut_formation === "brouillon" && (
                    <button type="button" className="btn btn-sm btn-success" onClick={() => agir(() => api(`/admin/formations/${f.id_formation}/publier`, { method: "PATCH" }), "Formation publiée.")} title="Publier la formation">
                      <i className="bi bi-cloud-arrow-up me-1"></i> Publier
                    </button>
                  )}
                  {f.statut_formation === "publiee" && (
                    <button type="button" className="btn btn-sm btn-warning" onClick={() => agir(() => api(`/admin/formations/${f.id_formation}/archiver`, { method: "PATCH" }), "Formation archivée.")} title="Archiver la formation">
                      <i className="bi bi-archive me-1"></i> Archiver
                    </button>
                  )}
                  {f.statut_formation === "archivee" && (
                    <button type="button" className="btn btn-sm btn-success" onClick={() => agir(() => api(`/admin/formations/${f.id_formation}/restaurer`, { method: "PATCH" }), "Formation restaurée.")} title="Restaurer la formation">
                      <i className="bi bi-arrow-counterclockwise me-1"></i> Restaurer
                    </button>
                  )}
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => supprimerFormation(f)} title="Supprimer la formation">
                    <i className="bi bi-trash me-1"></i> Supprimer
                  </button>
                </div>

                {ouverte === f.id_formation && (
                  <div className="sous-bloc">
                    <table>
                      <thead><tr><th>Début</th><th>Fin</th><th>Places</th><th>Formateurs</th><th></th></tr></thead>
                      <tbody>
                        {sessions.map((s) => (
                          <tr key={s.id_session}>
                            <td>{new Date(s.date_debut).toLocaleDateString('fr-FR')}</td>
                            <td>{new Date(s.date_fin).toLocaleDateString('fr-FR')}</td>
                            <td>{s.places_restantes} / {s.capacite_max}</td>
                            <td>
                              {s.formateurs.map((x) => (
                                <span key={x.id_utilisateur} className="puce">
                                  {x.prenom} {x.nom}
                                  <button type="button" onClick={() => agir(() => api(`/admin/sessions/${s.id_session}/formateurs/${x.id_utilisateur}`, { method: "DELETE" }), "Formateur retiré.")} title="Retirer ce formateur">×</button>
                                </span>
                              ))}
                              <select defaultValue="" onChange={(e) => { if (e.target.value) agir(() => api(`/admin/sessions/${s.id_session}/formateurs`, { method: "POST", body: { idFormateur: Number(e.target.value) } }), "Formateur affecté."); e.target.value = ""; }}>
                                <option value="">Affecter…</option>
                                {formateurs.map((x) => <option key={x.id_utilisateur} value={x.id_utilisateur}>{x.prenom} {x.nom}</option>)}
                              </select>
                            </td>
                            <td>
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => supprimerSession(s)} title="Supprimer la session">
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <form className="ligne" onSubmit={(e) => { e.preventDefault(); agir(() => api(`/admin/formations/${f.id_formation}/sessions`, { method: "POST", body: session }), "Session créée."); setSession({ dateDebut: "", dateFin: "", capaciteMax: "" }); }}>
                      <label>Début<input type="date" value={session.dateDebut} onChange={(e) => setSession({ ...session, dateDebut: e.target.value })} required /></label>
                      <label>Fin<input type="date" value={session.dateFin} onChange={(e) => setSession({ ...session, dateFin: e.target.value })} required /></label>
                      <label>Capacité<input type="number" min="1" value={session.capaciteMax} onChange={(e) => setSession({ ...session, capaciteMax: e.target.value })} required /></label>
                      <button type="submit" className="btn btn-primary"><i className="bi bi-plus-circle me-1"></i> Ajouter une session</button>
                    </form>
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      </div>

      {modif && (
        <div className="lms-modal-overlay" onClick={(e) => e.target === e.currentTarget && setModif(null)}>
          <div className="lms-modal-box">
            <div className="lms-modal-header">
              <h2>Modifier la formation</h2>
              <button type="button" onClick={() => setModif(null)}>✕</button>
            </div>
            <form onSubmit={enregistrerModif}>
              <div className="lms-modal-body">
                <label>Intitulé<input value={modif.intitule} onChange={(e) => setModif({ ...modif, intitule: e.target.value })} required /></label>
                <label>Durée (heures)<input type="number" value={modif.duree} onChange={(e) => setModif({ ...modif, duree: e.target.value })} /></label>
                <label>Description<input value={modif.description} onChange={(e) => setModif({ ...modif, description: e.target.value })} /></label>
                <label>Public visé<input value={modif.publicVise} onChange={(e) => setModif({ ...modif, publicVise: e.target.value })} /></label>
              </div>
              <div className="lms-modal-footer">
                <button type="button" className="secondaire" onClick={() => setModif(null)}>Annuler</button>
                <button type="submit">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}