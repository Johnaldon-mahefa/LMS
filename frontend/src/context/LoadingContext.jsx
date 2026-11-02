import { createContext, useContext, useState } from "react";

const LoadingContext = createContext(null);
export const useLoading = () => useContext(LoadingContext);

export function LoadingProvider({ children }) {
  const [compteur, setCompteur] = useState(0);

  const demarrer = () => setCompteur((c) => c + 1);
  const arreter = () => setCompteur((c) => Math.max(0, c - 1));

  return (
    <LoadingContext.Provider value={{ enChargement: compteur > 0, demarrer, arreter }}>
      {children}
    </LoadingContext.Provider>
  );
}
