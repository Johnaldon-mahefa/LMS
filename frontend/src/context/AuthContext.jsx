import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../api/client.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    if (!getToken()) {
      setChargement(false);
      return;
    }
    api("/auth/moi")
      .then((u) => {
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
           if (u.features) setFeatures(u.features);
         }
      })
      .catch((err) => {
        console.error("Erreur profil:", err);
        if (!err.message.includes("communication")) setToken(null);
      })
      .finally(() => setChargement(false));
  }, []);

  async function rafraichirFeatures() {
    if (!getToken()) return;
    try {
      const u = await api("/auth/moi");
      if (u.features) setFeatures(u.features);
    } catch (e) {}
  }

  // MISE À JOUR : On ajoute captchaToken
  async function connecter(identifiant, motDePasse, captchaToken) {
    setToken(null);
    setUtilisateur(null);
    setFeatures([]);
    
    const res = await api("/auth/login", { 
      method: "POST", 
      body: { 
        identifiant, 
        motDePasse,
        "cf-turnstile-response": captchaToken // <-- On envoie le token
      } 
    });
    
    if (res.choix_ecole_requis) {
      return { choix_ecole_requis: true, ecoles: res.ecoles, idUtilisateur: res.idUtilisateur };
    }
    
    setToken(res.token);
    setUtilisateur(res.utilisateur);
    if (res.features) setFeatures(res.features);
    return { success: true };
  }

  async function connecterEcole(idUtilisateur, idEtablissement) {
    const res = await api("/auth/connexion-ecole", { method: "POST", body: { idUtilisateur, idEtablissement } });
    setToken(res.token);
    setUtilisateur(res.utilisateur);
    if (res.features) setFeatures(res.features);
    return { success: true };
  }
  
  function deconnecter() { 
    setToken(null); 
    setUtilisateur(null); 
    setFeatures([]);
    window.location.href = "/connexion"; 
  }

  const aAcces = (codeFonctionnalite) => features.includes(codeFonctionnalite);

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, features, aAcces, rafraichirFeatures, connecter, connecterEcole, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}