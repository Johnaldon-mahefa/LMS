import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { utilisateur, connecter } = useAuth();
  const navigate = useNavigate();
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");

  if (utilisateur) return <Navigate to="/" replace />;

  async function soumettre(e) {
    e.preventDefault();
    setErreur("");
    try { await connecter(identifiant, motDePasse); navigate("/"); }
    catch (err) { setErreur(err.message); }
  }

  return (
    <div className="carte centre">
      <h1>Connexion</h1>
      <form onSubmit={soumettre}>
        <label>Identifiant<input value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} required /></label>
        <label>Mot de passe<input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required /></label>
        {erreur && <p className="erreur">{erreur}</p>}
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}
