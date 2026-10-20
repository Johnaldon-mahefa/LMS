import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, telecharger } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";

export default function Module() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirmer = useConfirm();

  const [m, setM] = useState(null);
  const [lecon, setLecon] = useState({ titre: "", contenu: "" });
  
  const [evaluation, setEvaluation] = useState({ 
    intitule: "", 
    consigne: "", 
    noteMaximale: 20,
    typeEvaluation: "fichier",
    dureeMinutes: "",
    seuilReussite: "",
    nbTentativesMax: 1
  });

  const charger = () =>
    api(`/formateur/modules/${id}`).then(setM).catch((e) => toast.erreur(e.message));

  useEffect(() => { charger(); }, [id]);

  async function agir(fn, texteOk) {
    try {
      await fn();
      toast.ok(texteOk);
      await charger();
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  if (!m) return <div className="carte" />;
  const lecture = !m.modifiable;

  async function confirmerSuppression(type, id, nom) {
    const ok = await confirmer({
      titre: `Supprimer ${type} ?`,
      message: `« ${nom} » sera supprimé définitivement.`,
      danger: true,
      confirmer: "Supprimer",
    });
    if (!ok) return;
    const urls = {
      module: `/formateur/modules/${id}`,
      lecon: `/formateur/lecons/${id}`,
      ressource: `/formateur/ressources/${id}`,
      evaluation: `/formateur/evaluations/${id}`,
    };
    try {
      await api(urls[type], { method: "DELETE" });
      toast.ok(`${type.charAt(0).toUpperCase() + type.slice(1)} supprimé${type === "lecon" ? "e" : ""}.`);
      if (type === "module") navigate("/contenu");
      else charger();
    } catch (e) { toast.erreur(e.message); }
  }

  async function publier() {
    const ok = await confirmer({
      titre: "Publier ce module ?",
      message: "Les apprenants inscrits pourront consulter son contenu.",
      confirmer: "Publier",
    });
    if (!ok) return;
    agir(() => api(`/formateur/modules/${id}/publier`, { method: "PATCH" }), "Module publié.");
  }

  async function retirerPublication() {
    const ok = await confirmer({
      titre: "Retirer de la publication ?",
      message: "Le module ne sera plus visible des apprenants.",
      danger: true,
      confirmer: "Retirer",
    });
    if (!ok) return;
    agir(() => api(`/formateur/modules/${id}/retirer-publication`, { method: "PATCH" }), "Module retiré de la publication.");
  }

  async function telechargerRessource(r) {
    try {
      await telecharger(`/fichiers/ressources/${r.id_ressource}`, r.nom_fichier);
    } catch (e) {
      toast.erreur(e.message);
    }
  }

  return (
    <div className="carte large">
      <p><Link to="/contenu">← Retour aux formations</Link></p>
      <h1>{m.titre} <span className={`etiquette ${m.statut_module}`}>{m.statut_module}</span></h1>
      <p>{m.description}</p>

      {!lecture && (
        <div className="actions">
          {m.statut_module === "brouillon"
            ? <button type="button" onClick={publier}>Publier le module</button>
            : <button type="button" onClick={retirerPublication}>Retirer de la publication</button>}
          {m.statut_module === "brouillon" && (
            <button type="button" onClick={() => confirmerSuppression("module", id, m.titre)}>Supprimer le module</button>
          )}
        </div>
      )}

      <section className="bloc">
        <h2>Leçons</h2>
        <ul>
          {m.lecons.map((l) => (
            <li key={l.id_lecon}>
              <strong>{l.titre}</strong>
              {!lecture && (
                <button type="button" onClick={() => confirmerSuppression("lecon", l.id_lecon, l.titre)}>Supprimer</button>
              )}
            </li>
          ))}
        </ul>
        {!lecture && (
          <form className="grille" style={{ marginTop: 15 }} onSubmit={(e) => { 
            e.preventDefault(); 
            agir(async () => { 
              await api(`/formateur/modules/${id}/lecons`, { method: "POST", body: lecon }); 
              setLecon({ titre: "", contenu: "" }); 
            }, "Leçon ajoutée."); 
          }}>
            <label>Titre de la leçon
              <input value={lecon.titre} onChange={(e) => setLecon({ ...lecon, titre: e.target.value })} required />
            </label>
            <label>Contenu (Markdown supporté : # Titre, **gras**, - liste)
              <textarea 
                value={lecon.contenu} 
                onChange={(e) => setLecon({ ...lecon, contenu: e.target.value })} 
                rows={8}
                placeholder="Écrivez votre cours ici... Exemple :&#10;# Introduction&#10;Docker est un outil de **conteneurisation**."
                style={{ width: "100%", padding: 10, borderRadius: 5, fontFamily: "monospace" }}
              />
            </label>
            <button type="submit" style={{ marginTop: 10 }}>Ajouter la leçon</button>
          </form>
        )}
      </section>

      <section className="bloc">
        <h2>Ressources</h2>
        <ul>
          {m.ressources.map((r) => (
            <li key={r.id_ressource}>
              <button type="button" className="lien" onClick={() => telechargerRessource(r)}>{r.nom_fichier}</button>
              {!lecture && (
                <button type="button" onClick={() => confirmerSuppression("ressource", r.id_ressource, r.nom_fichier)}>Supprimer</button>
              )}
            </li>
          ))}
        </ul>
        {!lecture && (
          <form className="ligne" onSubmit={(e) => { e.preventDefault(); const f = new FormData(); f.append("fichier", e.target.fichier.files[0]); agir(async () => { await api(`/formateur/modules/${id}/ressources`, { method: "POST", form: f }); e.target.reset(); }, "Ressource déposée."); }}>
            <label>Fichier (pdf, doc, ppt, xls, txt, zip, image)<input type="file" name="fichier" required /></label>
            <button type="submit">Déposer</button>
          </form>
        )}
      </section>

      <section className="bloc">
        <h2>Évaluations</h2>
        <ul>
          {m.evaluations.map((ev) => {
            const typeEval = ev.type_evaluation ? ev.type_evaluation.toLowerCase() : "fichier";
            return (
              <li key={ev.id_evaluation}>
                <strong>{ev.intitule}</strong> 
                <span className={`etiquette ${typeEval === 'qcm' ? 'publie' : 'brouillon'}`} style={{ margin: "0 8px" }}>
                  {typeEval === 'fichier' ? 'PDF' : typeEval === 'qcm' ? 'QCM' : 'Mixte'}
                </span>
                (note max {ev.note_maximale}) {ev.consigne}
                
                {!lecture && (
                  <div style={{ display: "inline-block", marginLeft: "15px" }}>
                    <button type="button" onClick={() => confirmerSuppression("evaluation", ev.id_evaluation, ev.intitule)}>
                      Supprimer
                    </button>
                    
                    {(typeEval === 'qcm' || typeEval === 'mixte') && (
                      <Link to={`/formateur/qcm/${ev.id_evaluation}`} style={{ marginLeft: 10 }}>
                        <button type="button">
                          Gérer les questions
                        </button>
                      </Link>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        
        {!lecture && (
          <form className="grille" style={{ marginTop: 15 }} onSubmit={(e) => { 
            e.preventDefault(); 
            agir(async () => { 
              await api(`/formateur/modules/${id}/evaluations`, { method: "POST", body: evaluation }); 
              setEvaluation({ intitule: "", consigne: "", noteMaximale: 20, typeEvaluation: "fichier", dureeMinutes: "", seuilReussite: "", nbTentativesMax: 1 }); 
            }, "Évaluation créée."); 
          }}>
            <label>Intitulé
              <input value={evaluation.intitule} onChange={(e) => setEvaluation({ ...evaluation, intitule: e.target.value })} required />
            </label>
            
            <label>Type d'évaluation
              <select value={evaluation.typeEvaluation} onChange={(e) => setEvaluation({ ...evaluation, typeEvaluation: e.target.value })}>
                <option value="fichier">Dépôt de fichier (PDF)</option>
                <option value="qcm">QCM Interactif</option>
                <option value="mixte">Mixte (PDF + QCM)</option>
              </select>
            </label>

            <label>Consigne
              <input value={evaluation.consigne} onChange={(e) => setEvaluation({ ...evaluation, consigne: e.target.value })} />
            </label>
            
            <label>Note maximale
              <input type="number" min="1" value={evaluation.noteMaximale} onChange={(e) => setEvaluation({ ...evaluation, noteMaximale: e.target.value })} required />
            </label>

            {(evaluation.typeEvaluation === 'qcm' || evaluation.typeEvaluation === 'mixte') && (
              <>
                <label>Durée (minutes)
                  <input type="number" min="1" placeholder="Ex: 30" value={evaluation.dureeMinutes} onChange={(e) => setEvaluation({ ...evaluation, dureeMinutes: e.target.value })} required />
                </label>
                <label>Seuil de réussite (%)
                  <input type="number" min="0" max="100" placeholder="Ex: 50" value={evaluation.seuilReussite} onChange={(e) => setEvaluation({ ...evaluation, seuilReussite: e.target.value })} required />
                </label>
                <label>Nombre de tentatives max
                  <input type="number" min="1" value={evaluation.nbTentativesMax} onChange={(e) => setEvaluation({ ...evaluation, nbTentativesMax: e.target.value })} required />
                </label>
              </>
            )}

            <button type="submit" style={{ marginTop: 10 }}>Créer l'évaluation</button>
          </form>
        )}
      </section>
    </div>
  );
}