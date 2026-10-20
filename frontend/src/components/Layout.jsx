import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Cloche from "./Cloche.jsx";
import Recherche from "./Recherche.jsx";

/* Vrai logo Innov-T (SVG inline) */
const LogoInnovT = ({ taille = 40 }) => (
  <svg width={taille} height={taille} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Innov-T Learning Hub">
    <defs>
      <linearGradient id="ilh-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#150829" />
        <stop offset="100%" stopColor="#2e1065" />
      </linearGradient>
      <linearGradient id="ilh-triangle" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="50%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="22" fill="url(#ilh-bg)" />
    <path d="M50 20 L86 78 Q88 82 84 82 L16 82 Q12 82 14 78 Z" fill="url(#ilh-triangle)" />
    <text x="50" y="72" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="30" fontWeight="900" fill="#ffffff" letterSpacing="-1">ILH</text>
    <rect x="8" y="42" width="22" height="4" rx="2" fill="#ffffff" opacity="0.95" />
    <rect x="4" y="50" width="18" height="4" rx="2" fill="#ffffff" opacity="0.75" />
    <rect x="70" y="60" width="22" height="4" rx="2" fill="#ffffff" opacity="0.95" />
    <rect x="78" y="68" width="18" height="4" rx="2" fill="#ffffff" opacity="0.75" />
  </svg>
);

const MENUS = {
  administrateur: [
    ["/statistiques", "Statistiques"],
    ["/utilisateurs", "Utilisateurs"],
    ["/formations", "Formations"],
    ["/inscriptions", "Inscriptions"],
  ],
  formateur: [
    ["/contenu", "Contenu"],
    ["/corrections", "Corrections"],
    ["/suivi", "Suivi"],
  ],
  apprenant: [
    ["/catalogue", "Catalogue"],
    ["/mes-inscriptions", "Mes inscriptions"],
    ["/mes-formations", "Mes formations"],
    ["/resultats", "Mes résultats"],
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
      {/* ================= SIDEBAR ================= */}
      <aside className={`sidebar ${menuOuvert ? "ouverte" : ""}`}>
        <div className="sidebar-marque">
          <Link to="/" className="sidebar-logo" onClick={() => setMenuOuvert(false)}>
            <LogoInnovT taille={42} />
            <div>
              <strong>Innov-T</strong>
              <small>Learning Hub</small>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/"
            className={lieu.pathname === "/" ? "actif" : ""}
            onClick={() => setMenuOuvert(false)}
          >
            Accueil
          </Link>

          {liens.map(([chemin, nom]) => (
            <Link
              key={chemin}
              to={chemin}
              className={lieu.pathname.startsWith(chemin) ? "actif" : ""}
              onClick={() => setMenuOuvert(false)}
            >
              {nom}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bas">
          <Link
            to="/profil"
            className={`sidebar-profil ${lieu.pathname === "/profil" ? "actif" : ""}`}
            onClick={() => setMenuOuvert(false)}
          >
            <span className="sidebar-profil-avatar">
              {utilisateur.prenom?.[0]}{utilisateur.nom?.[0]}
            </span>
            <div className="sidebar-profil-info">
              <strong>{utilisateur.prenom} {utilisateur.nom}</strong>
              <small>{utilisateur.roles.join(", ")}</small>
            </div>
          </Link>
          <button type="button" className="sidebar-deconnexion" onClick={deconnecter}>
            ⎋ Se déconnecter
          </button>
        </div>
      </aside>

      {/* Voile sombre mobile */}
      {menuOuvert && <div className="sidebar-voile" onClick={() => setMenuOuvert(false)} />}

      {/* ================= CONTENU ================= */}
      <div className="layout-contenu">
        <header className="topbar">
          <button
            type="button"
            className="topbar-burger"
            onClick={() => setMenuOuvert((v) => !v)}
            aria-label="Menu"
          >
            ☰
          </button>

          <Recherche />

          <Cloche />
        </header>

        <main>
          <Outlet />
        </main>

        {/* ================= FOOTER ================= */}
        <footer className="pied">
          <div className="pied-grille">
            <div className="pied-colonne">
              <div className="pied-marque">
                <LogoInnovT taille={40} />
                <div>
                  <strong>Innov-T Learning Hub</strong>
                  <small>Centre de formation professionnelle</small>
                </div>
              </div>
              <p className="pied-description">
                Formation professionnelle en digitalisation : développement web et DevOps.
              </p>
            </div>

            <div className="pied-colonne">
              <h4>Adresse</h4>
              <p>Andohan'Ivory<br />Fianarantsoa 301<br />Madagascar</p>
            </div>

            <div className="pied-colonne">
              <h4>Contact</h4>
              <p>
                <a href="tel:+261381078860">+261 38 10 788 60</a><br />
                <a href="mailto:contact@innov-t.mg">contact@innov-t.mg</a>
              </p>
            </div>

            <div className="pied-colonne">
              <h4>Heures</h4>
              <p>Lundi – Samedi<br />08h – 18h (MG)<br />10h – 20h (EU)</p>
            </div>
          </div>

          <div className="pied-bas">
            <p>© 2025 Innov-T Learning Hub</p>
            <p className="pied-sous">Plateforme LMS</p>
          </div>
        </footer>
      </div>
    </div>
  );
}