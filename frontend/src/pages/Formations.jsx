import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Message from "../components/Message.jsx";

// Cas d'utilisation « Organiser les formations » : formations, sessions, affectation des formateurs (RG3, RG4, RG5).
export default function Formations() {
  const [formations, setFormations] = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [ouverte, setOuverte] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ intitule: "", description: "", duree: "", publicVise: "" });
  const [session, setSession] = useState({ dateDebut: "", dateFin: "", capaciteMax: "" });

  const charger = () => api("/admin/formations").then(setFormations).catch((e) => setMsg({ erreur: e.message }));
  const chargerSessions = (id) => api(`/admin/formations/${id}`).then((d) => setSessions(d.sessions));
  useEffect(() => { charger(); api("/utilisateurs").then((u) => setFormateurs(u.filter((x) => x.roles.includes("formateur") && x.statut_compte === "actif"))); }, []);

  async function agir(fn, texte) {
    try { await fn(); setMsg({ ok: texte }); await charger(); if (ouverte) await chargerSessions(ouverte); }
    catch (e) { setMsg({ erreur: e.message }); }
  }
  const ouvrir = (id) => { setOuverte(ouverte === id ? null : id); if (ouverte !== id) chargerSessions(id); };

  return (
    <div className="carte large">
      <h1>Organiser les formations</h1>
      <Message msg={msg} />
      <form className="grille" onSubmit={(e) => { e.preventDefault(); agir(async () => { await api("/admin/formations", { method: "POST", body: form }); setForm({ intitule: "", description: "", duree: "", publicVise: "" }); }, "Formation créée au statut brouillon."); }}>
        <label>Intitulé<input value={form.intitule} onChange={(e) => setForm({ ...form, intitule: e.target.value })} required /></label>
        <label>Durée (heures)<input type="number" value={form.duree} onChange={(e) => setForm({ ...form, duree: e.target.value })} /></label>
        <label>Description<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label>Public visé<input value={form.publicVise} onChange={(e) => setForm({ ...form, publicVise: e.target.value })} /></label>
        <button type="submit">Créer la formation</button>
      </form>

      {formations.map((f) => (
        <section key={f.id_formation} className="bloc">
          <h2>{f.intitule} <span className={`etiquette ${f.statut_formation}`}>{f.statut_formation}</span></h2>
          <p>{f.nb_sessions} session(s), {f.nb_modules_publies}/{f.nb_modules} module(s) publié(s)</p>
          <div className="actions">
            <button onClick={() => ouvrir(f.id_formation)}>{ouverte === f.id_formation ? "Masquer les sessions" : "Sessions"}</button>
            {f.statut_formation !== "publiee" && f.statut_formation !== "archivee" && <button onClick={() => agir(() => api(`/admin/formations/${f.id_formation}/publier`, { method: "PATCH" }), "Formation publiée.")}>Publier</button>}
            {f.statut_formation !== "archivee" && <button onClick={() => agir(() => api(`/admin/formations/${f.id_formation}/archiver`, { method: "PATCH" }), "Formation archivée.")}>Archiver</button>}
            <button onClick={() => window.confirm("Supprimer cette formation ?") && agir(() => api(`/admin/formations/${f.id_formation}`, { method: "DELETE" }), "Formation supprimée.")}>Supprimer</button>
          </div>

          {ouverte === f.id_formation && (
            <div className="sous-bloc">
              <table>
                <thead><tr><th>Début</th><th>Fin</th><th>Places restantes</th><th>Formateurs</th><th></th></tr></thead>
                <tbody>{sessions.map((s) => (
                  <tr key={s.id_session}>
                    <td>{s.date_debut}</td><td>{s.date_fin}</td><td>{s.places_restantes} / {s.capacite_max}</td>
                    <td>{s.formateurs.map((x) => (
                      <span key={x.id_utilisateur} className="puce">{x.prenom} {x.nom}
                        <button onClick={() => agir(() => api(`/admin/sessions/${s.id_session}/formateurs/${x.id_utilisateur}`, { method: "DELETE" }), "Formateur retiré.")}>×</button></span>))}
                      <select defaultValue="" onChange={(e) => { if (e.target.value) agir(() => api(`/admin/sessions/${s.id_session}/formateurs`, { method: "POST", body: { idFormateur: Number(e.target.value) } }), "Formateur affecté."); e.target.value = ""; }}>
                        <option value="">Affecter un formateur…</option>
                        {formateurs.map((x) => <option key={x.id_utilisateur} value={x.id_utilisateur}>{x.prenom} {x.nom}</option>)}
                      </select></td>
                    <td><button onClick={() => window.confirm("Supprimer cette session ?") && agir(() => api(`/admin/sessions/${s.id_session}`, { method: "DELETE" }), "Session supprimée.")}>Supprimer</button></td>
                  </tr>))}</tbody>
              </table>
              <form className="ligne" onSubmit={(e) => { e.preventDefault(); agir(() => api(`/admin/formations/${f.id_formation}/sessions`, { method: "POST", body: session }), "Session créée."); }}>
                <label>Début<input type="date" value={session.dateDebut} onChange={(e) => setSession({ ...session, dateDebut: e.target.value })} required /></label>
                <label>Fin<input type="date" value={session.dateFin} onChange={(e) => setSession({ ...session, dateFin: e.target.value })} required /></label>
                <label>Capacité<input type="number" min="1" value={session.capaciteMax} onChange={(e) => setSession({ ...session, capaciteMax: e.target.value })} required /></label>
                <button type="submit">Ajouter une session</button>
              </form>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
