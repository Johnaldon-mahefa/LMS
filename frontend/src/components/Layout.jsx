import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Cloche from "./Cloche.jsx";
import Recherche from "./Recherche.jsx";

const MENUS = {
  administrateur: [
    ["/statistiques", "Statistiques", "bi-bar-chart-line"],
    ["/utilisateurs", "Utilisateurs", "bi-people"],
    ["/formations", "Formations", "bi-journal-bookmark"],
    ["/inscriptions", "Inscriptions", "bi-person-plus"],
  ],
  formateur: [
    ["/contenu", "Contenu", "bi-folder2-open"],
    ["/corrections", "Corrections", "bi-check2-square"],
    ["/suivi", "Suivi", "bi-graph-up"],
  ],
  apprenant: [
    ["/catalogue", "Catalogue", "bi-search"],
    ["/mes-inscriptions", "Mes inscriptions", "bi-card-checklist"],
    ["/mes-formations", "Mes formations", "bi-mortarboard"],
    ["/resultats", "Résultats", "bi-award"],
  ],
};

export default function Layout() {
  const { utilisateur, deconnecter } = useAuth();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const lieu = useLocation();

  useEffect(() => { setMenuOuvert(false); }, [lieu.pathname]);

  const liens = utilisateur.roles.flatMap((r) => MENUS[r] || []);

  return (
    <div className="layout-sidebar">
      <aside className={`sidebar ${menuOuvert ? "ouverte" : ""}`}>
        <div className="sidebar-marque">
          <Link to="/" className="sidebar-logo" onClick={() => setMenuOuvert(false)}>
            <i className="bi bi-mortarboard-fill" style={{ fontSize: 28, color: '#3b82f6' }}></i>
            <div>
              <strong>{utilisateur.nom_etablissement || "Plateforme LMS"}</strong>
              <small>Espace de formation</small>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className={lieu.pathname === "/" ? "actif" : ""} onClick={() => setMenuOuvert(false)}>
            <i className="bi bi-house-door"></i> Accueil
          </Link>
          {liens.map(([chemin, nom, icone]) => (
            <Link
              key={chemin}
              to={chemin}
              className={lieu.pathname.startsWith(chemin) ? "actif" : ""}
              onClick={() => setMenuOuvert(false)}
            >
              <i className={`bi ${icone}`}></i> {nom}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bas">
          <Link to="/profil" className="sidebar-profil" onClick={() => setMenuOuvert(false)}>
            <span className="sidebar-profil-avatar">
              {utilisateur.prenom?.[0]}{utilisateur.nom?.[0]}
            </span>
            <div className="sidebar-profil-info">
              <strong>{utilisateur.prenom} {utilisateur.nom}</strong>
              <small>{utilisateur.roles.join(", ")}</small>
            </div>
          </Link>
          <button type="button" className="sidebar-deconnexion" onClick={deconnecter}>
            <i className="bi bi-box-arrow-right"></i> Déconnexion
          </button>
        </div>
      </aside>

      {menuOuvert && <div className="sidebar-voile" onClick={() => setMenuOuvert(false)} />}

      <div className="layout-contenu">
        <header className="topbar">
          <button type="button" className="topbar-burger" onClick={() => setMenuOuvert(true)}>
            <i className="bi bi-list"></i>
          </button>
          <Recherche />
          <Cloche />
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}