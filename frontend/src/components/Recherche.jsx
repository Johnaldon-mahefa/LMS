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
    <div className="position-relative w-100" style={{ maxWidth: '500px' }} ref={boite}>
      
      {/* BARRE DE RECHERCHE */}
      <div className="topbar-search-container">
        <i className="bi bi-search text-muted me-2"></i>
        <input
          type="text"
          className="topbar-search-input"
          placeholder="Rechercher une formation, un module..."
          value={terme}
          onChange={(e) => setTerme(e.target.value)}
          onFocus={() => resultats && setOuvert(true)}
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {/* RÉSULTATS DE RECHERCHE */}
      {ouvert && resultats && (
        <div className="search-results-dropdown">
          {total === 0 ? (
            <p className="text-muted text-center p-3 mb-0">Aucun résultat pour « {terme} ».</p>
          ) : (
            <>
              {resultats.formations.length > 0 && (
                <div className="search-group">
                  <div className="search-category-title">
                    <i className="bi bi-journal-text me-1"></i> Formations
                  </div>
                  {resultats.formations.map((f) => (
                    <div key={f.id_formation} onClick={() => aller(routeFormation)} className="search-result-row" role="button">
                      <div className="search-result-title">{f.intitule}</div>
                      <div className="search-result-subtitle text-capitalize">{f.statut_formation}</div>
                    </div>
                  ))}
                </div>
              )}

              {resultats.modules.length > 0 && (
                <div className="search-group">
                  <div className="search-category-title">
                    <i className="bi bi-box me-1"></i> Modules
                  </div>
                  {resultats.modules.map((m) => (
                    <div key={m.id_module} onClick={() => aller(`/contenu/${m.id_module}`)} className="search-result-row" role="button">
                      <div className="search-result-title">{m.titre}</div>
                      <div className="search-result-subtitle">{m.formation}</div>
                    </div>
                  ))}
                </div>
              )}

              {resultats.evaluations.length > 0 && (
                <div className="search-group">
                  <div className="search-category-title">
                    <i className="bi bi-pencil-square me-1"></i> Évaluations
                  </div>
                  {resultats.evaluations.map((e) => (
                    <div key={e.id_evaluation} onClick={() => aller(`/contenu/${e.id_module}`)} className="search-result-row" role="button">
                      <div className="search-result-title">{e.intitule}</div>
                      <div className="search-result-subtitle">{e.module}</div>
                    </div>
                  ))}
                </div>
              )}

              {resultats.utilisateurs.length > 0 && (
                <div className="search-group">
                  <div className="search-category-title">
                    <i className="bi bi-people me-1"></i> Utilisateurs
                  </div>
                  {resultats.utilisateurs.map((u) => (
                    <div key={u.id_utilisateur} onClick={() => aller("/utilisateurs")} className="search-result-row" role="button">
                      <div className="search-result-title">{u.prenom} {u.nom}</div>
                      <div className="search-result-subtitle">{u.identifiant}</div>
                    </div>
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