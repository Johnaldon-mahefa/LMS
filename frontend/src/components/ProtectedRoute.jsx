import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Masque les pages selon le rôle. Le vrai contrôle reste côté serveur (RG15).
export default function ProtectedRoute({ roles, children }) {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return <p>Chargement…</p>;
  if (!utilisateur) return <Navigate to="/connexion" replace />;
  if (roles && !utilisateur.roles.some((r) => roles.includes(r))) return <Navigate to="/" replace />;
  return children;
}
