import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import Loading from "../components/Loading.jsx";

export default function Inscriptions() {
  const toast = useToast();
  const confirmer = useConfirm();

  const [liste, setListe] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [apprenants, setApprenants] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [direct, setDirect] = useState({ idApprenant: "", idSession: "" });
  const [filtre, setFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  
  // Nouvel état pour la modale
  const [afficherForm, setAfficherForm] = useState(false);

  const charger = () => {
    const debut = Date.now();
    return api("/admin/inscriptions")
      .then((data) => {
        const restant = Math.max(0, 400 - (Date.now() - debut));
        setTimeout(() => { setListe(data); setChargement(false); }, restant);
      })
      .catch((e) => {
        const restant = Math.max(0, 400 - (Date.now() - debut));
        setTimeout(() => { toast.erreur(e.message); setChargement(false); }, restant);
      });
  };

  useEffect(() => {
    charger();
    api("/utilisateurs").then((u) =>
      setApprenants(u.filter((x) => x.roles.includes("apprenant") && x.statut_compte === "actif"))
    );
    
    api("/admin/formations").then(async (fs) => {
      const toutes = [];
      for (const f of fs.filter((x) => x.statut_formation === "publiee")) {
        const detail = await api(`/admin/formations/${f.id_formation}`);
        detail.sessions.forEach((s) => {
          toutes.push({ 
            ...s, 
            formation: f.intitule 
          });
        });
      }
      setSessions(toutes);
    });
  }, []);

  const listeFiltree = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return liste.filter((i) => {
      if (filtre !== "tous" && i.statut_inscription !== filtre) return false;
      if (!q) return true;
      return `${i.prenom} ${i.nom} ${i.formation}`.toLowerCase().includes(q);
    });
  }, [liste, filtre, recherche]);

  const compte = (statut) => liste.filter((i) => i.statut_inscription === statut).length;

  async function agir(fn, texteOk) {
    try {
      await fn();
      toast.ok(texteOk);
      await charger();
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  const action = (id, verbe, texte) =>
    agir(() => api(`/admin/inscriptions/${id}/${verbe}`, { method: "PATCH" }), texte);

  async function annulerAvecConfirmation(i) {
    const ok = await confirmer({
      titre: "Annuler cette inscription ?",
      message: `${i.prenom} ${i.nom} perdra l'accès au contenu de la formation « ${i.formation} ». Les travaux déjà déposés sont conservés.`,
      danger: true,
      confirmer: "Annuler l'inscription",
    });
    if (!ok) return;
    action(i.id_inscription, "annuler", "Inscription annulée.");
  }

  async function inscrireDirectement(e) {
    e.preventDefault();
    try {
      await api("/admin/inscriptions/directe", {
        method: "POST",
        body: {
          idApprenant: Number(direct.idApprenant),
          idSession: Number(direct.idSession),
        },
      });
      toast.ok("Apprenant inscrit.");
      setDirect({ idApprenant: "", idSession: "" });
      setAfficherForm(false);
      charger();
    } catch (err) {
      toast.erreur(err.message);
    }
  }

  return (
    <div className="container-fluid py-4">
      
      {/* EN-TÊTE */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h1 className="h3 fw-bold mb-0">Gérer les inscriptions</h1>
        <button className="btn btn-primary" onClick={() => setAfficherForm(true)}>
          <i className="bi bi-person-plus me-2"></i> Inscription directe
        </button>
      </div>

      {/* FILTRES */}
      <div className="filtres-haut mb-4">
        <button type="button" onClick={() => setFiltre("tous")} className={filtre === "tous" ? "actif" : ""}>Toutes ({liste.length})</button>
        <button type="button" onClick={() => setFiltre("en_attente")} className={filtre === "en_attente" ? "actif" : ""}>En attente ({compte("en_attente")})</button>
        <button type="button" onClick={() => setFiltre("validee")} className={filtre === "validee" ? "actif" : ""}>Validées ({compte("validee")})</button>
        <button type="button" onClick={() => setFiltre("refusee")} className={filtre === "refusee" ? "actif" : ""}>Refusées ({compte("refusee")})</button>
        <button type="button" onClick={() => setFiltre("annulee")} className={filtre === "annulee" ? "actif" : ""}>Annulées ({compte("annulee")})</button>
        <input type="search" placeholder="Rechercher un apprenant ou une formation..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
      </div>

      {/* TABLEAU */}
      {chargement ? (
        <Loading texte="Chargement des inscriptions…" />
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Apprenant</th>
                    <th>Formation</th>
                    <th>Session</th>
                    <th>Places</th>
                    <th>Statut</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listeFiltree.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        Aucune inscription trouvée.
                      </td>
                    </tr>
                  ) : (
                    listeFiltree.map((i) => (
                      <tr key={i.id_inscription}>
                        <td className="fw-bold text-dark">{i.prenom} {i.nom}</td>
                        <td>{i.formation}</td>
                        <td>{new Date(i.date_debut).toLocaleDateString('fr-FR')}</td>
                        <td><span className="badge bg-secondary">{i.places_restantes} / {i.capacite_max}</span></td>
                        <td>
                          <span className={`etiquette ${i.statut_inscription}`}>
                            {i.statut_inscription.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2 justify-content-end">
                            {i.statut_inscription === "en_attente" && (
                              <>
                                <button type="button" className="btn-ghost" style={{ color: '#10b981', borderColor: '#a7f3d0' }} onClick={() => action(i.id_inscription, "valider", "Inscription validée.")}>
                                  <i className="bi bi-check-lg me-1"></i> Valider
                                </button>
                                <button type="button" className="btn-ghost-danger" onClick={() => action(i.id_inscription, "refuser", "Demande refusée.")}>
                                  <i className="bi bi-x-lg me-1"></i> Refuser
                                </button>
                              </>
                            )}
                            {i.statut_inscription === "validee" && (
                              <button type="button" className="btn-ghost-danger" onClick={() => annulerAvecConfirmation(i)}>
                                <i className="bi bi-slash-circle me-1"></i> Annuler
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALE D'INSCRIPTION DIRECTE */}
      {afficherForm && (
        <div className="lms-modal-overlay" onClick={(e) => e.target === e.currentTarget && setAfficherForm(false)}>
          <div className="lms-modal-box">
            <div className="lms-modal-header">
              <h2>Inscrire un apprenant</h2>
              <button type="button" onClick={() => setAfficherForm(false)}>✕</button>
            </div>
            <form onSubmit={inscrireDirectement}>
              <div className="lms-modal-body">
                <p className="text-muted small mb-4">
                  L'inscription est créée directement au statut <strong>« validée »</strong>.
                </p>
                
                <label>Apprenant</label>
                <select
                  value={direct.idApprenant}
                  onChange={(e) => setDirect({ ...direct, idApprenant: e.target.value })}
                  required
                  className="mb-3"
                >
                  <option value="">Choisir un apprenant...</option>
                  {apprenants.map((a) => (
                    <option key={a.id_utilisateur} value={a.id_utilisateur}>
                      {a.prenom} {a.nom} ({a.identifiant})
                    </option>
                  ))}
                </select>

                <label>Session</label>
                <select
                  value={direct.idSession}
                  onChange={(e) => setDirect({ ...direct, idSession: e.target.value })}
                  required
                >
                  <option value="">Choisir une session...</option>
                  {sessions.map((s) => (
                    <option key={s.id_session} value={s.id_session}>
                      {s.formation} (Début: {new Date(s.date_debut).toLocaleDateString('fr-FR')})
                    </option>
                  ))}
                </select>
              </div>
              <div className="lms-modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setAfficherForm(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Inscrire l'apprenant</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}