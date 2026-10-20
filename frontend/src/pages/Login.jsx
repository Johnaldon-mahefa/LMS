import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/* Vrai logo Innov-T */
const LogoInnovT = ({ taille = 44 }) => (
  <svg width={taille} height={taille} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Innov-T">
    <defs>
      <linearGradient id="innov-bg-login" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0a2f4a" />
        <stop offset="100%" stopColor="#0d4a6b" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#innov-bg-login)" />
    <g fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinejoin="round">
      <rect x="30" y="22" width="40" height="40" transform="rotate(45 50 42)" />
      <rect x="36" y="28" width="28" height="28" transform="rotate(45 50 42)" />
      <rect x="42" y="34" width="16" height="16" transform="rotate(45 50 42)" />
    </g>
    <text x="50" y="80" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="18" fontWeight="900" fill="#ffffff" letterSpacing="-0.5">innov</text>
  </svg>
);

/* Points forts affichés à gauche */
const ATOUTS = [
  { icone: "📚", titre: "Cours en ligne", texte: "Modules, leçons et ressources accessibles partout." },
  { icone: "📊", titre: "Suivi de progression", texte: "Consultez votre avancement en temps réel." },
  { icone: "🎓", titre: "Attestations", texte: "Recevez votre certificat à la fin de la formation." },
  { icone: "🔒", titre: "Accès sécurisé", texte: "Authentification JWT et mots de passe chiffrés." },
];

export default function Login() {
  const { utilisateur, connecter } = useAuth();
  const navigate = useNavigate();
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [voir, setVoir] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  if (utilisateur) return <Navigate to="/" replace />;

  async function soumettre(e) {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await connecter(identifiant, motDePasse);
      navigate("/");
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="connexion-page">
      {/* ================= COLONNE GAUCHE : PRÉSENTATION ================= */}
      <aside className="connexion-presentation">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />

        <div className="connexion-presentation-contenu">
          <div className="connexion-marque">
            <LogoInnovT taille={52} />
            <div>
              <strong>Innov-T Learning Hub</strong>
              <small>Centre de formation professionnelle</small>
            </div>
          </div>

          <h1>
            Apprenez.<br />
            Progressez.<br />
            <span className="hero-nom">Réussissez.</span>
          </h1>

          <p className="connexion-texte">
            La plateforme de formation professionnelle en digitalisation :
            développement web et DevOps. Suivez vos cours, déposez vos travaux
            et obtenez vos attestations, au même endroit.
          </p>

          <div className="connexion-atouts">
            {ATOUTS.map((a, i) => (
              <div key={a.titre} className="connexion-atout" style={{ "--i": i }}>
                <span className="connexion-atout-icone">{a.icone}</span>
                <div>
                  <strong>{a.titre}</strong>
                  <small>{a.texte}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="connexion-pied">
            <p>© 2025 Innov-T Learning Hub — Tous droits réservés</p>
          </div>
        </div>
      </aside>

      {/* ================= COLONNE DROITE : FORMULAIRE ================= */}
      <section className="connexion-formulaire">
        <div className="connexion-boite">
          <div className="connexion-boite-entete">
            <span className="connexion-etiquette">🔐 Espace personnel</span>
            <h2>Connexion</h2>
            <p>
              Heureux de vous revoir ! Entrez vos identifiants pour accéder
              à votre espace personnel.
            </p>
          </div>

          <form onSubmit={soumettre} className="connexion-form">
            <label className="champ">
              <span>Identifiant</span>
              <input
                type="text"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                placeholder="votre identifiant"
                autoComplete="username"
                required
                autoFocus
              />
            </label>

            <label className="champ">
              <span>Mot de passe</span>
              <div className="connexion-mdp">
                <input
                  type={voir ? "text" : "password"}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="connexion-oeil"
                  onClick={() => setVoir(!voir)}
                  aria-label={voir ? "Masquer" : "Afficher"}
                  title={voir ? "Masquer" : "Afficher"}
                >
                  {voir ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            {erreur && (
              <div className="connexion-erreur">
                <span>⚠️</span>
                <p>{erreur}</p>
              </div>
            )}

            <button
              type="submit"
              className="connexion-submit"
              disabled={envoi}
            >
              {envoi ? "Connexion…" : "Se connecter →"}
            </button>
          </form>

          <div className="connexion-aide">
            <p>
              Besoin d'un compte ? Contactez l'administrateur de votre centre.
            </p>
          </div>

          <div className="connexion-comptes">
            <div className="connexion-comptes-titre">Comptes de démonstration</div>
            <div className="connexion-comptes-liste">
              <span><code>admin</code> · Administrateur</span>
              <span><code>formateur1</code> · Formateur</span>
              <span><code>apprenant1</code> · Apprenant</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}