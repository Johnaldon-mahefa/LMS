import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, telecharger } from "../api/client.js";
import Message from "../components/Message.jsx";

// Cas d'utilisation « Consulter le contenu de ses formations » : liste des formations suivies (RG8, RG13).
export function MesFormations() {
  const [liste, setListe] = useState([]);
  const [msg, setMsg] = useState(null);
  useEffect(() => { api("/apprenant/formations").then(setListe).catch((e) => setMsg({ erreur: e.message })); }, []);
  return (
    <div className="carte large">
      <h1>Mes formations</h1>
      <Message msg={msg} />
      {liste.length === 0 && <p>Aucune inscription validée. Demandez votre inscription depuis le catalogue.</p>}
      <ul>{liste.map((i) => <li key={i.id_inscription}><Link to={`/mes-formations/${i.id_inscription}`}>{i.formation}</Link> ({i.date_debut}) <progress value={i.progression} max="100" /> {i.progression} %</li>)}</ul>
    </div>
  );
}

// Contenu d'une formation suivie et cas d'utilisation « Soumettre une évaluation » (RG10).
export function ContenuFormation() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [msg, setMsg] = useState(null);
  const charger = () => api(`/apprenant/inscriptions/${id}/contenu`).then(setC).catch((e) => setMsg({ erreur: e.message }));
  useEffect(() => { charger(); }, [id]);

  async function deposer(e, idEvaluation) {
    e.preventDefault();
    const fichier = e.target.fichier.files[0];
    if (!window.confirm("Confirmer le dépôt ? Le travail ne sera plus modifiable après le dépôt.")) return;
    const f = new FormData(); f.append("fichier", fichier); f.append("idInscription", id);
    try { await api(`/apprenant/evaluations/${idEvaluation}/soumissions`, { method: "POST", form: f }); setMsg({ ok: "Travail déposé." }); charger(); }
    catch (err) { setMsg({ erreur: err.message }); }
  }

  if (!c) return <div className="carte"><Message msg={msg} /></div>;
  return (
    <div className="carte large">
      <p><Link to="/mes-formations">← Mes formations</Link></p>
      <h1>{c.inscription.formation}</h1>
      <Message msg={msg} />
      {c.modules.length === 0 && <p>Aucun module n'est encore publié.</p>}
      {c.modules.map((m) => (
        <section key={m.id_module} className="bloc">
          <h2>{m.titre}</h2><p>{m.description}</p>
          <h3>Leçons</h3><ul>{m.lecons.map((l) => <li key={l.id_lecon}><strong>{l.titre}</strong> {l.contenu}</li>)}</ul>
          {m.ressources.length > 0 && <><h3>Ressources</h3><ul>{m.ressources.map((r) => <li key={r.id_ressource}>
            <button className="lien" onClick={() => telecharger(`/fichiers/ressources/${r.id_ressource}`, r.nom_fichier).catch((e) => setMsg({ erreur: e.message }))}>{r.nom_fichier}</button></li>)}</ul></>}
          <h3>Évaluations</h3>
          {m.evaluations.map((e) => (
            <div key={e.id_evaluation} className="sous-bloc">
              <strong>{e.intitule}</strong> (note maximale {e.note_maximale}) {e.consigne}
              {e.soumission
                ? <p>Travail déposé le {e.soumission.date_depot} : {e.soumission.statut_soumission === "corrigee" ? `corrigé, note ${e.soumission.note} / ${e.note_maximale}. ${e.soumission.commentaire || ""}` : "en attente de correction."}</p>
                : <form className="ligne" onSubmit={(ev) => deposer(ev, e.id_evaluation)}><label>Mon travail<input type="file" name="fichier" required /></label><button type="submit">Déposer</button></form>}
            </div>))}
        </section>))}
    </div>
  );
}
