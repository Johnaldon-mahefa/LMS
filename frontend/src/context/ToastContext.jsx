import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

// Notifications flottantes : toast.ok("..."), toast.erreur("..."), toast.info("...")
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const ajouter = useCallback((type, texte, duree = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, texte }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duree);
  }, []);

  const api = {
    ok: (t) => ajouter("ok", t, 3500),
    erreur: (t) => ajouter("bad", t, 6000),
    info: (t) => ajouter("info", t, 4500),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-icone">
              {t.type === "ok" && "✓"}
              {t.type === "bad" && "!"}
              {t.type === "info" && "i"}
            </span>
            <p>{t.texte}</p>
            <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} aria-label="Fermer">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}