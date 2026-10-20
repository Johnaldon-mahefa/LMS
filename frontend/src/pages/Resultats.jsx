import { useEffect, useState } from "react";
import { api, telecharger } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";

export default function Resultats() {
  const toast = useToast();
  const confirmer = useConfirm();

  const [liste, setListe] = useState([]);
  const [courante, setCourante] = useState(null);
  const [r, setR] = useState(null);

  useEffect(() => {
    api("/apprenant/formations")
      .then((data) => {
        setListe(data);
        if (data[0]) setCourante(data[0].id_inscription);
      })
      .catch((e) => toast.erreur(e.message));
  }, []);

  useEffect(() => {
    if (!courante) return;
    api(`/apprenant/inscriptions/${courante}/resultats`)
      .then(setR)
      .catch((e) => toast.erreur(e.message));
  }, [courante]);

  async function demanderAttestation() {
    const ok = await confirmer({
      titre: "Demander votre attestation ?",
      message: `Une attestation numérotée sera générée pour la formation « ${r.inscription.formation} ».`,
      confirmer: "Obtenir l'attestation",
    });
    if (!ok) return;
    try {
      await api(`/apprenant/inscriptions/${courante}/attestation`, { method: "POST" });
      toast.ok("Félicitations ! Votre attestation est délivrée.");
      const data = await api(`/apprenant/inscriptions/${courante}/resultats`);
      setR(data);
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  async function telechargerAttestation() {
    try {
      await telecharger(
        `/apprenant/inscriptions/${courante}/attestation/pdf`,
        `${r.attestation.numero_attestation}.pdf`
      );
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  return (
    <>
      <h1 style={{ marginBottom: 20 }}>Mes résultats</h1>

      {liste.length === 0 ? (
        <div className="carte">
          <p style={{ textAlign: "center", padding: 20, color: "#6b6485" }}>
            Aucune inscription validée.
          </p>
        </div>
      ) : (
        <div className="page-split">
          {/* COLONNE GAUCHE : sélection formation */}
          <div className="colonne gauche">
            <h2>Mes formations</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {liste.map((i) => (
                <button
                  key={i.id_inscription}
                  type="button"
                  onClick={() => setCourante(i.id_inscription)}
                  className={courante === i.id_inscription ? "actif" : ""}
                  style={{ textAlign: "left" }}
                >
                  {i.formation}
                </button>
              ))}
            </div>
          </div>

          {/* COLONNE DROITE : résultats */}
          <div className="colonne droite">
            {r ? (
              <>
                <h2>{r.inscription.formation} — {r.progression} %</h2>
                <div style={{ marginBottom: 20 }}>
                  <progress value={r.progression} max="100" style={{ width: "100%" }} />
                </div>
                <p style={{ color: "#6b6485", fontSize: 13, marginBottom: 16 }}>
                  Seuil de réussite d'un module : {r.seuil} % de moyenne.
                </p>

                {r.modules.map((m) => (
                  <div key={m.id_module} style={{ marginBottom: 18 }}>
                    <h3>
                      {m.titre}{" "}
                      <span className={`etiquette ${m.valide ? "validee" : "en_attente"}`}>
                        {m.valide ? "validé" : "non validé"}
                      </span>
                    </h3>
                    <ul>
                      {m.evaluations.map((e) => (
                        <li key={e.id_evaluation}>
                          {e.intitule} :{" "}
                          {e.statut === "corrigee"
                            ? `${e.note} / ${e.note_maximale}${e.commentaire ? ` (${e.commentaire})` : ""}`
                            : e.statut === "soumise"
                            ? "en attente de correction"
                            : "non déposé"}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="actions" style={{ marginTop: 20 }}>
                  {r.attestation ? (
                    <button type="button" onClick={telechargerAttestation}>
                      Télécharger l'attestation {r.attestation.numero_attestation}
                    </button>
                  ) : (
                    <button type="button" onClick={demanderAttestation}>
                      Obtenir mon attestation
                    </button>
                  )}
                </div>

                {!r.attestation && !r.eligible && (
                  <p style={{ marginTop: 12, color: "#6b6485", fontSize: 13 }}>
                    L'attestation sera disponible lorsque tous les modules publiés seront validés.
                  </p>
                )}
              </>
            ) : (
              <p style={{ textAlign: "center", padding: 60, color: "#6b6485" }}>
                ← Sélectionnez une formation
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}