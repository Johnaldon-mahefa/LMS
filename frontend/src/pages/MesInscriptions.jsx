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
      message: i.statut_inscription === "en_attente"
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
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h1 className="h3 fw-bold mb-0">Mes inscriptions</h1>
        <button className="btn btn-primary" onClick={() => navigate("/catalogue")}>
          <i className="bi bi-search me-2"></i> Parcourir le catalogue
        </button>
      </div>

      <div className="filtres-haut mb-4">
        <button type="button" onClick={() => setFiltre("toutes")} className={filtre === "toutes" ? "actif" : ""}>Toutes ({liste.length})</button>
        <button type="button" onClick={() => setFiltre("en_attente")} className={filtre === "en_attente" ? "actif" : ""}>En attente ({compte("en_attente")})</button>
        <button type="button" onClick={() => setFiltre("validee")} className={filtre === "validee" ? "actif" : ""}>Validées ({compte("validee")})</button>
        <button type="button" onClick={() => setFiltre("refusee")} className={filtre === "refusee" ? "actif" : ""}>Refusées ({compte("refusee")})</button>
        <button type="button" onClick={() => setFiltre("annulee")} className={filtre === "annulee" ? "actif" : ""}>Annulées ({compte("annulee")})</button>
        <input type="search" placeholder="Rechercher par formation..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
      </div>

      {chargement ? (
        <Loading texte="Chargement…" />
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Formation</th>
                    <th>Début de session</th>
                    <th>Date de demande</th>
                    <th>Statut</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listeFiltree.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        Aucune inscription trouvée.
                      </td>
                    </tr>
                  ) : (
                    listeFiltree.map((i) => (
                      <tr key={i.id_inscription}>
                        <td className="fw-bold text-dark">{i.formation}</td>
                        <td>{new Date(i.date_debut).toLocaleDateString('fr-FR')}</td>
                        <td>{new Date(i.date_inscription).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <span className={`etiquette ${i.statut_inscription}`}>
                            {i.statut_inscription.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2 justify-content-end">
                            {i.statut_inscription === "validee" && (
                              <button type="button" className="btn-ghost" onClick={() => navigate("/mes-formations")}>
                                <i className="bi bi-play-circle me-1"></i> Accéder
                              </button>
                            )}
                            {(i.statut_inscription === "en_attente" || i.statut_inscription === "validee") && (
                              <button type="button" className="btn-ghost-danger" onClick={() => annuler(i)}>
                                <i className="bi bi-x-circle me-1"></i> Annuler
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
    </div>
  );
}