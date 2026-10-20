import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import Loading from "../components/Loading.jsx";

export default function MesInscriptions() {
  const toast = useToast();
  const confirmer = useConfirm();
  const navigate = useNavigate();

  const [liste, setListe] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState("toutes");
  const [recherche, setRecherche] = useState("");

  const charger = () => {
    const debut = Date.now();
    return api("/apprenant/inscriptions")
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
    return liste.filter((i) => {
      if (filtre !== "toutes" && i.statut_inscription !== filtre) return false;
      if (!q) return true;
      return `${i.formation} ${i.date_debut}`.toLowerCase().includes(q);
    });
  }, [liste, filtre, recherche]);

  const compte = (statut) => liste.filter((i) => i.statut_inscription === statut).length;

  async function annuler(i) {
    const ok = await confirmer({
      titre: "Annuler cette inscription ?",
      message:
        i.statut_inscription === "en_attente"
          ? `Votre demande pour « ${i.formation} » sera retirée.`
          : `Vous perdrez l'accès au contenu de « ${i.formation} ».`,
      danger: true,
      confirmer: "Annuler l'inscription",
    });
    if (!ok) return;
    try {
      await api(`/apprenant/inscriptions/${i.id_inscription}/annuler`, { method: "PATCH" });
      toast.ok("Inscription annulée.");
      charger();
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  return (
    <>
      <h1 style={{ marginBottom: 20 }}>Mes inscriptions</h1>

      <div className="page-split">
        {/* COLONNE GAUCHE : actions */}
        <div className="colonne gauche">
          <h2>Actions</h2>
          <p style={{ fontSize: 13, color: "#6b6485", marginBottom: 14 }}>
            Consultez le catalogue pour demander une nouvelle inscription.
          </p>
          <button
            type="button"
            onClick={() => navigate("/catalogue")}
            style={{ width: "100%" }}
          >
            Voir le catalogue
          </button>
        </div>

        {/* COLONNE DROITE : filtres en haut + liste */}
        <div className="colonne droite">
          <div className="filtres-haut">
            <button type="button" onClick={() => setFiltre("toutes")} className={filtre === "toutes" ? "actif" : ""}>
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
              placeholder="Rechercher par formation…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <h2>Liste de mes inscriptions ({listeFiltree.length})</h2>

          {chargement ? (
            <Loading texte="Chargement…" />
          ) : listeFiltree.length === 0 ? (
            <p style={{ textAlign: "center", padding: 20, color: "#6b6485" }}>
              Aucune inscription ne correspond à ce filtre.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Formation</th>
                  <th>Session</th>
                  <th>Demandée le</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listeFiltree.map((i) => (
                  <tr key={i.id_inscription}>
                    <td>{i.formation}</td>
                    <td>Début : {i.date_debut}</td>
                    <td>{i.date_inscription}</td>
                    <td>
                      <span className={`etiquette ${i.statut_inscription}`}>
                        {i.statut_inscription.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <div className="actions-btns">
                        {(i.statut_inscription === "en_attente" || i.statut_inscription === "validee") && (
                          <button type="button" onClick={() => annuler(i)}>Annuler</button>
                        )}
                        {i.statut_inscription === "validee" && (
                          <button type="button" onClick={() => navigate("/mes-formations")}>
                            Voir la formation
                          </button>
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