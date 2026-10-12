import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Les onze cas d'utilisation, regroupés par rôle.
const MENUS = {
  administrateur: [["/utilisateurs", "Gérer les utilisateurs"], ["/formations", "Organiser les formations"], ["/inscriptions", "Gérer les inscriptions"]],
  formateur: [["/contenu", "Gérer le contenu pédagogique"], ["/corrections", "Corriger les soumissions"], ["/suivi", "Suivre la progression des apprenants"]],
  apprenant: [["/catalogue", "Demander son inscription à une session"], ["/mes-formations", "Consulter le contenu de ses formations et soumettre une évaluation"], ["/resultats", "Consulter ses résultats et son attestation"]],
};

export default function Accueil() {
  const { utilisateur } = useAuth();
  return (
    <div className="carte">
      <h1>Bienvenue {utilisateur.prenom}</h1>
      {utilisateur.roles.map((role) => (
        <section key={role}><h2>Espace {role}</h2>
          <ul>{MENUS[role]?.map(([chemin, nom]) => <li key={chemin}><Link to={chemin}>{nom}</Link></li>)}</ul></section>))}
    </div>
  );
}
