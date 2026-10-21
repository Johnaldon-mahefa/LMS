import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const { connecter } = useAuth();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await connecter(identifiant, motDePasse);
      navigate("/");
    } catch (err) {
      setErreur(err.message);
      setChargement(false);
    }
  }

  return (
    <div className="connexion-page">
      <div className="connexion-boite">
        <div className="text-center mb-4">
          <i className="bi bi-mortarboard-fill" style={{ fontSize: 40, color: '#3b82f6' }}></i>
          <h2 className="mt-2" style={{ fontWeight: 600, color: '#1e293b' }}>Plateforme LMS</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>Connectez-vous à votre espace de formation.</p>
        </div>

        {erreur && (
          <div className="badge-danger w-100 mb-3 text-center" style={{ padding: 10, fontSize: 14 }}>
            {erreur}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">Identifiant</label>
            <input
              type="text"
              className="form-control"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              placeholder="Entrez votre identifiant ou email"
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              className="form-control"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="Entrez votre mot de passe"
              required
            />
          </div>

          <button type="submit" className="btn btn-primaire w-100" disabled={chargement}>
            {chargement ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="text-center mt-4">
          <p style={{ fontSize: 13, color: '#64748b' }}>Nouveau centre de formation ?</p>
          <Link to="/creer-espace" className="btn btn-outline w-100">
            Créer un espace établissement
          </Link>
        </div>
      </div>
    </div>
  );
}