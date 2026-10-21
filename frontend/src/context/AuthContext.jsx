import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../api/client.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!getToken()) return setChargement(false);
    api("/auth/moi")
      .then((u) => setUtilisateur({ 
        id: u.id_utilisateur, 
        nom: u.nom, 
        prenom: u.prenom, 
        roles: u.roles,
        id_etablissement: u.id_etablissement,
        nom_etablissement: u.nom_etablissement
      }))
      .catch(() => setToken(null))
      .finally(() => setChargement(false));
  }, []);

  async function connecter(identifiant, motDePasse) {
    setToken(null);
    setUtilisateur(null);
    const { token, utilisateur: u } = await api("/auth/login", { method: "POST", body: { identifiant, motDePasse } });
    setToken(token);
    setUtilisateur(u);
  }
  
  function deconnecter() { 
    setToken(null); 
    setUtilisateur(null); 
    window.location.href = "/connexion"; 
  }

  return <AuthContext.Provider value={{ utilisateur, chargement, connecter, deconnecter }}>{children}</AuthContext.Provider>;
}