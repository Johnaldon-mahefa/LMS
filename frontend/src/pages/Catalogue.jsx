import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";

export default function Catalogue() {
  const toast = useToast();
  const confirmer = useConfirm();
  const navigate = useNavigate();

  const [formations, setFormations] = useState([]);
  const [mes, setMes] = useState([]);

  const charger = () => {
    api("/apprenant/catalogue").then(setFormations).catch((e) => toast.erreur(e.message));
    api("/apprenant/inscriptions").then(setMes);
  };
  useEffect(() => { charger(); }, []);

  async function demander(f, s) {
    const ok = await confirmer({
      titre: "Demander votre inscription ?",
      message: `Formation « ${f.intitule} », session du ${s.date_debut}. Votre demande sera examinée par l'administrateur.`,
      confirmer: "Envoyer la demande",
    });
    if (!ok) return;
    try {
      await api("/apprenant/inscriptions", { method: "POST", body: { idSession: s.id_session } });
      toast.ok("Demande envoyée. Elle sera examinée par l'administrateur.");
      charger();
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  return (
    <>
      <h1 style={{ marginBottom: 20 }}>Catalogue des formations</h1>

      <div className="page-split">
        {/* COLONNE GAUCHE : actions */}
        <div className="colonne gauche">
          <h2>Mes inscriptions</h2>
          <p style={{ fontSize: 13, color: "#6b6485", marginBottom: 14 }}>
            Suivez le statut de vos demandes et annulez-les si besoin.
          </p>
          <button type="button" onClick={() => navigate("/mes-inscriptions")} style={{ width: "100%" }}>
            Voir mes inscriptions ({mes.length})
          </button>
        </div>

        {/* COLONNE DROITE : catalogue */}
        <div className="colonne droite">
          <h2>Formations disponibles ({formations.length})</h2>

          {formations.length === 0 ? (
            <p style={{ textAlign: "center", padding: 20, color: "#6b6485" }}>
              Aucune formation n'est publiée pour le moment.
            </p>
          ) : (
            formations.map((f) => (
              <section key={f.id_formation} className="bloc">
                <h2>{f.intitule}</h2>
                <p>{f.description} {f.duree ? `(${f.duree} h)` : ""}</p>
                <table>
                  <thead>
                    <tr>
                      <th>Début</th>
                      <th>Fin</th>
                      <th>Places</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.sessions.map((s) => (
                      <tr key={s.id_session}>
                        <td>{s.date_debut}</td>
                        <td>{s.date_fin}</td>
                        <td>{s.places_restantes}</td>
                        <td>
                          <button type="button" onClick={() => demander(f, s)}>
                            Demander mon inscription
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))
          )}
        </div>
      </div>
    </>
  );
}