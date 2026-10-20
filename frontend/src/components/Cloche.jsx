import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

const LIBELLES = {
  module_publie: "📚",
  note_disponible: "🎯",
  inscription_validee: "✅",
  inscription_refusee: "❌",
  attestation: "🎉",
};

export default function Cloche() {
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [compteur, setCompteur] = useState(0);
  const boite = useRef(null);

  async function chargerCompteur() {
    try {
      const { total } = await api("/notifications/non-lues");
      setCompteur(total);
    } catch (e) { /* silencieux */ }
  }

  async function charger() {
    try {
      const data = await api("/notifications");
      setNotifs(data);
      setCompteur(data.filter((n) => !n.lu).length);
    } catch (e) { /* silencieux */ }
  }

  useEffect(() => {
    chargerCompteur();
    const minuteur = setInterval(chargerCompteur, 30000); // toutes les 30 sec
    return () => clearInterval(minuteur);
  }, []);

  useEffect(() => {
    if (ouvert) charger();
  }, [ouvert]);

  // Fermer au clic extérieur
  useEffect(() => {
    function fermer(e) {
      if (boite.current && !boite.current.contains(e.target)) setOuvert(false);
    }
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, []);

  async function cliquer(n) {
    // Marquer comme lue
    if (!n.lu) {
      try { await api(`/notifications/${n.id_notification}/lue`, { method: "PATCH" }); } catch (e) {}
    }
    // Rediriger
    if (n.lien) {
      setOuvert(false);
      navigate(n.lien);
    } else {
      charger();
    }
  }

  async function toutMarquerLu() {
    try {
      await api("/notifications/toutes-lues", { method: "PATCH" });
      charger();
    } catch (e) { /* silencieux */ }
  }

  async function supprimer(e, id) {
    e.stopPropagation();
    try {
      await api(`/notifications/${id}`, { method: "DELETE" });
      charger();
    } catch (err) { /* silencieux */ }
  }

  return (
    <div className="cloche" ref={boite}>
      <button
        type="button"
        className="cloche-bouton"
        onClick={() => setOuvert((v) => !v)}
        aria-label={`Notifications${compteur > 0 ? ` (${compteur})` : ""}`}
      >
        <span className="cloche-icone">🔔</span>
        {compteur > 0 && <span className="cloche-badge">{compteur > 9 ? "9+" : compteur}</span>}
      </button>

      {ouvert && (
        <div className="cloche-panneau">
          <div className="cloche-entete">
            <strong>Notifications</strong>
            {notifs.some((n) => !n.lu) && (
              <button type="button" onClick={toutMarquerLu}>Tout marquer comme lu</button>
            )}
          </div>

          <div className="cloche-liste">
            {notifs.length === 0 ? (
              <p className="cloche-vide">Aucune notification pour le moment.</p>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id_notification}
                  className={`cloche-item ${n.lu ? "" : "non-lue"}`}
                  onClick={() => cliquer(n)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="cloche-item-icone">{LIBELLES[n.type] || "🔔"}</span>
                  <div className="cloche-item-texte">
                    <strong>{n.titre}</strong>
                    <span>{n.message}</span>
                    <small>{n.date_creation}</small>
                  </div>
                  <button
                    type="button"
                    className="cloche-item-suppr"
                    onClick={(e) => supprimer(e, n.id_notification)}
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}