import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

export default function Suivi() {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [courante, setCourante] = useState(null);
  const [suivi, setSuivi] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api("/formateur/sessions").then(setSessions).catch((e) => toast.erreur(e.message));
  }, []);

  const ouvrirSession = (s) => {
    setCourante(s);
    setDetail(null);
    api(`/formateur/sessions/${s.id_session}/progression`).then(setSuivi).catch((e) => toast.erreur(e.message));
  };

  const ouvrirApprenant = (id) =>
    api(`/formateur/inscriptions/${id}/detail`).then(setDetail).catch((e) => toast.erreur(e.message));

  return (
    <>
      <h1 style={{ marginBottom: 20 }}>Suivre la progression des apprenants</h1>
      <div className="page-split">
        <div className="colonne gauche">
          <h2>Mes sessions ({sessions.length})</h2>
          {sessions.length === 0 ? (
            <p style={{ textAlign: "center", padding: 20, color: "#6b6485" }}>Aucune session affectée.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sessions.map((s) => (
                <button key={s.id_session} type="button" onClick={() => ouvrirSession(s)} className={courante?.id_session === s.id_session ? "actif" : ""} style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 4 }}>
                  <strong>{s.formation}</strong>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Du {s.date_debut} au {s.date_fin}</span>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>{s.capacite_max - s.places_restantes} apprenant(s)</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="colonne droite">
          {courante ? (
            <>
              <h2>Apprenants de « {courante.formation} »</h2>
              {!suivi ? (
                <p style={{ textAlign: "center", padding: 20, color: "#6b6485" }}>Chargement…</p>
              ) : suivi.apprenants.length === 0 ? (
                <p style={{ textAlign: "center", padding: 20, color: "#6b6485" }}>Aucun apprenant inscrit.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Apprenant</th>
                      <th>Progression</th>
                      <th>À corriger</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {suivi.apprenants.map((a) => (
                      <tr key={a.id_inscription}>
                        <td>{a.prenom} {a.nom}</td>
                        <td><progress value={a.progression} max="100" /> {a.progression} %</td>
                        <td>{a.soumissions_a_corriger}</td>
                        <td><button type="button" onClick={() => ouvrirApprenant(a.id_inscription)}>Détail</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {detail && (
                <section className="bloc">
                  <h2>Détail : {detail.inscription.prenom} {detail.inscription.nom} ({detail.progression} %)</h2>
                  {detail.modules.map((m) => (
                    <div key={m.id_module} style={{ marginBottom: 14 }}>
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
                            
                            {/* AFFICHAGE QCM */}
                            {e.meilleur_score !== null && e.meilleur_score !== undefined ? (
                              <span style={{ color: "#10b981", fontWeight: "bold" }}>
                                QCM fait (Score: {e.meilleur_score}/{e.note_maximale})
                              </span>
                            ) : null}
                            
                            {/* AFFICHAGE PDF */}
                            {e.statut === "corrigee" ? (
                              <span> | PDF : {e.note} / {e.note_maximale}</span>
                            ) : e.statut === "soumise" ? (
                              <span> | PDF : en attente de correction</span>
                            ) : (
                              <span> | PDF : non déposé</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              )}
            </>
          ) : (
            <p style={{ textAlign: "center", padding: 60, color: "#6b6485" }}>← Sélectionnez une session</p>
          )}
        </div>
      </div>
    </>
  );
}