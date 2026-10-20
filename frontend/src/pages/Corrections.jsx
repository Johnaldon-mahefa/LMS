import { useEffect, useState } from "react";
import { api, telecharger } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import Loading from "../components/Loading.jsx";

export default function Corrections() {
  const toast = useToast();
  const confirmer = useConfirm();

  const [liste, setListe] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [choisie, setChoisie] = useState(null);
  const [correction, setCorrection] = useState({ note: "", commentaire: "" });

  const charger = () => {
    const debut = Date.now();
    return api("/formateur/soumissions/a-corriger")
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

  async function enregistrer(e) {
    e.preventDefault();
    const ok = await confirmer({
      titre: "Enregistrer cette correction ?",
      message: `Note : ${correction.note} / ${choisie.note_maximale}. Après validation, la note ne pourra plus être modifiée.`,
      confirmer: "Enregistrer",
    });
    if (!ok) return;
    try {
      await api(`/formateur/soumissions/${choisie.id_soumission}/correction`, {
        method: "PUT",
        body: correction,
      });
      toast.ok("Correction enregistrée.");
      setChoisie(null);
      setCorrection({ note: "", commentaire: "" });
      charger();
    } catch (err) {
      toast.erreur(err.message);
    }
  }

  async function telechargerTravail(s) {
    try {
      await telecharger(`/fichiers/soumissions/${s.id_soumission}`, s.nom_fichier);
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  return (
    <>
      <h1 style={{ marginBottom: 20 }}>Corriger les soumissions</h1>

      <div className="page-split">
        {/* COLONNE GAUCHE : liste des soumissions */}
        <div className="colonne gauche">
          <h2>Soumissions à corriger ({liste.length})</h2>
          {chargement ? (
            <Loading texte="Chargement…" />
          ) : liste.length === 0 ? (
            <p style={{ textAlign: "center", padding: 20, color: "#6b6485" }}>
              Aucune soumission en attente.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {liste.map((s) => (
                <button
                  key={s.id_soumission}
                  type="button"
                  onClick={() => { setChoisie(s); setCorrection({ note: "", commentaire: "" }); }}
                  className={choisie?.id_soumission === s.id_soumission ? "actif" : ""}
                  style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <strong>{s.prenom} {s.nom}</strong>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>{s.evaluation}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* COLONNE DROITE : détail + correction */}
        <div className="colonne droite">
          {choisie ? (
            <>
              <h2>Correction : {choisie.prenom} {choisie.nom}</h2>
              <p style={{ marginBottom: 8 }}><strong>{choisie.evaluation}</strong></p>
              {choisie.consigne && (
                <p style={{ color: "#6b6485", marginBottom: 14, fontSize: 14 }}>{choisie.consigne}</p>
              )}

              <p style={{ marginBottom: 20 }}>
                <button type="button" className="lien" onClick={() => telechargerTravail(choisie)}>
                  📎 Télécharger le travail ({choisie.nom_fichier})
                </button>
              </p>

              <form onSubmit={enregistrer} className="grille">
                <label>Note (sur {choisie.note_maximale})
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max={choisie.note_maximale}
                    value={correction.note}
                    onChange={(e) => setCorrection({ ...correction, note: e.target.value })}
                    required
                  />
                </label>
                <label>Commentaire
                  <textarea
                    value={correction.commentaire}
                    onChange={(e) => setCorrection({ ...correction, commentaire: e.target.value })}
                    rows={4}
                  />
                </label>
                <button type="submit">Enregistrer la correction</button>
              </form>
            </>
          ) : (
            <p style={{ textAlign: "center", padding: 60, color: "#6b6485" }}>
              ← Sélectionnez une soumission à corriger
            </p>
          )}
        </div>
      </div>
    </>
  );
}