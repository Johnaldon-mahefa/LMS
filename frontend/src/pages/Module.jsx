import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, telecharger } from "../api/client.js";
import Message from "../components/Message.jsx";

// Détail d'un module : leçons, ressources, évaluations, publication (RG8, RG9).
export default function Module() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [m, setM] = useState(null);
  const [msg, setMsg] = useState(null);
  const [lecon, setLecon] = useState({ titre: "", contenu: "" });
  const [evaluation, setEvaluation] = useState({ intitule: "", consigne: "", noteMaximale: 20 });

  const charger = () => api(`/formateur/modules/${id}`).then(setM).catch((e) => setMsg({ erreur: e.message }));
  useEffect(() => { charger(); }, [id]);
  async function agir(fn, texte) { try { await fn(); setMsg({ ok: texte }); await charger(); } catch (e) { setMsg({ erreur: e.message }); } }
  if (!m) return <div className="carte"><Message msg={msg} /></div>;
  const lecture = !m.modifiable;

  return (
    <div className="carte large">
      <p><Link to="/contenu">← Retour aux formations</Link></p>
      <h1>{m.titre} <span className={`etiquette ${m.statut_module}`}>{m.statut_module}</span></h1>
      <p>{m.description}</p>
      <Message msg={msg} />
      {!lecture && (
        <div className="actions">
          {m.statut_module === "brouillon"
            ? <button onClick={() => agir(() => api(`/formateur/modules/${id}/publier`, { method: "PATCH" }), "Module publié.")}>Publier le module</button>
            : <button onClick={() => agir(() => api(`/formateur/modules/${id}/retirer-publication`, { method: "PATCH" }), "Module retiré de la publication.")}>Retirer de la publication</button>}
          {m.statut_module === "brouillon" && <button onClick={async () => { if (window.confirm("Supprimer ce module ?")) { try { await api(`/formateur/modules/${id}`, { method: "DELETE" }); navigate("/contenu"); } catch (e) { setMsg({ erreur: e.message }); } } }}>Supprimer le module</button>}
        </div>)}

      <section className="bloc"><h2>Leçons</h2>
        <ul>{m.lecons.map((l) => <li key={l.id_lecon}><strong>{l.titre}</strong> {l.contenu}
          {!lecture && <button onClick={() => agir(() => api(`/formateur/lecons/${l.id_lecon}`, { method: "DELETE" }), "Leçon supprimée.")}>Supprimer</button>}</li>)}</ul>
        {!lecture && <form className="ligne" onSubmit={(e) => { e.preventDefault(); agir(async () => { await api(`/formateur/modules/${id}/lecons`, { method: "POST", body: lecon }); setLecon({ titre: "", contenu: "" }); }, "Leçon ajoutée."); }}>
          <label>Titre<input value={lecon.titre} onChange={(e) => setLecon({ ...lecon, titre: e.target.value })} required /></label>
          <label>Contenu<input value={lecon.contenu} onChange={(e) => setLecon({ ...lecon, contenu: e.target.value })} /></label>
          <button type="submit">Ajouter la leçon</button></form>}
      </section>

      <section className="bloc"><h2>Ressources</h2>
        <ul>{m.ressources.map((r) => <li key={r.id_ressource}>
          <button className="lien" onClick={() => telecharger(`/fichiers/ressources/${r.id_ressource}`, r.nom_fichier).catch((e) => setMsg({ erreur: e.message }))}>{r.nom_fichier}</button>
          {!lecture && <button onClick={() => agir(() => api(`/formateur/ressources/${r.id_ressource}`, { method: "DELETE" }), "Ressource supprimée.")}>Supprimer</button>}</li>)}</ul>
        {!lecture && <form className="ligne" onSubmit={(e) => { e.preventDefault(); const f = new FormData(); f.append("fichier", e.target.fichier.files[0]); agir(async () => { await api(`/formateur/modules/${id}/ressources`, { method: "POST", form: f }); e.target.reset(); }, "Ressource déposée."); }}>
          <label>Fichier (pdf, doc, ppt, xls, txt, zip, image)<input type="file" name="fichier" required /></label><button type="submit">Déposer</button></form>}
      </section>

      <section className="bloc"><h2>Évaluations</h2>
        <ul>{m.evaluations.map((ev) => <li key={ev.id_evaluation}><strong>{ev.intitule}</strong> (note maximale {ev.note_maximale}) {ev.consigne}
          {!lecture && <button onClick={() => agir(() => api(`/formateur/evaluations/${ev.id_evaluation}`, { method: "DELETE" }), "Évaluation supprimée.")}>Supprimer</button>}</li>)}</ul>
        {!lecture && <form className="ligne" onSubmit={(e) => { e.preventDefault(); agir(async () => { await api(`/formateur/modules/${id}/evaluations`, { method: "POST", body: evaluation }); setEvaluation({ intitule: "", consigne: "", noteMaximale: 20 }); }, "Évaluation créée."); }}>
          <label>Intitulé<input value={evaluation.intitule} onChange={(e) => setEvaluation({ ...evaluation, intitule: e.target.value })} required /></label>
          <label>Consigne<input value={evaluation.consigne} onChange={(e) => setEvaluation({ ...evaluation, consigne: e.target.value })} /></label>
          <label>Note maximale<input type="number" min="1" value={evaluation.noteMaximale} onChange={(e) => setEvaluation({ ...evaluation, noteMaximale: e.target.value })} required /></label>
          <button type="submit">Créer l'évaluation</button></form>}
      </section>
    </div>
  );
}
