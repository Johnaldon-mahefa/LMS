import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Recherche() {
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const [terme, setTerme] = useState("");
  const [resultats, setResultats] = useState(null);
  const [ouvert, setOuvert] = useState(false);
  const boite = useRef(null);

  // Route de destination des formations selon le rôle
  const routeFormation = utilisateur.roles.includes("administrateur")
    ? "/formations"
    : utilisateur.roles.includes("formateur")
    ? "/contenu"
    : "/catalogue";

  useEffect(() => {
    if (terme.trim().length < 2) { setResultats(null); return; }
    const t = setTimeout(() => {
      api(`/recherche?q=${encodeURIComponent(terme.trim())}`)
        .then((data) => { setResultats(data); setOuvert(true); })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [terme]);

  useEffect(() => {
    function fermer(e) {
      if (boite.current && !boite.current.contains(e.target)) setOuvert(false);
    }
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, []);

  function aller(chemin) {
    setOuvert(false);
    setTerme("");
    setResultats(null);
    navigate(chemin);
  }

  const total = resultats
    ? resultats.formations.length + resultats.modules.length + resultats.evaluations.length + resultats.utilisateurs.length
    : 0;

  return (
    <div className="recherche-globale" ref={boite}>
      <span className="recherche-globale-icone">🔍</span>
      <input
        type="text"
        placeholder="Rechercher formations, modules…"
        value={terme}
        onChange={(e) => setTerme(e.target.value)}
        onFocus={() => resultats && setOuvert(true)}
        autoComplete="off"
        spellCheck="false"
      />

      {ouvert && resultats && (
        <div className="recherche-panneau">
          {total === 0 ? (
            <p className="recherche-vide">Aucun résultat pour « {terme} ».</p>
          ) : (
            <>
              {resultats.formations.length > 0 && (
                <div className="recherche-section">
                  <div className="recherche-section-titre">📚 Formations</div>
                  {resultats.formations.map((f) => (
                    <button key={f.id_formation} onClick={() => aller(routeFormation)} className="recherche-item">
                      <strong>{f.intitule}</strong>
                      <small>{f.statut_formation}</small>
                    </button>
                  ))}
                </div>
              )}

              {resultats.modules.length > 0 && (
                <div className="recherche-section">
                  <div className="recherche-section-titre">📦 Modules</div>
                  {resultats.modules.map((m) => (
                    <button key={m.id_module} onClick={() => aller(`/contenu/${m.id_module}`)} className="recherche-item">
                      <strong>{m.titre}</strong>
                      <small>{m.formation}</small>
                    </button>
                  ))}
                </div>
              )}

              {resultats.evaluations.length > 0 && (
                <div className="recherche-section">
                  <div className="recherche-section-titre">✏️ Évaluations</div>
                  {resultats.evaluations.map((e) => (
                    <button key={e.id_evaluation} onClick={() => aller(`/contenu/${e.id_module}`)} className="recherche-item">
                      <strong>{e.intitule}</strong>
                      <small>{e.module}</small>
                    </button>
                  ))}
                </div>
              )}

              {resultats.utilisateurs.length > 0 && (
                <div className="recherche-section">
                  <div className="recherche-section-titre">👥 Utilisateurs</div>
                  {resultats.utilisateurs.map((u) => (
                    <button key={u.id_utilisateur} onClick={() => aller("/utilisateurs")} className="recherche-item">
                      <strong>{u.prenom} {u.nom}</strong>
                      <small>{u.identifiant}</small>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}