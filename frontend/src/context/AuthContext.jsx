import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../api/client.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

  // Au rechargement de la page, on retrouve l'utilisateur à partir du jeton conservé.
  useEffect(() => {
    if (!getToken()) return setChargement(false);
    api("/auth/moi")
      .then((u) => setUtilisateur({ id: u.id_utilisateur, nom: u.nom, prenom: u.prenom, roles: u.roles }))
      .catch(() => setToken(null))
      .finally(() => setChargement(false));
  }, []);

  async function connecter(identifiant, motDePasse) {
    const { token, utilisateur: u } = await api("/auth/login", { method: "POST", body: { identifiant, motDePasse } });
    setToken(token);
    setUtilisateur(u);
  }
  function deconnecter() { setToken(null); setUtilisateur(null); }

  return <AuthContext.Provider value={{ utilisateur, chargement, connecter, deconnecter }}>{children}</AuthContext.Provider>;
}
