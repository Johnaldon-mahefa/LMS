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

  // Liste enrichie pour l'export (texte propre)
  const listeExport = useMemo(() =>
    listeFiltree.map((u) => ({
      ...u,
      roles_texte: u.roles.join(", "),
      statut_texte: u.statut_compte === "desactive" ? "Désactivé" : "Actif",
    })), [listeFiltree]);

  const compte = (statut) => liste.filter((u) => u.statut_compte === statut).length;

  /* ---------- Export ---------- */
  function exporterEnCSV() {
    exporterCSV(listeExport, COLONNES, "utilisateurs");
    toast.ok(`Export CSV de ${listeExport.length} utilisateur(s).`);
  }
  function exporterEnPDF() {
    exporterPDF(listeExport, COLONNES, "utilisateurs", "Liste des utilisateurs");
    toast.ok(`Export PDF de ${listeExport.length} utilisateur(s).`);
  }

  /* ---------- Création ---------- */
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
    <>
      <h1 style={{ marginBottom: 20 }}>Gérer les utilisateurs</h1>

      <div className="page-split">
        {/* COLONNE GAUCHE */}
        <div className="colonne gauche">
          <h2>Nouveau compte</h2>
          <form onSubmit={creer} className="grille">
            <label>Nom<input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></label>
            <label>Prénom<input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required /></label>
            <label>Identifiant<input value={form.identifiant} onChange={(e) => setForm({ ...form, identifiant: e.target.value })} required /></label>
            <label>Mot de passe initial<input type="password" value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} required /></label>
            <fieldset><legend>Rôles</legend>
              {ROLES.map((r) => (
                <label key={r}><input type="checkbox" checked={form.roles.includes(r)} onChange={() => basculerRole(r)} /> {r}</label>
              ))}
            </fieldset>
            <button type="submit">Créer le compte</button>
          </form>
        </div>

        {/* COLONNE DROITE */}
        <div className="colonne droite">
          <div className="filtres-haut">
            <button type="button" onClick={() => setFiltre("tous")} className={filtre === "tous" ? "actif" : ""}>
              Tous ({liste.length})
            </button>
            <button type="button" onClick={() => setFiltre("actif")} className={filtre === "actif" ? "actif" : ""}>
              Actifs ({compte("actif")})
            </button>
            <button type="button" onClick={() => setFiltre("desactive")} className={filtre === "desactive" ? "actif" : ""}>
              Désactivés ({compte("desactive")})
            </button>
            <input
              type="search"
              placeholder="Rechercher par nom, prénom ou identifiant…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ margin: 0, border: 0, padding: 0 }}>Liste des utilisateurs ({listeFiltree.length})</h2>
            <div className="actions" style={{ margin: 0 }}>
              <button type="button" onClick={exporterEnCSV} title="Télécharger en CSV">📥 CSV</button>
              <button type="button" onClick={exporterEnPDF} title="Télécharger en PDF">📄 PDF</button>
            </div>
          </div>

          {chargement ? (
            <Loading texte="Chargement des utilisateurs…" />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Identifiant</th>
                  <th>Rôles</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listeFiltree.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: 20, color: "#6b6485" }}>
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                )}
                {listeFiltree.map((u) => (
                  <tr key={u.id_utilisateur}>
                    <td>{u.prenom} {u.nom}</td>
                    <td>{u.identifiant}</td>
                    <td>{u.roles.join(", ")}</td>
                    <td>
                      <span className={`etiquette ${u.statut_compte}`}>
                        {u.statut_compte === "desactive" ? "désactivé" : u.statut_compte}
                      </span>
                    </td>
                    <td>
                      <div className="actions-btns">
                        <button type="button" onClick={() => ouvrirModif(u)}>Modifier</button>
                        <button type="button" onClick={() => ouvrirMdp(u)}>Mot de passe</button>
                        {u.id_utilisateur !== moi.id && (
                          u.statut_compte === "actif"
                            ? <button type="button" onClick={() => desactiver(u)}>Désactiver</button>
                            : <button type="button" onClick={() => reactiver(u)}>Réactiver</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODALES */}
      {modif && (
        <div className="fond-modal" onClick={(e) => e.target === e.currentTarget && setModif(null)}>
          <div className="modal">
            <div className="modal-entete">
              <h2>Modifier {modif.prenom} {modif.nom}</h2>
              <button type="button" onClick={() => setModif(null)}>✕</button>
            </div>
            <form onSubmit={enregistrerModif}>
              <div className="modal-corps">
                <label>Nom<input value={modif.nom} onChange={(e) => setModif({ ...modif, nom: e.target.value })} required /></label>
                <label>Prénom<input value={modif.prenom} onChange={(e) => setModif({ ...modif, prenom: e.target.value })} required /></label>
                <fieldset><legend>Rôles</legend>
                  {ROLES.map((r) => (
                    <label key={r}><input type="checkbox" checked={modif.roles.includes(r)} onChange={() => basculerRoleModif(r)} /> {r}</label>
                  ))}
                </fieldset>
              </div>
              <div className="modal-pied">
                <button type="button" className="btn secondaire" onClick={() => setModif(null)}>Annuler</button>
                <button type="submit" className="btn">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mdp && (
        <div className="fond-modal" onClick={(e) => e.target === e.currentTarget && setMdp(null)}>
          <div className="modal">
            <div className="modal-entete">
              <h2>Réinitialiser le mot de passe</h2>
              <button type="button" onClick={() => setMdp(null)}>✕</button>
            </div>
            <form onSubmit={enregistrerMdp}>
              <div className="modal-corps">
                <p style={{ marginBottom: 12, color: "#6b6485" }}>
                  Nouveau mot de passe pour <strong>{mdp.prenom} {mdp.nom}</strong>. Minimum 8 caractères.
                </p>
                <label>Nouveau mot de passe
                  <input
                    type="text"
                    value={mdp.motDePasse}
                    onChange={(e) => setMdp({ ...mdp, motDePasse: e.target.value })}
                    minLength={8}
                    required
                    autoFocus
                  />
                </label>
              </div>
              <div className="modal-pied">
                <button type="button" className="btn secondaire" onClick={() => setMdp(null)}>Annuler</button>
                <button type="submit" className="btn">Réinitialiser</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}