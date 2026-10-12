import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Message from "../components/Message.jsx";

// Cas d'utilisation « Demander son inscription à une session » (RG3, RG7).
export default function Catalogue() {
  const [formations, setFormations] = useState([]);
  const [mes, setMes] = useState([]);
  const [msg, setMsg] = useState(null);
  const charger = () => { api("/apprenant/catalogue").then(setFormations).catch((e) => setMsg({ erreur: e.message })); api("/apprenant/inscriptions").then(setMes); };
  useEffect(() => { charger(); }, []);

  async function demander(idSession) {
    try { await api("/apprenant/inscriptions", { method: "POST", body: { idSession } }); setMsg({ ok: "Demande d'inscription enregistrée : elle sera examinée par l'administrateur." }); charger(); }
    catch (e) { setMsg({ erreur: e.message }); }
  }

  return (
    <div className="carte large">
      <h1>Catalogue des formations</h1>
      <Message msg={msg} />
      {formations.length === 0 && <p>Aucune formation n'est publiée pour le moment.</p>}
      {formations.map((f) => (
        <section key={f.id_formation} className="bloc">
          <h2>{f.intitule}</h2><p>{f.description} {f.duree ? `(${f.duree} h)` : ""}</p>
          <table><thead><tr><th>Début</th><th>Fin</th><th>Places restantes</th><th></th></tr></thead>
            <tbody>{f.sessions.map((s) => <tr key={s.id_session}><td>{s.date_debut}</td><td>{s.date_fin}</td><td>{s.places_restantes}</td>
              <td><button onClick={() => demander(s.id_session)}>Demander mon inscription</button></td></tr>)}</tbody></table>
        </section>))}
      <h2>Mes demandes</h2>
      {mes.length === 0 ? <p>Aucune demande pour le moment.</p> :
        <table><thead><tr><th>Formation</th><th>Session</th><th>Statut</th></tr></thead>
          <tbody>{mes.map((i) => <tr key={i.id_inscription}><td>{i.formation}</td><td>{i.date_debut}</td><td><span className={`etiquette ${i.statut_inscription}`}>{i.statut_inscription.replace("_", " ")}</span></td></tr>)}</tbody></table>}
    </div>
  );
}
