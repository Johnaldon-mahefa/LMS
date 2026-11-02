import { useLoading } from "../context/LoadingContext.jsx";

export default function GlobalSpinner() {
  const { enChargement } = useLoading();
  if (!enChargement) return null;

  return (
    <div className="global-loader-wrapper">
      {/* La barre de progression en haut */}
      <div className="global-loader-bar"></div>
    </div>
  );
}

// Optionnel : Un overlay bloquant pour la connexion (à utiliser si tu veux bloquer l'écran)
export function FullScreenLoader({ texte = "Chargement..." }) {
  return (
    <div className="fullscreen-loader-overlay">
      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Chargement...</span>
      </div>
      <h5 className="fw-bold text-dark">{texte}</h5>
    </div>
  );
}
