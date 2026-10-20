import { createContext, useCallback, useContext, useRef, useState } from "react";

const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);

// Modale de confirmation : const ok = await confirmer({ titre, message, danger: true })
export function ConfirmProvider({ children }) {
  const [demande, setDemande] = useState(null);
  const resolveur = useRef(null);

  const confirmer = useCallback(
    (options) => new Promise((resolve) => { resolveur.current = resolve; setDemande(options); }),
    []
  );

  const fermer = (valeur) => {
    resolveur.current?.(valeur);
    setDemande(null);
  };

  return (
    <ConfirmContext.Provider value={confirmer}>
      {children}
      {demande && (
        <div className="fond-modal" onClick={(e) => e.target === e.currentTarget && fermer(false)}>
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-corps" style={{ textAlign: "center", paddingTop: 30 }}>
              <div className={`confirm-icone ${demande.danger ? "" : "neutre"}`}>
                {demande.danger ? "!" : "?"}
              </div>
              <h2>{demande.titre || "Confirmer l'action"}</h2>
              {demande.message && (
                <p style={{ marginTop: 10, color: "#6b6485", lineHeight: 1.5 }}>{demande.message}</p>
              )}
            </div>
            <div className="modal-pied" style={{ justifyContent: "center" }}>
              <button type="button" className="btn secondaire" onClick={() => fermer(false)}>
                Annuler
              </button>
              <button
                type="button"
                className={`btn ${demande.danger ? "danger" : ""}`}
                onClick={() => fermer(true)}
                autoFocus
              >
                {demande.confirmer || "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}