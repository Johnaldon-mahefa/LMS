import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Message from "../components/Message.jsx";

// Cas d'utilisation « Suivre la progression des apprenants » (RG12, RG13).
export default function Suivi() {
  const [sessions, setSessions] = useState([]);
  const [suivi, setSuivi] = useState(null);
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState(null);
  useEffect(() => { api("/formateur/sessions").then(setSessions).catch((e) => setMsg({ erreur: e.message })); }, []);

  const ouvrirSession = (id) => { setDetail(null); api(`/formateur/sessions/${id}/progression`).then(setSuivi).catch((e) => setMsg({ erreur: e.message })); };
  const ouvrirApprenant = (id) => api(`/formateur/inscriptions/${id}/detail`).then(setDetail).catch((e) => setMsg({ erreur: e.message }));

  return (
    <div className="carte large">
      <h1>Suivre la progression des apprenants</h1>
      <Message msg={msg} />
      <div className="actions">{sessions.map((s) => <button key={s.id_session} onClick={() => ouvrirSession(s.id_session)}>{s.formation} ({s.date_debut})</button>)}</div>
      {sessions.length === 0 && <p>Aucune session ne vous est affectée.</p>}
      {suivi && (suivi.apprenants.length === 0 ? <p>Aucun apprenant inscrit à cette session.</p> :
        <table>
          <thead><tr><th>Apprenant</th><th>Progression</th><th>Travaux à corriger</th><th></th></tr></thead>
          <tbody>{suivi.apprenants.map((a) => <tr key={a.id_inscription}><td>{a.prenom} {a.nom}</td>
            <td><progress value={a.progression} max="100" /> {a.progression} %</td><td>{a.soumissions_a_corriger}</td>
            <td><button onClick={() => ouvrirApprenant(a.id_inscription)}>Détail</button></td></tr>)}</tbody>
        </table>)}
      {detail && (
        <section className="bloc"><h2>Détail : {detail.inscription.prenom} {detail.inscription.nom} ({detail.progression} %)</h2>
          {detail.modules.map((m) => <div key={m.id_module}><h3>{m.titre} <span className={`etiquette ${m.valide ? "validee" : "en_attente"}`}>{m.valide ? "validé" : "non validé"}</span></h3>
            <ul>{m.evaluations.map((e) => <li key={e.id_evaluation}>{e.intitule} : {e.statut === "corrigee" ? `${e.note} / ${e.note_maximale}` : e.statut.replace("_", " ")}</li>)}</ul></div>)}
        </section>)}
    </div>
  );
}
