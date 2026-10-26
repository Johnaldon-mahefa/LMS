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
    
    // CORRECTION ICI : On ajoute le nom de la formation à chaque session
    api("/admin/formations").then(async (fs) => {
      const toutes = [];
      for (const f of fs.filter((x) => x.statut_formation === "publiee")) {
        const detail = await api(`/admin/formations/${f.id_formation}`);
        detail.sessions.forEach((s) => {
          toutes.push({ 
            ...s, 
            formation: f.intitule // <-- On ajoute le nom de la formation ici
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

  return (
    <>
      <h1 style={{ marginBottom: 20 }}>Gérer les inscriptions</h1>

      <div className="page-split">
        {/* COLONNE GAUCHE : inscription directe */}
        <div className="colonne gauche">
          <h2>Inscription directe</h2>
          <p style={{ fontSize: 13, color: "#6b6485", marginBottom: 14 }}>
            L'inscription est créée directement au statut « validée ».
          </p>
          <form
            className="grille"
            onSubmit={(e) => {
              e.preventDefault();
              agir(
                () =>
                  api("/admin/inscriptions/directe", {
                    method: "POST",
                    body: {
                      idApprenant: Number(direct.idApprenant),
                      idSession: Number(direct.idSession),
                    },
                  }),
                "Apprenant inscrit."
              );
              setDirect({ idApprenant: "", idSession: "" });
            }}
          >
            <label>Apprenant
              <select
                value={direct.idApprenant}
                onChange={(e) => setDirect({ ...direct, idApprenant: e.target.value })}
                required
              >
                <option value="">Choisir…</option>
                {apprenants.map((a) => (
                  <option key={a.id_utilisateur} value={a.id_utilisateur}>
                    {a.prenom} {a.nom}
                  </option>
                ))}
              </select>
            </label>
            <label>Session
              <select
                value={direct.idSession}
                onChange={(e) => setDirect({ ...direct, idSession: e.target.value })}
                required
              >
                <option value="">Choisir…</option>
                {sessions.map((s) => (
                  <option key={s.id_session} value={s.id_session}>
                    {/* AFFICHAGE CORRIGÉ : Formation + Date */}
                    {s.formation} (Début: {new Date(s.date_debut).toLocaleDateString('fr-FR')})
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Inscrire</button>
          </form>
        </div>

        {/* COLONNE DROITE : filtres + liste */}
        <div className="colonne droite">
          <div className="filtres-haut">
            <button type="button" onClick={() => setFiltre("tous")} className={filtre === "tous" ? "actif" : ""}>
              Toutes ({liste.length})
            </button>
            <button type="button" onClick={() => setFiltre("en_attente")} className={filtre === "en_attente" ? "actif" : ""}>
              En attente ({compte("en_attente")})
            </button>
            <button type="button" onClick={() => setFiltre("validee")} className={filtre === "validee" ? "actif" : ""}>
              Validées ({compte("validee")})
            </button>
            <button type="button" onClick={() => setFiltre("refusee")} className={filtre === "refusee" ? "actif" : ""}>
              Refusées ({compte("refusee")})
            </button>
            <button type="button" onClick={() => setFiltre("annulee")} className={filtre === "annulee" ? "actif" : ""}>
              Annulées ({compte("annulee")})
            </button>
            <input
              type="search"
              placeholder="Rechercher par apprenant ou formation…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <h2>Liste des inscriptions ({listeFiltree.length})</h2>

          {chargement ? (
            <Loading texte="Chargement des inscriptions…" />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Apprenant</th>
                  <th>Formation</th>
                  <th>Session</th>
                  <th>Places</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listeFiltree.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: 20, color: "#6b6485" }}>
                      Aucune inscription trouvée.
                    </td>
                  </tr>
                )}
                {listeFiltree.map((i) => (
                  <tr key={i.id_inscription}>
                    <td>{i.prenom} {i.nom}</td>
                    <td>{i.formation}</td>
                    <td>{new Date(i.date_debut).toLocaleDateString('fr-FR')}</td>
                    <td>{i.places_restantes} / {i.capacite_max}</td>
                    <td>
                      <span className={`etiquette ${i.statut_inscription}`}>
                        {i.statut_inscription.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                    <div className="actions-btns">
                        {i.statut_inscription === "en_attente" && (
                          <>
                            <button type="button" onClick={() => action(i.id_inscription, "valider", "Inscription validée.")}>Valider</button>
                            <button type="button" onClick={() => action(i.id_inscription, "refuser", "Demande refusée.")}>Refuser</button>
                          </>
                        )}
                        {i.statut_inscription === "validee" && (
                          <button type="button" onClick={() => annulerAvecConfirmation(i)}>Annuler</button>
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
    </>
  );
}