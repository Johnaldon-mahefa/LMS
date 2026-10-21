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
    <div className="position-relative flex-grow-1" style={{ maxWidth: '400px' }} ref={boite}>
      <div className="input-group">
        <span className="input-group-text bg-white border-end-0">
          <i className="bi bi-search text-muted"></i>
        </span>
        <input
          type="text"
          className="form-control border-start-0 ps-0"
          placeholder="Rechercher formations, modules…"
          value={terme}
          onChange={(e) => setTerme(e.target.value)}
          onFocus={() => resultats && setOuvert(true)}
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {ouvert && resultats && (
        <div 
          className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" 
          style={{ zIndex: 1050, maxHeight: '400px', overflowY: 'auto' }}
        >
          {total === 0 ? (
            <p className="text-muted text-center p-3 mb-0">Aucun résultat pour « {terme} ».</p>
          ) : (
            <>
              {resultats.formations.length > 0 && (
                <div className="border-bottom pb-2">
                  <div className="px-3 pt-2 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '11px' }}>
                    <i className="bi bi-journal-text me-1"></i> Formations
                  </div>
                  {resultats.formations.map((f) => (
                    <button key={f.id_formation} onClick={() => aller(routeFormation)} className="btn btn-link text-decoration-none text-start w-100 px-3 py-2 text-dark hover-bg-light">
                      <div className="fw-bold">{f.intitule}</div>
                      <div className="small text-muted">{f.statut_formation}</div>
                    </button>
                  ))}
                </div>
              )}

              {resultats.modules.length > 0 && (
                <div className="border-bottom pb-2">
                  <div className="px-3 pt-2 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '11px' }}>
                    <i className="bi bi-box me-1"></i> Modules
                  </div>
                  {resultats.modules.map((m) => (
                    <button key={m.id_module} onClick={() => aller(`/contenu/${m.id_module}`)} className="btn btn-link text-decoration-none text-start w-100 px-3 py-2 text-dark hover-bg-light">
                      <div className="fw-bold">{m.titre}</div>
                      <div className="small text-muted">{m.formation}</div>
                    </button>
                  ))}
                </div>
              )}

              {resultats.evaluations.length > 0 && (
                <div className="border-bottom pb-2">
                  <div className="px-3 pt-2 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '11px' }}>
                    <i className="bi bi-pencil-square me-1"></i> Évaluations
                  </div>
                  {resultats.evaluations.map((e) => (
                    <button key={e.id_evaluation} onClick={() => aller(`/contenu/${e.id_module}`)} className="btn btn-link text-decoration-none text-start w-100 px-3 py-2 text-dark hover-bg-light">
                      <div className="fw-bold">{e.intitule}</div>
                      <div className="small text-muted">{e.module}</div>
                    </button>
                  ))}
                </div>
              )}

              {resultats.utilisateurs.length > 0 && (
                <div className="pb-2">
                  <div className="px-3 pt-2 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '11px' }}>
                    <i className="bi bi-people me-1"></i> Utilisateurs
                  </div>
                  {resultats.utilisateurs.map((u) => (
                    <button key={u.id_utilisateur} onClick={() => aller("/utilisateurs")} className="btn btn-link text-decoration-none text-start w-100 px-3 py-2 text-dark hover-bg-light">
                      <div className="fw-bold">{u.prenom} {u.nom}</div>
                      <div className="small text-muted">{u.identifiant}</div>
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