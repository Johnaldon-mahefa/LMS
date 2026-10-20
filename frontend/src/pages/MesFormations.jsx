import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, telecharger } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import ReactMarkdown from "react-markdown";

export function MesFormations() {
  const toast = useToast();
  const [liste, setListe] = useState([]);

  useEffect(() => {
    api("/apprenant/formations").then(setListe).catch((e) => toast.erreur(e.message));
  }, []);

  return (
    <>
      <h1 style={{ marginBottom: 20 }}>Mes formations</h1>
      {liste.length === 0 ? (
        <div className="carte">
          <p style={{ textAlign: "center", padding: 20, color: "#6b6485" }}>
            Aucune inscription validée. Demandez votre inscription depuis le catalogue.
          </p>
        </div>
      ) : (
        <div className="grille-cartes">
          {liste.map((i) => (
            <Link key={i.id_inscription} to={`/mes-formations/${i.id_inscription}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="carte survol">
                <h2>{i.formation}</h2>
                <p style={{ color: "#6b6485", fontSize: 13, margin: "6px 0 12px" }}>Session du {i.date_debut}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <progress value={i.progression} max="100" style={{ flex: 1 }} />
                  <strong>{i.progression} %</strong>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export function ContenuFormation() {
  const { id } = useParams();
  const toast = useToast();
  const confirmer = useConfirm();
  const [c, setC] = useState(null);

  const charger = () => api(`/apprenant/inscriptions/${id}/contenu`).then(setC).catch((e) => toast.erreur(e.message));

  useEffect(() => { charger(); }, [id]);

  async function deposer(e, idEvaluation) {
    e.preventDefault();
    const fichier = e.target.fichier.files[0];
    if (!fichier) return toast.erreur("Choisissez un fichier.");
    const ok = await confirmer({ titre: "Confirmer le dépôt ?", message: "Après le dépôt, votre travail ne pourra plus être modifié.", confirmer: "Déposer" });
    if (!ok) return;
    const f = new FormData();
    f.append("fichier", fichier);
    f.append("idInscription", id);
    try {
      await api(`/apprenant/evaluations/${idEvaluation}/soumissions`, { method: "POST", form: f });
      toast.ok("Travail déposé.");
      charger();
    } catch (err) { toast.erreur(err.message); }
  }

  async function telechargerRessource(r) {
    try { await telecharger(`/fichiers/ressources/${r.id_ressource}`, r.nom_fichier); } catch (e) { toast.erreur(e.message); }
  }

  // NOUVELLE FONCTION : Faire défiler jusqu'au module suivant
  const scrollToModule = (index) => {
    const element = document.getElementById(`module-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!c) return <div className="carte" />;

  return (
    <div className="page-lecture">
      <p style={{ marginBottom: 10 }}>
        <Link to="/mes-formations" className="lien-btn">← Retour à mes formations</Link>
      </p>
      <h1 style={{ marginBottom: 30, fontSize: 32, color: "#4c1d95" }}>{c.inscription.formation}</h1>

      {c.modules.length === 0 && <div className="carte"><p>Aucun module publié.</p></div>}

      {c.modules.map((m, index) => (
        <div key={m.id_module} id={`module-${index}`} className="bloc-module-complet" style={{ marginBottom: 50 }}>
          
          <div className="entete-module">
            <h2>{m.titre}</h2>
            {m.description && <p>{m.description}</p>}
          </div>

          <div className="section-lecons">
            {m.lecons.map((l) => (
              <article key={l.id_lecon} className="carte-lecon">
                <h3 className="lecon-titre">{l.titre}</h3>
                <div className="markdown-content">
                  <ReactMarkdown>{l.contenu || ""}</ReactMarkdown>
                </div>
              </article>
            ))}
          </div>

          {m.ressources.length > 0 && (
            <div className="bloc-ressources">
              <h4 style={{ fontSize: 18, marginBottom: 15 }}>📎 Ressources de ce module</h4>
              <ul style={{ display: "flex", flexWrap: "wrap", gap: 10, listStyle: "none", padding: 0 }}>
                {m.ressources.map((r) => (
                  <li key={r.id_ressource}>
                    <button type="button" className="btn-ressource" onClick={() => telechargerRessource(r)}>
                      {r.nom_fichier}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {m.evaluations.length > 0 && (
            <div className="section-evaluations-module">
              <h3 className="titre-evaluations">📝 Évaluations du module</h3>
              {m.evaluations.map((e) => {
                const typeEval = e.type_evaluation ? e.type_evaluation.toLowerCase() : "fichier";
                return (
                  <div key={e.id_evaluation} className="carte-evaluation">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <strong style={{ fontSize: 18 }}>{e.intitule}</strong>
                      <span className={`etiquette ${typeEval === 'qcm' ? 'publie' : 'brouillon'}`}>
                        {typeEval === 'fichier' ? 'PDF' : typeEval === 'qcm' ? 'QCM' : 'Mixte'}
                      </span>
                      <span className="muted">(note max {e.note_maximale})</span>
                    </div>
                    {e.consigne && <p style={{ color: "#6b6485", marginBottom: 15 }}>{e.consigne}</p>}

                    {e.meilleur_score !== null && e.meilleur_score !== undefined && (
                      <p style={{ fontWeight: "bold", color: "#10b981", marginBottom: 15 }}>
                        ✅ Score QCM obtenu : {e.meilleur_score} / {e.note_maximale}
                      </p>
                    )}

                    {(typeEval === 'qcm' || typeEval === 'mixte') && (
                      <div style={{ marginBottom: 15 }}>
                        <Link to={`/apprenant/qcm/${e.id_evaluation}`}>
                          <button type="button" className="btn-action-principal">
                            {e.meilleur_score !== null ? "Repasser le QCM" : "Passer le QCM"}
                          </button>
                        </Link>
                      </div>
                    )}

                    {(typeEval === 'fichier' || typeEval === 'mixte') && (
                      <>
                        {e.soumission ? (
                          <p style={{ padding: 15, backgroundColor: "#f8f8f8", borderRadius: 8, fontSize: 14 }}>
                            Travail déposé le {e.soumission.date_depot} : {e.soumission.statut_soumission === "corrigee" ? `corrigé, note ${e.soumission.note} / ${e.note_maximale}.` : "en attente de correction."}
                          </p>
                        ) : (
                          <form className="form-depot" onSubmit={(ev) => deposer(ev, e.id_evaluation)}>
                            <label style={{ display: "block", marginBottom: 10 }}>Déposer mon travail (PDF) :</label>
                            <input type="file" name="fichier" required style={{ display: "block", marginBottom: 10 }} />
                            <button type="submit" className="btn-action-secondaire">Déposer le fichier</button>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* BOUTON SUIVANT À LA FIN DU MODULE */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 40, paddingTop: 20, borderTop: "1px dashed #e5e7eb" }}>
            {index < c.modules.length - 1 ? (
              <button 
                type="button" 
                className="btn-suivant"
                onClick={() => scrollToModule(index + 1)}
              >
                Continuer vers le module suivant →
              </button>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#10b981", fontWeight: "bold", marginBottom: 15 }}>🎉 Félicitations, vous avez terminé tous les modules !</p>
                <Link to="/mes-formations">
                  <button type="button" className="btn-action-secondaire">Retour à mes formations</button>
                </Link>
              </div>
            )}
          </div>

        </div>
      ))}
    </div>
  );
}