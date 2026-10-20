import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ESPACES = {
  administrateur: {
    titre: "Administration",
    description: "Gérez les comptes, les formations et les inscriptions de la plateforme.",
    couleur: "grad-1",
    icone: "🛡️",
    liens: [
      { chemin: "/statistiques", titre: "Statistiques", texte: "Consultez les chiffres clés de la plateforme." },
      { chemin: "/utilisateurs", titre: "Utilisateurs", texte: "Créez et gérez les comptes, attribuez les rôles." },
      { chemin: "/formations", titre: "Formations", texte: "Organisez les formations et leurs sessions." },
      { chemin: "/inscriptions", titre: "Inscriptions", texte: "Validez les demandes et inscrivez directement." },
    ],
  },
  formateur: {
    titre: "Pédagogie",
    description: "Créez vos contenus, corrigez les travaux et suivez vos apprenants.",
    couleur: "grad-2",
    icone: "📚",
    liens: [
      { chemin: "/contenu", titre: "Contenu pédagogique", texte: "Modules, leçons, ressources et évaluations." },
      { chemin: "/corrections", titre: "Corrections", texte: "Notez et commentez les travaux déposés." },
      { chemin: "/suivi", titre: "Suivi des apprenants", texte: "Consultez la progression de vos sessions." },
    ],
  },
  apprenant: {
    titre: "Apprentissage",
    description: "Découvrez les formations, suivez vos cours et obtenez vos attestations.",
    couleur: "grad-3",
    icone: "🎓",
    liens: [
      { chemin: "/catalogue", titre: "Catalogue", texte: "Parcourez les formations et inscrivez-vous." },
      { chemin: "/mes-inscriptions", titre: "Mes inscriptions", texte: "Suivez le statut de vos demandes." },
      { chemin: "/mes-formations", titre: "Mes formations", texte: "Accédez au contenu et déposez vos travaux." },
      { chemin: "/resultats", titre: "Mes résultats", texte: "Consultez vos notes et votre attestation." },
    ],
  },
};


export default function Accueil() {
  const { utilisateur } = useAuth();
  const heure = new Date().getHours();
  const salut = heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <>
      <section className="hero-accueil">
        <span className="blob b1" />
        <span className="blob b2" />

        <div className="hero-contenu">
          <span className="hero-badge">✨ Plateforme Innov-T Learning Hub</span>

          <h1>
            {salut}, <span className="hero-nom">{utilisateur.prenom}</span> 👋
          </h1>

          <p className="hero-sous-titre">
            Bienvenue sur votre espace personnel d'apprentissage. Retrouvez
            vos formations, suivez votre progression et accédez à tous vos
            contenus pédagogiques en un seul endroit.
          </p>

          <div className="hero-roles">
            {utilisateur.roles.map((r) => (
              <span key={r} className="hero-role-tag">
                {r === "administrateur" && "🛡️ Administrateur"}
                {r === "formateur" && "📚 Formateur"}
                {r === "apprenant" && "🎓 Apprenant"}
              </span>
            ))}
          </div>
        </div>
      </section>


      {utilisateur.roles.map((role) => {
        const espace = ESPACES[role];
        if (!espace) return null;
        return (
          <section key={role} className="espace-section">
            <div className="espace-entete">
              <div className={`espace-icone ${espace.couleur}`}>{espace.icone}</div>
              <div>
                <h2>Espace {espace.titre}</h2>
                <p>{espace.description}</p>
              </div>
            </div>

            <div className="espace-liens">
              {espace.liens.map((lien, i) => (
                <Link
                  key={lien.chemin}
                  to={lien.chemin}
                  className="espace-lien"
                  style={{ "--i": i }}
                >
                  <div className="espace-lien-texte">
                    <strong>{lien.titre}</strong>
                    <small>{lien.texte}</small>
                  </div>
                  <span className="espace-lien-fleche">→</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}