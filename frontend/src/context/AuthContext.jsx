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
      .then((u) => {
         // On récupère les infos depuis le token stocké localement
         const token = getToken();
         if (token) {
           const payload = JSON.parse(atob(token.split('.')[1]));
           setUtilisateur({
             id: u.id_utilisateur,
             nom: u.nom,
             prenom: u.prenom,
             roles: payload.roles,
             id_etablissement: payload.id_etablissement
           });
         }
      })
      .catch(() => setToken(null))
      .finally(() => setChargement(false));
  }, []);

  async function connecter(identifiant, motDePasse) {
    setToken(null);
    setUtilisateur(null);
    const res = await api("/auth/login", { method: "POST", body: { identifiant, motDePasse } });
    
    // Si l'utilisateur a plusieurs écoles
    if (res.choix_ecole_requis) {
      return { choix_ecole_requis: true, ecoles: res.ecoles, idUtilisateur: res.idUtilisateur };
    }
    
    // Sinon, connexion normale
    setToken(res.token);
    setUtilisateur(res.utilisateur);
    return { success: true };
  }

  async function connecterEcole(idUtilisateur, idEtablissement) {
    const res = await api("/auth/connexion-ecole", { method: "POST", body: { idUtilisateur, idEtablissement } });
    setToken(res.token);
    setUtilisateur(res.utilisateur);
    return { success: true };
  }
  
  function deconnecter() { 
    setToken(null); 
    setUtilisateur(null); 
    window.location.href = "/connexion"; 
  }

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, connecter, connecterEcole, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}