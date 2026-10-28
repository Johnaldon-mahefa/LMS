import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ roles, children }) {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return <p>Chargement…</p>;
  // Redirection vers la page publique au lieu du login
  if (!utilisateur) return <Navigate to="/decouvrir" replace />; 
  if (roles && !utilisateur.roles.some((r) => roles.includes(r))) return <Navigate to="/" replace />;
  return children;
}