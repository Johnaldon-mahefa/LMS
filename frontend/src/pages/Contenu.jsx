import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import Message from "../components/Message.jsx";

// Cas d'utilisation « Gérer le contenu pédagogique » : liste des formations du formateur et création d'un module (RG9).
export default function Contenu() {
  const [formations, setFormations] = useState([]);
  const [nouveau, setNouveau] = useState({});
  const [msg, setMsg] = useState(null);
  const charger = () => api("/formateur/formations").then(setFormations).catch((e) => setMsg({ erreur: e.message }));
  useEffect(() => { charger(); }, []);

  async function creer(e, idFormation) {
    e.preventDefault();
    try { await api(`/formateur/formations/${idFormation}/modules`, { method: "POST", body: nouveau[idFormation] }); setMsg({ ok: "Module créé au statut brouillon." }); setNouveau({ ...nouveau, [idFormation]: { titre: "", description: "" } }); charger(); }
    catch (err) { setMsg({ erreur: err.message }); }
  }

  return (
    <div className="carte large">
      <h1>Gérer le contenu pédagogique</h1>
      <Message msg={msg} />
      {formations.length === 0 && <p>Aucune session ne vous est affectée pour le moment.</p>}
      {formations.map((f) => (
        <section key={f.id_formation} className="bloc">
          <h2>{f.intitule}</h2>
          <ul>{f.modules.map((m) => (
            <li key={m.id_module}><Link to={`/contenu/${m.id_module}`}>{m.titre}</Link> <span className={`etiquette ${m.statut_module}`}>{m.statut_module}</span>
              {!m.modifiable && <em> (module d'un autre formateur : lecture seule)</em>}</li>))}</ul>
          <form className="ligne" onSubmit={(e) => creer(e, f.id_formation)}>
            <label>Nouveau module<input value={nouveau[f.id_formation]?.titre || ""} onChange={(e) => setNouveau({ ...nouveau, [f.id_formation]: { ...nouveau[f.id_formation], titre: e.target.value } })} required /></label>
            <label>Description<input value={nouveau[f.id_formation]?.description || ""} onChange={(e) => setNouveau({ ...nouveau, [f.id_formation]: { ...nouveau[f.id_formation], description: e.target.value } })} /></label>
            <button type="submit">Créer</button>
          </form>
        </section>))}
    </div>
  );
}
