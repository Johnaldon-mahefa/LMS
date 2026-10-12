import { useEffect, useState } from "react";
import { api, telecharger } from "../api/client.js";
import Message from "../components/Message.jsx";

// Cas d'utilisation « Consulter ses résultats et son attestation » (RG12, RG13, RG14).
export default function Resultats() {
  const [liste, setListe] = useState([]);
  const [r, setR] = useState(null);
  const [msg, setMsg] = useState(null);
  useEffect(() => { api("/apprenant/formations").then(setListe).catch((e) => setMsg({ erreur: e.message })); }, []);

  const ouvrir = (id) => api(`/apprenant/inscriptions/${id}/resultats`).then(setR).catch((e) => setMsg({ erreur: e.message }));
  async function demanderAttestation() {
    try { await api(`/apprenant/inscriptions/${r.inscription.id_inscription}/attestation`, { method: "POST" }); setMsg({ ok: "Attestation délivrée." }); ouvrir(r.inscription.id_inscription); }
    catch (e) { setMsg({ erreur: e.message }); }
  }

  return (
    <div className="carte large">
      <h1>Mes résultats</h1>
      <Message msg={msg} />
      {liste.length === 0 && <p>Aucune inscription validée.</p>}
      <div className="actions">{liste.map((i) => <button key={i.id_inscription} onClick={() => ouvrir(i.id_inscription)}>{i.formation}</button>)}</div>
      {r && (
        <section className="bloc">
          <h2>{r.inscription.formation} : progression {r.progression} % <progress value={r.progression} max="100" /></h2>
          <p>Seuil de réussite d'un module : {r.seuil} % de moyenne.</p>
          {r.modules.map((m) => (
            <div key={m.id_module}>
              <h3>{m.titre} <span className={`etiquette ${m.valide ? "validee" : "en_attente"}`}>{m.valide ? "validé" : "non validé"}</span></h3>
              <ul>{m.evaluations.map((e) => <li key={e.id_evaluation}>{e.intitule} : {e.statut === "corrigee" ? `${e.note} / ${e.note_maximale}${e.commentaire ? ` (${e.commentaire})` : ""}` : e.statut === "soumise" ? "en attente de correction" : "non déposé"}</li>)}</ul>
            </div>))}
          <div className="actions">
            {r.attestation
              ? <button onClick={() => telecharger(`/apprenant/inscriptions/${r.inscription.id_inscription}/attestation/pdf`, `${r.attestation.numero_attestation}.pdf`).catch((e) => setMsg({ erreur: e.message }))}>Télécharger l'attestation {r.attestation.numero_attestation}</button>
              : <button onClick={demanderAttestation}>Obtenir mon attestation</button>}
          </div>
          {!r.attestation && !r.eligible && <p>L'attestation sera disponible lorsque tous les modules publiés seront validés.</p>}
        </section>)}
    </div>
  );
}
