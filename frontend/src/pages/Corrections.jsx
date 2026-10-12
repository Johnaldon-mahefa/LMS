import { useEffect, useState } from "react";
import { api, telecharger } from "../api/client.js";
import Message from "../components/Message.jsx";

// Cas d'utilisation « Corriger les soumissions » (RG11).
export default function Corrections() {
  const [liste, setListe] = useState([]);
  const [choisie, setChoisie] = useState(null);
  const [correction, setCorrection] = useState({ note: "", commentaire: "" });
  const [msg, setMsg] = useState(null);
  const charger = () => api("/formateur/soumissions/a-corriger").then(setListe).catch((e) => setMsg({ erreur: e.message }));
  useEffect(() => { charger(); }, []);

  async function enregistrer(e) {
    e.preventDefault();
    try { await api(`/formateur/soumissions/${choisie.id_soumission}/correction`, { method: "PUT", body: correction }); setMsg({ ok: "Correction enregistrée." }); setChoisie(null); setCorrection({ note: "", commentaire: "" }); charger(); }
    catch (err) { setMsg({ erreur: err.message }); }
  }

  return (
    <div className="carte large">
      <h1>Corriger les soumissions</h1>
      <Message msg={msg} />
      {liste.length === 0 && <p>Aucune soumission en attente de correction.</p>}
      <table>
        <thead><tr><th>Apprenant</th><th>Évaluation</th><th>Déposé le</th><th></th></tr></thead>
        <tbody>{liste.map((s) => <tr key={s.id_soumission}><td>{s.prenom} {s.nom}</td><td>{s.evaluation}</td><td>{s.date_depot}</td><td><button onClick={() => setChoisie(s)}>Corriger</button></td></tr>)}</tbody>
      </table>
      {choisie && (
        <section className="bloc">
          <h2>{choisie.evaluation} : {choisie.prenom} {choisie.nom}</h2>
          <p>{choisie.consigne}</p>
          <p><button className="lien" onClick={() => telecharger(`/fichiers/soumissions/${choisie.id_soumission}`, choisie.nom_fichier).catch((e) => setMsg({ erreur: e.message }))}>Télécharger le travail déposé ({choisie.nom_fichier})</button></p>
          <form className="ligne" onSubmit={enregistrer}>
            <label>Note (sur {choisie.note_maximale})<input type="number" step="0.25" min="0" max={choisie.note_maximale} value={correction.note} onChange={(e) => setCorrection({ ...correction, note: e.target.value })} required /></label>
            <label>Commentaire<input value={correction.commentaire} onChange={(e) => setCorrection({ ...correction, commentaire: e.target.value })} /></label>
            <button type="submit">Enregistrer la correction</button>
          </form>
        </section>)}
    </div>
  );
}
