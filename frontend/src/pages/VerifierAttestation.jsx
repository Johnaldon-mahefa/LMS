import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function VerifierAttestation() {
  const { numero } = useParams();
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState(false);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api(`/public/attestation/${numero}`)
      .then((res) => { setData(res); setChargement(false); })
      .catch(() => { setErreur(true); setChargement(false); });
  }, [numero]);

  return (
    <div className="connexion-page">
      <div className="connexion-boite text-center shadow-lg">
        
        {chargement ? (
          <div className="spinner-border text-primary" role="status"></div>
        ) : erreur ? (
          <>
            <div style={{ width: 64, height: 64, background: '#fee2e2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <i className="bi bi-x-circle text-danger" style={{ fontSize: 32 }}></i>
            </div>
            <h3 className="fw-bold text-danger mb-3">Attestation Invalide</h3>
            <p className="text-muted">Ce numéro d'attestation n'existe pas ou a été falsifié.</p>
          </>
        ) : data ? (
          <>
            <div style={{ width: 64, height: 64, background: '#dcfce7', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <i className="bi bi-patch-check-fill text-success" style={{ fontSize: 32 }}></i>
            </div>
            <h3 className="fw-bold text-success mb-1">Attestation Authentique</h3>
            <p className="text-muted small mb-4">Document officiellement délivré par Inno-v T LMS.</p>
            
            <div className="bg-light p-4 rounded-3 text-start mb-4 border">
              <p className="mb-2"><strong>Titulaire :</strong> <span className="text-primary">{data.prenom} {data.nom}</span></p>
              <p className="mb-2"><strong>Formation :</strong> {data.formation}</p>
              <p className="mb-2"><strong>Date de délivrance :</strong> {new Date(data.date_delivrance).toLocaleDateString('fr-FR')}</p>
              <p className="mb-0"><strong>N° d'attestation :</strong> <code>{data.numero_attestation}</code></p>
            </div>
          </>
        ) : null}
        
        <Link to="/decouvrir" className="btn btn-primary w-100 mt-2">Retour à l'accueil</Link>
      </div>
    </div>
  );
}
