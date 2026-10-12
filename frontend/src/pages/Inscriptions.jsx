import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Message from "../components/Message.jsx";

// Cas d'utilisation « Gérer les inscriptions » (RG6, RG7).
export default function Inscriptions() {
  const [liste, setListe] = useState([]);
  const [apprenants, setApprenants] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [direct, setDirect] = useState({ idApprenant: "", idSession: "" });
  const [msg, setMsg] = useState(null);

  const charger = () => api("/admin/inscriptions").then(setListe).catch((e) => setMsg({ erreur: e.message }));
  useEffect(() => {
    charger();
    api("/utilisateurs").then((u) => setApprenants(u.filter((x) => x.roles.includes("apprenant") && x.statut_compte === "actif")));
    api("/admin/formations").then(async (fs) => {
      const toutes = [];
      for (const f of fs.filter((x) => x.statut_formation === "publiee")) toutes.push(...(await api(`/admin/formations/${f.id_formation}`)).sessions);
      setSessions(toutes);
    });
  }, []);

  async function agir(fn, texte) { try { await fn(); setMsg({ ok: texte }); await charger(); } catch (e) { setMsg({ erreur: e.message }); } }
  const action = (id, verbe, texte) => agir(() => api(`/admin/inscriptions/${id}/${verbe}`, { method: "PATCH" }), texte);

  return (
    <div className="carte large">
      <h1>Gérer les inscriptions</h1>
      <Message msg={msg} />
      <form className="ligne" onSubmit={(e) => { e.preventDefault(); agir(() => api("/admin/inscriptions/directe", { method: "POST", body: { idApprenant: Number(direct.idApprenant), idSession: Number(direct.idSession) } }), "Apprenant inscrit."); }}>
        <label>Inscription directe
          <select value={direct.idApprenant} onChange={(e) => setDirect({ ...direct, idApprenant: e.target.value })} required>
            <option value="">Apprenant…</option>{apprenants.map((a) => <option key={a.id_utilisateur} value={a.id_utilisateur}>{a.prenom} {a.nom}</option>)}</select></label>
        <label>Session
          <select value={direct.idSession} onChange={(e) => setDirect({ ...direct, idSession: e.target.value })} required>
            <option value="">Session…</option>{sessions.map((s) => <option key={s.id_session} value={s.id_session}>{s.formation} ({s.date_debut})</option>)}</select></label>
        <button type="submit">Inscrire</button>
      </form>
      <table>
        <thead><tr><th>Apprenant</th><th>Formation</th><th>Session</th><th>Places restantes</th><th>Statut</th><th></th></tr></thead>
        <tbody>{liste.map((i) => (
          <tr key={i.id_inscription}>
            <td>{i.prenom} {i.nom}</td><td>{i.formation}</td><td>{i.date_debut}</td><td>{i.places_restantes} / {i.capacite_max}</td>
            <td><span className={`etiquette ${i.statut_inscription}`}>{i.statut_inscription.replace("_", " ")}</span></td>
            <td className="actions">
              {i.statut_inscription === "en_attente" && <><button onClick={() => action(i.id_inscription, "valider", "Inscription validée.")}>Valider</button><button onClick={() => action(i.id_inscription, "refuser", "Demande refusée.")}>Refuser</button></>}
              {i.statut_inscription === "validee" && <button onClick={() => window.confirm("Annuler cette inscription ?") && action(i.id_inscription, "annuler", "Inscription annulée.")}>Annuler</button>}
            </td>
          </tr>))}</tbody>
      </table>
    </div>
  );
}
