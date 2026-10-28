import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

const ICONES = {
  module_publie: "bi-journal-bookmark",
  note_disponible: "bi-bullseye",
  inscription_validee: "bi-check-circle",
  inscription_refusee: "bi-x-circle",
  attestation: "bi-award",
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
    const minuteur = setInterval(chargerCompteur, 30000);
    return () => clearInterval(minuteur);
  }, []);

  useEffect(() => {
    if (ouvert) charger();
  }, [ouvert]);

  useEffect(() => {
    function fermer(e) {
      if (boite.current && !boite.current.contains(e.target)) setOuvert(false);
    }
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, []);

  async function cliquer(n) {
    if (!n.lu) {
      try { await api(`/notifications/${n.id_notification}/lue`, { method: "PATCH" }); } catch (e) {}
    }
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
    <div className="position-relative" ref={boite}>
      <button
        type="button"
        className="topbar-icon-btn position-relative"
        onClick={() => setOuvert((v) => !v)}
        aria-label={`Notifications${compteur > 0 ? ` (${compteur})` : ""}`}
      >
        <i className="bi bi-bell fs-5"></i>
        {compteur > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px', padding: '4px 6px' }}>
            {compteur > 9 ? "9+" : compteur}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="notif-dropdown position-absolute end-0 mt-2">
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <strong className="mb-0">Notifications</strong>
            {notifs.some((n) => !n.lu) && (
              <button type="button" className="btn btn-link btn-sm text-decoration-none p-0" onClick={toutMarquerLu} style={{ fontSize: '12px', fontWeight: 600 }}>
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <p className="text-muted text-center p-4 mb-0">Aucune notification pour le moment.</p>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id_notification}
                  className={`d-flex align-items-start p-3 border-bottom position-relative ${n.lu ? '' : 'notif-unread'}`}
                  onClick={() => cliquer(n)}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="me-3 text-primary fs-5">
                    <i className={`bi ${ICONES[n.type] || 'bi-bell'}`}></i>
                  </div>
                  <div className="flex-grow-1 pe-2">
                    <div className="fw-bold small">{n.titre}</div>
                    <div className="small text-muted">{n.message}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>{n.date_creation}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link text-muted p-0 ms-2 text-decoration-none"
                    onClick={(e) => supprimer(e, n.id_notification)}
                    title="Supprimer"
                  >
                    <i className="bi bi-x-lg"></i>
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