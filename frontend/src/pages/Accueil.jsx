import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ESPACES = {
  administrateur: {
    titre: "Administration",
    description: "Gérez les comptes, les formations et les inscriptions.",
    liens: [
      { chemin: "/statistiques", titre: "Statistiques", texte: "Consultez les chiffres clés.", icone: "bi-bar-chart-line" },
      { chemin: "/utilisateurs", titre: "Utilisateurs", texte: "Créez et gérez les comptes.", icone: "bi-people" },
      { chemin: "/formations", titre: "Formations", texte: "Organisez les formations.", icone: "bi-journal-bookmark" },
      { chemin: "/inscriptions", titre: "Inscriptions", texte: "Validez les demandes.", icone: "bi-person-plus" },
    ],
  },
  formateur: {
    titre: "Pédagogie",
    description: "Créez vos contenus et suivez vos apprenants.",
    liens: [
      { chemin: "/contenu", titre: "Contenu pédagogique", texte: "Modules, leçons et évaluations.", icone: "bi-folder2-open" },
      { chemin: "/corrections", titre: "Corrections", texte: "Notez les travaux déposés.", icone: "bi-check2-square" },
      { chemin: "/suivi", titre: "Suivi des apprenants", texte: "Consultez la progression.", icone: "bi-graph-up" },
    ],
  },
  apprenant: {
    titre: "Apprentissage",
    description: "Suivez vos cours et obtenez vos attestations.",
    liens: [
      { chemin: "/catalogue", titre: "Catalogue", texte: "Parcourez les formations.", icone: "bi-search" },
      { chemin: "/mes-inscriptions", titre: "Mes inscriptions", texte: "Suivez vos demandes.", icone: "bi-card-checklist" },
      { chemin: "/mes-formations", titre: "Mes formations", texte: "Accédez aux contenus.", icone: "bi-mortarboard" },
      { chemin: "/resultats", titre: "Mes résultats", texte: "Consultez vos notes.", icone: "bi-award" },
    ],
  },
};

export default function Accueil() {
  const { utilisateur } = useAuth();
  const heure = new Date().getHours();
  const salut = heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="container-fluid py-4">
      {/* En-tête de bienvenue */}
      <div className="card shadow-sm border-0 mb-4" style={{ backgroundColor: '#f8fafc' }}>
        <div className="card-body">
          <h2 className="fw-bold mb-1">{salut}, {utilisateur.prenom}</h2>
          <p className="text-muted mb-0">Bienvenue sur votre espace. Sélectionnez une action ci-dessous.</p>
        </div>
      </div>

      {/* Cartes de navigation */}
      {utilisateur.roles.map((role) => {
        const espace = ESPACES[role];
        if (!espace) return null;
        return (
          <div key={role} className="mb-5">
            <h3 className="h5 fw-bold mb-3 text-secondary">Espace {espace.titre}</h3>
            <div className="row g-4">
              {espace.liens.map((lien) => (
                <div key={lien.chemin} className="col-12 col-md-6 col-lg-3">
                  <Link to={lien.chemin} className="card h-100 shadow-sm text-decoration-none border-0">
                    <div className="card-body d-flex flex-column align-items-start">
                      <div className="bg-primary bg-opacity-10 p-3 rounded-circle mb-3">
                        <i className={`bi ${lien.icone} text-primary fs-4`}></i>
                      </div>
                      <h5 className="card-title fw-bold text-dark mb-1">{lien.titre}</h5>
                      <p className="card-text text-muted small">{lien.texte}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}