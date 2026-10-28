import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import Loading from "../components/Loading.jsx";
import { exporterCSV, exporterPDF } from "../utils/export.js";

const ROLES = ["administrateur", "formateur", "apprenant"];
const VIDE = { nom: "", prenom: "", identifiant: "", motDePasse: "", roles: ["apprenant"] };

const COLONNES = [
  { cle: "nom", titre: "Nom" },
  { cle: "prenom", titre: "Prénom" },
  { cle: "identifiant", titre: "Identifiant" },
  { cle: "roles_texte", titre: "Rôles" },
  { cle: "statut_texte", titre: "Statut" },
];

export default function Utilisateurs() {
  const { utilisateur: moi } = useAuth();
  const toast = useToast();
  const confirmer = useConfirm();

  const [liste, setListe] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [form, setForm] = useState(VIDE);
  const [filtre, setFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [modif, setModif] = useState(null);
  const [mdp, setMdp] = useState(null);
  
  // Nouvel état pour afficher/masquer la modale de création
  const [afficherForm, setAfficherForm] = useState(false);

  const charger = () => {
    const debut = Date.now();
    return api("/utilisateurs")
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

  const listeFiltree = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return liste.filter((u) => {
      if (filtre !== "tous" && u.statut_compte !== filtre) return false;
      if (!q) return true;
      return `${u.prenom} ${u.nom} ${u.identifiant}`.toLowerCase().includes(q);
    });
  }, [liste, filtre, recherche]);

  const listeExport = useMemo(() =>
    listeFiltree.map((u) => ({
      ...u,
      roles_texte: u.roles.join(", "),
      statut_texte: u.statut_compte === "desactive" ? "Désactivé" : "Actif",
    })), [listeFiltree]);

  const compte = (statut) => liste.filter((u) => u.statut_compte === statut).length;

  function exporterEnCSV() {
    exporterCSV(listeExport, COLONNES, "utilisateurs");
    toast.ok(`Export CSV de ${listeExport.length} utilisateur(s).`);
  }
  function exporterEnPDF() {
    exporterPDF(listeExport, COLONNES, "utilisateurs", "Liste des utilisateurs");
    toast.ok(`Export PDF de ${listeExport.length} utilisateur(s).`);
  }

  function basculerRole(role) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  }

  async function creer(e) {
    e.preventDefault();
    try {
      await api("/utilisateurs", { method: "POST", body: form });
      setForm(VIDE);
      setAfficherForm(false); // Ferme la modale en cas de succès
      toast.ok("Compte créé.");
      charger();
    } catch (err) { toast.erreur(err.message); }
  }

  async function desactiver(u) {
    const ok = await confirmer({
      titre: "Désactiver ce compte ?",
      message: `${u.prenom} ${u.nom} ne pourra plus se connecter.`,
      danger: true,
      confirmer: "Désactiver",
    });
    if (!ok) return;
    try { await api(`/utilisateurs/${u.id_utilisateur}/desactiver`, { method: "PATCH" }); toast.ok("Compte désactivé."); charger(); }
    catch (err) { toast.erreur(err.message); }
  }

  async function reactiver(u) {
    try { await api(`/utilisateurs/${u.id_utilisateur}/reactiver`, { method: "PATCH" }); toast.ok("Compte réactivé."); charger(); }
    catch (err) { toast.erreur(err.message); }
  }

  function ouvrirModif(u) {
    setModif({ id: u.id_utilisateur, nom: u.nom, prenom: u.prenom, roles: [...u.roles] });
  }

  function basculerRoleModif(role) {
    setModif((m) => ({
      ...m,
      roles: m.roles.includes(role) ? m.roles.filter((r) => r !== role) : [...m.roles, role],
    }));
  }

  async function enregistrerModif(e) {
    e.preventDefault();
    try {
      await api(`/utilisateurs/${modif.id}`, {
        method: "PUT",
        body: { nom: modif.nom, prenom: modif.prenom, roles: modif.roles },
      });
      toast.ok("Utilisateur modifié.");
      setModif(null);
      charger();
    } catch (err) { toast.erreur(err.message); }
  }

  function ouvrirMdp(u) {
    setMdp({ id: u.id_utilisateur, prenom: u.prenom, nom: u.nom, motDePasse: "" });
  }

  async function enregistrerMdp(e) {
    e.preventDefault();
    try {
      await api(`/utilisateurs/${mdp.id}/mot-de-passe`, {
        method: "PATCH",
        body: { motDePasse: mdp.motDePasse },
      });
      toast.ok(`Mot de passe réinitialisé pour ${mdp.prenom} ${mdp.nom}.`);
      setMdp(null);
    } catch (err) { toast.erreur(err.message); }
  }

  return (
    <div className="container-fluid py-4">
      
      {/* EN-TÊTE (Titre + Boutons d'action) */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h1 className="h3 fw-bold mb-0">Gérer les utilisateurs</h1>
        <div className="d-flex gap-2">
          <button type="button" className="btn-ghost" onClick={exporterEnCSV} title="Télécharger en CSV">
            <i className="bi bi-file-earmark-spreadsheet me-1"></i> CSV
          </button>
          <button type="button" className="btn-ghost" onClick={exporterEnPDF} title="Télécharger en PDF">
            <i className="bi bi-file-earmark-pdf me-1"></i> PDF
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setAfficherForm(true)}>
            <i className="bi bi-person-plus me-2"></i> Nouveau compte
          </button>
        </div>
      </div>

      {/* FILTRES */}
      <div className="filtres-haut mb-4">
        <button type="button" onClick={() => setFiltre("tous")} className={filtre === "tous" ? "actif" : ""}>Tous ({liste.length})</button>
        <button type="button" onClick={() => setFiltre("actif")} className={filtre === "actif" ? "actif" : ""}>Actifs ({compte("actif")})</button>
        <button type="button" onClick={() => setFiltre("desactive")} className={filtre === "desactive" ? "actif" : ""}>Désactivés ({compte("desactive")})</button>
        <input type="search" placeholder="Rechercher un utilisateur..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
      </div>

      {/* TABLEAU */}
      {chargement ? (
        <Loading texte="Chargement des utilisateurs…" />
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Nom complet</th>
                    <th>Identifiant</th>
                    <th>Rôles</th>
                    <th>Statut</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listeFiltree.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        Aucun utilisateur trouvé.
                      </td>
                    </tr>
                  ) : (
                    listeFiltree.map((u) => (
                      <tr key={u.id_utilisateur}>
                        <td>
                          <div className="fw-bold text-dark">{u.prenom} {u.nom}</div>
                        </td>
                        <td className="text-muted">{u.identifiant}</td>
                        <td className="text-capitalize">{u.roles.join(", ")}</td>
                        <td>
                          <span className={`etiquette ${u.statut_compte}`}>
                            {u.statut_compte === "desactive" ? "désactivé" : u.statut_compte}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2 justify-content-end">
                            <button type="button" className="btn-ghost" onClick={() => ouvrirModif(u)} title="Modifier">
                              <i className="bi bi-pencil me-1"></i> Modifier
                            </button>
                            <button type="button" className="btn-ghost" onClick={() => ouvrirMdp(u)} title="Mot de passe">
                              <i className="bi bi-key me-1"></i> Mot de passe
                            </button>
                            {u.id_utilisateur !== moi.id && (
                              u.statut_compte === "actif" ? (
                                <button type="button" className="btn-ghost-danger" onClick={() => desactiver(u)} title="Désactiver">
                                  <i className="bi bi-person-x me-1"></i> Désactiver
                                </button>
                              ) : (
                                <button type="button" className="btn-ghost" style={{ color: '#10b981', borderColor: '#a7f3d0' }} onClick={() => reactiver(u)} title="Réactiver">
                                  <i className="bi bi-person-check me-1"></i> Réactiver
                                </button>
                              )
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

      {/* MODALE DE CRÉATION */}
      {afficherForm && (
        <div className="lms-modal-overlay" onClick={(e) => e.target === e.currentTarget && setAfficherForm(false)}>
          <div className="lms-modal-box">
            <div className="lms-modal-header">
              <h2>Créer un nouvel utilisateur</h2>
              <button type="button" onClick={() => setAfficherForm(false)}>✕</button>
            </div>
            <form onSubmit={creer}>
              <div className="lms-modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <label>Prénom</label>
                    <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label>Nom</label>
                    <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
                  </div>
                </div>
                <label>Identifiant (Email)</label>
                <input type="email" value={form.identifiant} onChange={(e) => setForm({ ...form, identifiant: e.target.value })} required />
                
                <label>Mot de passe initial</label>
                <input type="password" value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} minLength={8} required />

                <fieldset className="mt-3">
                  <legend>Rôles</legend>
                  {ROLES.map((r) => (
                    <label key={r} className="d-flex align-items-center gap-2 mb-2">
                      <input 
                        type="checkbox" 
                        checked={form.roles.includes(r)} 
                        onChange={() => basculerRole(r)} 
                        style={{ width: 'auto', margin: 0 }}
                      /> 
                      <span className="text-capitalize">{r}</span>
                    </label>
                  ))}
                </fieldset>
              </div>
              <div className="lms-modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setAfficherForm(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer le compte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE MODIFIER */}
      {modif && (
        <div className="lms-modal-overlay" onClick={(e) => e.target === e.currentTarget && setModif(null)}>
          <div className="lms-modal-box">
            <div className="lms-modal-header">
              <h2>Modifier {modif.prenom} {modif.nom}</h2>
              <button type="button" onClick={() => setModif(null)}>✕</button>
            </div>
            <form onSubmit={enregistrerModif}>
              <div className="lms-modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <label>Prénom</label>
                    <input value={modif.prenom} onChange={(e) => setModif({ ...modif, prenom: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label>Nom</label>
                    <input value={modif.nom} onChange={(e) => setModif({ ...modif, nom: e.target.value })} required />
                  </div>
                </div>
                <fieldset className="mt-3">
                  <legend>Rôles</legend>
                  {ROLES.map((r) => (
                    <label key={r} className="d-flex align-items-center gap-2 mb-2">
                      <input 
                        type="checkbox" 
                        checked={modif.roles.includes(r)} 
                        onChange={() => basculerRoleModif(r)} 
                        style={{ width: 'auto', margin: 0 }}
                      /> 
                      <span className="text-capitalize">{r}</span>
                    </label>
                  ))}
                </fieldset>
              </div>
              <div className="lms-modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setModif(null)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE MOT DE PASSE */}
      {mdp && (
        <div className="lms-modal-overlay" onClick={(e) => e.target === e.currentTarget && setMdp(null)}>
          <div className="lms-modal-box">
            <div className="lms-modal-header">
              <h2>Réinitialiser le mot de passe</h2>
              <button type="button" onClick={() => setMdp(null)}>✕</button>
            </div>
            <form onSubmit={enregistrerMdp}>
              <div className="lms-modal-body">
                <p className="text-muted mb-3">Nouveau mot de passe pour <strong>{mdp.prenom} {mdp.nom}</strong>.</p>
                <label>Nouveau mot de passe</label>
                <input 
                  type="text" 
                  value={mdp.motDePasse} 
                  onChange={(e) => setMdp({ ...mdp, motDePasse: e.target.value })} 
                  minLength={8} 
                  required 
                  autoFocus 
                />
              </div>
              <div className="lms-modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setMdp(null)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Réinitialiser</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}