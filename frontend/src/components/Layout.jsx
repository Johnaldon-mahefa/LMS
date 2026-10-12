import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Menu selon le rôle : chaque lien correspond à un cas d'utilisation.
const MENUS = {
  administrateur: [["/utilisateurs", "Utilisateurs"], ["/formations", "Formations"], ["/inscriptions", "Inscriptions"]],
  formateur: [["/contenu", "Contenu pédagogique"], ["/corrections", "Corrections"], ["/suivi", "Suivi des apprenants"]],
  apprenant: [["/catalogue", "Catalogue et inscriptions"], ["/mes-formations", "Mes formations"], ["/resultats", "Mes résultats"]],
};

export default function Layout() {
  const { utilisateur, deconnecter } = useAuth();
  return (
    <>
      <header className="bandeau">
        <strong>LMS Innov-T Learning Hub</strong>
        <nav>
          <Link to="/">Accueil</Link>
          {utilisateur.roles.flatMap((r) => MENUS[r] || []).map(([chemin, nom]) => <Link key={chemin} to={chemin}>{nom}</Link>)}
        </nav>
        <span>{utilisateur.prenom} {utilisateur.nom}
          <button onClick={deconnecter}>Se déconnecter</button></span>
      </header>
      <main><Outlet /></main>
    </>
  );
}
