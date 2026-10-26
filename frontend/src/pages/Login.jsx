import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [choixEcoles, setChoixEcoles] = useState(null); // Stocke les écoles si besoin
  
  const { connecter, connecterEcole } = useAuth();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      const res = await connecter(identifiant, motDePasse);
      if (res.choix_ecole_requis) {
        setChoixEcoles(res);
      } else {
        navigate("/");
      }
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  async function choisirEcole(idEtablissement) {
    setChargement(true);
    try {
      await connecterEcole(choixEcoles.idUtilisateur, idEtablissement);
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
          <p style={{ color: '#64748b', fontSize: 14 }}>Connectez-vous à votre espace.</p>
        </div>

        {erreur && <div className="badge-danger w-100 mb-3 text-center" style={{ padding: 10 }}>{erreur}</div>}

        {/* SI L'UTILISATEUR DOIT CHOISIR UNE ÉCOLE */}
        {choixEcoles ? (
          <div>
            <h5 className="text-center mb-4">Choisissez votre espace</h5>
            <div className="d-flex flex-column gap-2">
              {choixEcoles.ecoles.map((e) => (
                <button 
                  key={e.id} 
                  className="btn btn-outline-primary py-3 text-start px-4" 
                  onClick={() => choisirEcole(e.id)}
                  disabled={chargement}
                >
                  <i className="bi bi-building me-2"></i> {e.nom}
                </button>
              ))}
            </div>
            <button className="btn btn-link w-100 mt-3 text-muted text-decoration-none" onClick={() => setChoixEcoles(null)}>
              ← Retour
            </button>
          </div>
        ) : (
          /* FORMULAIRE NORMAL */
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Identifiant</label>
              <input type="text" className="form-control" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="form-label">Mot de passe</label>
              <input type="password" className="form-control" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={chargement}>
              {chargement ? "Connexion..." : "Se connecter"}
            </button>
            <div className="text-center mt-4 pt-3 border-top">
              <p className="mb-2 text-muted" style={{ fontSize: 13 }}>Nouveau centre de formation ?</p>
              <Link to="/creer-espace" className="btn btn-outline-secondary w-100">Créer un espace</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}