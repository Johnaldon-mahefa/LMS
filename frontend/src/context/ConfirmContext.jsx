import { createContext, useContext, useState } from "react";

const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }) {
  const [config, setConfig] = useState(null);

  const confirmer = (options) => {
    return new Promise((resolve) => {
      setConfig({
        titre: options.titre || "Confirmation",
        message: options.message || "Êtes-vous sûr de vouloir continuer ?",
        confirmer: options.confirmer || "Confirmer",
        annuler: options.annuler || "Annuler",
        danger: options.danger || false,
        resolve,
      });
    });
  };

  const fermer = (valeur) => {
    if (config?.resolve) config.resolve(valeur);
    setConfig(null);
  };

  return (
    <ConfirmContext.Provider value={confirmer}>
      {children}
      {config && (
        <div className="confirm-overlay" onClick={(e) => e.target === e.currentTarget && fermer(false)}>
          <div className="confirm-box">
            {/* ICÔNE D'ALERTE */}
            <div className={`confirm-icon ${config.danger ? "danger" : "info"}`}>
              <i className={`bi ${config.danger ? "bi-exclamation-triangle" : "bi-question-circle"}`}></i>
            </div>
            
            <h3 className="confirm-title">{config.titre}</h3>
            <p className="confirm-message">{config.message}</p>
            
            <div className="confirm-actions">
              <button type="button" className="btn-confirm-cancel" onClick={() => fermer(false)}>
                {config.annuler}
              </button>
              <button 
                type="button" 
                className={`btn-confirm-ok ${config.danger ? "danger" : ""}`} 
                onClick={() => fermer(true)}
              >
                {config.confirmer}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}