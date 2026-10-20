import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

export default function Contenu() {
  const toast = useToast();
  const [formations, setFormations] = useState([]);
  const [nouveau, setNouveau] = useState({});
  const [choisie, setChoisie] = useState(null);

  const charger = () =>
    api("/formateur/formations").then(setFormations).catch((e) => toast.erreur(e.message));

  useEffect(() => { charger(); }, []);

  async function creer(e, idFormation) {
    e.preventDefault();
    try {
      await api(`/formateur/formations/${idFormation}/modules`, {
        method: "POST",
        body: nouveau[idFormation],
      });
      toast.ok("Module créé au statut brouillon.");
      setNouveau({ ...nouveau, [idFormation]: { titre: "", description: "" } });
      charger();
    } catch (err) {
      toast.erreur(err.message);
    }
  }

  const courante = choisie ?? formations[0]?.id_formation ?? null;
  const formationCourante = formations.find((f) => f.id_formation === courante);

  return (
    <>
      <h1 style={{ marginBottom: 20 }}>Gérer le contenu pédagogique</h1>

      {formations.length === 0 ? (
        <div className="carte"><p>Aucune session ne vous est affectée pour le moment.</p></div>
      ) : (
        <div className="page-split">
          {/* COLONNE GAUCHE : sélection + création module */}
          <div className="colonne gauche">
            <h2>Mes formations</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {formations.map((f) => (
                <button
                  key={f.id_formation}
                  type="button"
                  onClick={() => setChoisie(f.id_formation)}
                  className={courante === f.id_formation ? "actif" : ""}
                  style={{ textAlign: "left" }}
                >
                  {f.intitule}
                </button>
              ))}
            </div>

            {formationCourante && (
              <>
                <h2 style={{ marginTop: 24 }}>Nouveau module</h2>
                <form onSubmit={(e) => creer(e, formationCourante.id_formation)} className="grille">
                  <label>Titre
                    <input
                      value={nouveau[formationCourante.id_formation]?.titre || ""}
                      onChange={(e) =>
                        setNouveau({
                          ...nouveau,
                          [formationCourante.id_formation]: {
                            ...nouveau[formationCourante.id_formation],
                            titre: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </label>
                  <label>Description
                    <input
                      value={nouveau[formationCourante.id_formation]?.description || ""}
                      onChange={(e) =>
                        setNouveau({
                          ...nouveau,
                          [formationCourante.id_formation]: {
                            ...nouveau[formationCourante.id_formation],
                            description: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                  <button type="submit">Créer</button>
                </form>
              </>
            )}
          </div>

          {/* COLONNE DROITE : liste des modules */}
          <div className="colonne droite">
            {formationCourante ? (
              <>
                <h2>Modules de « {formationCourante.intitule} » ({formationCourante.modules.length})</h2>
                {formationCourante.modules.length === 0 ? (
                  <p style={{ textAlign: "center", padding: 20, color: "#6b6485" }}>
                    Aucun module pour le moment.
                  </p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Titre</th>
                        <th>Statut</th>
                        <th>Accès</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formationCourante.modules.map((m) => (
                        <tr key={m.id_module}>
                          <td><strong>{m.titre}</strong></td>
                          <td><span className={`etiquette ${m.statut_module}`}>{m.statut_module}</span></td>
                          <td>{m.modifiable ? "Modifiable" : "Lecture seule"}</td>
                          <td>
                            <Link to={`/contenu/${m.id_module}`}>
                              <button type="button">Ouvrir</button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            ) : (
              <p style={{ textAlign: "center", padding: 20, color: "#6b6485" }}>
                Sélectionnez une formation.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}