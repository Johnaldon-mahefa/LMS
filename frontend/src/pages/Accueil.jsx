import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ESPACES = {
  administrateur: {
    titre: "Administration",
    description: "Gérez les comptes, les formations et les inscriptions.",
    liens: [
      { chemin: "/statistiques", titre: "Statistiques", texte: "Consultez les chiffres clés.", icone: "bi-bar-chart-line", feature: "EXPORT_PDF" },
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
      { chemin: "/suivi", titre: "Suivi des apprenants", texte: "Consultez la progression.", icone: "bi-graph-up", feature: "EXPORT_PDF" },
    ],
  },
  apprenant: {
    titre: "Apprentissage",
    description: "Suivez vos cours et obtenez vos attestations.",
    liens: [
      { chemin: "/catalogue", titre: "Catalogue", texte: "Parcourez les formations.", icone: "bi-search" },
      { chemin: "/mes-inscriptions", titre: "Mes inscriptions", texte: "Suivez vos demandes.", icone: "bi-card-checklist" },
      { chemin: "/mes-formations", titre: "Mes formations", texte: "Accédez aux contenus.", icone: "bi-mortarboard" },
      { chemin: "/resultats", titre: "Mes résultats", texte: "Consultez vos notes.", icone: "bi-award", feature: "QCM" },
    ],
  },
};

export default function Accueil() {
  const { utilisateur, aAcces } = useAuth();
  const heure = new Date().getHours();
  const salut = heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="container-fluid py-4">
      
      {/* EN-TÊTE DE BIENVENUE */}
      <div className="card border-0 shadow-sm mb-5 welcome-banner">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex align-items-center gap-4">
            <div className="d-none d-md-flex align-items-center justify-content-center rounded-4 shadow-sm welcome-icon-bg" style={{ width: '70px', height: '70px' }}>
              <i className="bi bi-stars text-primary fs-1"></i>
            </div>
            <div>
              <h2 className="fw-bold mb-1" style={{ letterSpacing: '-0.5px' }}>
                {salut}, {utilisateur.prenom} !
              </h2>
              <p className="mb-0 fs-6 welcome-text">
                Bienvenue sur votre espace <strong className="text-primary">{utilisateur.nom_etablissement}</strong>. Que souhaitez-vous faire aujourd'hui ?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CARTES DE NAVIGATION */}
      {utilisateur.roles.map((role) => {
        const espace = ESPACES[role];
        if (!espace) return null;

        const liensVisibles = espace.liens.filter(lien => {
          if (!lien.feature) return true;
          return aAcces(lien.feature);
        });

        if (liensVisibles.length === 0) return null;

        return (
          <div key={role} className="mb-5">
            <div className="mb-3">
              <h3 className="h5 fw-bold mb-0">{espace.titre}</h3>
              <p className="text-muted small">{espace.description}</p>
            </div>
            
            <div className="row g-4">
              {liensVisibles.map((lien) => (
                <div key={lien.chemin} className="col-12 col-md-6 col-xl-3">
                  <Link to={lien.chemin} className="card h-100 border-0 shadow-sm hover-shadow text-decoration-none" style={{ transition: 'all 0.2s' }}>
                    <div className="card-body p-4 d-flex flex-column">
                      <div className="d-flex align-items-center justify-content-center mb-4 icon-box">
                        <i className={`bi ${lien.icone} text-primary fs-4`}></i>
                      </div>
                      <h5 className="card-title fw-bold mb-2">{lien.titre}</h5>
                      <p className="card-text text-muted small mb-0 flex-grow-1">{lien.texte}</p>
                      <div className="mt-3 text-primary fw-semibold small">
                        Ouvrir <i className="bi bi-arrow-right ms-1"></i>
                      </div>
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