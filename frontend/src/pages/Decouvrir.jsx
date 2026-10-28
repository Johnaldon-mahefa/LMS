import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

export default function Decouvrir() {
  const toast = useToast();
  const navigate = useNavigate();

  const [ecoles, setEcoles] = useState([]);
  const [ecoleSelectionnee, setEcoleSelectionnee] = useState(null);
  const [formations, setFormations] = useState([]);
  const [formationOuverte, setFormationOuverte] = useState(null);
  const [afficherInscription, setAfficherInscription] = useState(false);
  const [formInscription, setFormInscription] = useState({ nom: "", prenom: "", email: "", motDePasse: "" });

  // GESTION DU MODE SOMBRE
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    api("/public/ecoles").then(setEcoles).catch(() => toast.erreur("Erreur de chargement."));
  }, []);

  const voirFormations = (ecole) => {
    setEcoleSelectionnee(ecole);
    setFormationOuverte(null); 
    api(`/public/ecoles/${ecole.id_etablissement}/formations`)
      .then(setFormations)
      .catch(() => toast.erreur("Erreur de chargement des formations."));
  };

  async function soumettreInscription(e) {
    e.preventDefault();
    try {
      const res = await api("/public/inscription", {
        method: "POST",
        body: { ...formInscription, codeAccesEcole: ecoleSelectionnee.code_acces }
      });
      toast.ok(res.message); 
      setAfficherInscription(false);
      setTimeout(() => navigate("/connexion"), 2000);
    } catch (err) {
      toast.erreur(err.message);
    }
  }

  return (
    <div className="landing-page">
      
      {/* 1. NAVBAR PUBLIQUE */}
      <nav className="landing-navbar">
        <div className="container d-flex justify-content-between align-items-center">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/decouvrir">
            <div className="brand-icon"><i className="bi bi-mortarboard-fill"></i></div>
            <span className="fw-bold fs-4" style={{ letterSpacing: '-0.5px' }}>Inno-v T LMS</span>
          </Link>
          <div className="d-flex gap-3 align-items-center">
            {/* BOUTON MODE SOMBRE */}
            <button 
              type="button" 
              className="btn topbar-icon-btn" 
              onClick={() => setIsDark(!isDark)}
              title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              <i className={`bi ${isDark ? 'bi-sun-fill text-warning' : 'bi-moon-fill'}`}></i>
            </button>
            <Link to="/connexion" className="btn btn-ghost">Connexion</Link>
            <Link to="/creer-espace" className="btn btn-primary">Créer mon école</Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <div className="landing-hero">
        <div className="container text-center position-relative z-1">
          <h1 className="display-4 fw-bold mb-4" style={{ letterSpacing: '-1.5px', lineHeight: 1.1 }}>
            Bienvenue sur <span className="text-primary">Inno-v T LMS</span>
          </h1>
          <p className="lead text-muted mb-5 mx-auto" style={{ maxWidth: '600px', fontSize: '1.2rem' }}>
            Découvrez les formations de nos écoles partenaires et commencez votre apprentissage dès aujourd'hui.
          </p>
        </div>
        <div className="hero-shape hero-shape-1"></div>
        <div className="hero-shape hero-shape-2"></div>
      </div>

      {/* 3. CATALOGUE */}
      <div className="container py-5 my-4">
        <div className="row g-5">
          <div className="col-12 col-lg-4">
            <h4 className="fw-bold mb-4">Nos Écoles Partenaires</h4>
            <div className="d-flex flex-column gap-3">
              {ecoles.map((ecole) => (
                <div 
                  key={ecole.id_etablissement}
                  className={`school-card ${ecoleSelectionnee?.id_etablissement === ecole.id_etablissement ? "active" : ""}`}
                  onClick={() => voirFormations(ecole)}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="fw-bold mb-1 text-dark">{ecole.nom}</h5>
                      <span className="text-muted small"><i className="bi bi-collection-play me-1"></i> {ecole.nb_formations} formation(s)</span>
                    </div>
                    <i className="bi bi-arrow-right fs-4 text-muted"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-12 col-lg-8">
            {ecoleSelectionnee ? (
              <div className="ps-lg-4">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                  <h4 className="fw-bold mb-0">Cursus chez <span className="text-primary">{ecoleSelectionnee.nom}</span></h4>
                  <button className="btn btn-primary px-4" onClick={() => setAfficherInscription(true)}>
                    <i className="bi bi-person-plus me-2"></i> Rejoindre cette école
                  </button>
                </div>

                {formations.length === 0 ? (
                  <div className="alert alert-info border-0 shadow-sm rounded-4">Aucune formation publiée pour le moment.</div>
                ) : (
                  <div className="row g-4 align-items-start">
                    {formations.map((f) => {
                      const estOuverte = formationOuverte === f.id_formation;
                      return (
                        <div key={f.id_formation} className="col-12 col-md-6">
                          <div className="card course-card">
                            <div className="card-body p-4 d-flex flex-column">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className="course-icon"><i className="bi bi-journal-code"></i></div>
                                <span className="badge bg-light text-dark border">Certificat</span>
                              </div>
                              <h5 className="fw-bold text-dark mb-2">{f.intitule}</h5>
                              <p className="text-muted small mb-4">{f.description || "Aucune description fournie pour ce cours."}</p>
                              
                              <div className="d-flex gap-3 text-muted small mb-3 pt-3 border-top mt-auto">
                                <span><i className="bi bi-clock me-1"></i> {f.duree || "N/A"} heures</span>
                                <span><i className="bi bi-play-btn me-1"></i> {f.nb_modules} modules</span>
                              </div>

                              {f.modules && f.modules.length > 0 && (
                                <div className="mb-3">
                                  <div 
                                    className="btn-programme"
                                    onClick={() => setFormationOuverte(estOuverte ? null : f.id_formation)}
                                    role="button"
                                  >
                                    {estOuverte ? "Masquer le programme" : "Voir le programme"} 
                                    <i className={`bi bi-chevron-${estOuverte ? 'up' : 'down'} ms-1`}></i>
                                  </div>
                                  
                                  {estOuverte && (
                                    <div className="mt-2 module-list">
                                      <ul className="list-unstyled mb-0">
                                        {f.modules.map((titreModule, idx) => (
                                          <li key={idx} className="d-flex align-items-center gap-2 mb-2 small text-dark">
                                            <i className="bi bi-play-circle-fill text-primary"></i> {titreModule}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <button className="btn btn-outline-primary w-100" onClick={() => setAfficherInscription(true)}>
                                S'inscrire à ce cours
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted" style={{ minHeight: '400px' }}>
                <i className="bi bi-building fs-1 mb-3 text-primary opacity-50"></i>
                <h4 className="fw-bold text-dark">Sélectionnez une école</h4>
                <p>Cliquez sur une école à gauche pour voir ses formations.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALE D'INSCRIPTION */}
      {afficherInscription && ecoleSelectionnee && (
        <div className="lms-modal-overlay" onClick={(e) => e.target === e.currentTarget && setAfficherInscription(false)}>
          <div className="lms-modal-box">
            <div className="lms-modal-header">
              <h2>Rejoindre {ecoleSelectionnee.nom}</h2>
              <button type="button" onClick={() => setAfficherInscription(false)}>✕</button>
            </div>
            <form onSubmit={soumettreInscription}>
              <div className="lms-modal-body">
                <p className="text-muted small mb-4">Créez votre compte apprenant ou utilisez un compte existant.</p>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label>Prénom</label>
                    <input type="text" className="form-control" value={formInscription.prenom} onChange={(e) => setFormInscription({ ...formInscription, prenom: e.target.value })} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label>Nom</label>
                    <input type="text" className="form-control" value={formInscription.nom} onChange={(e) => setFormInscription({ ...formInscription, nom: e.target.value })} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label>Email</label>
                  <input type="email" className="form-control" value={formInscription.email} onChange={(e) => setFormInscription({ ...formInscription, email: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label>Mot de passe</label>
                  <input type="password" className="form-control" minLength={8} value={formInscription.motDePasse} onChange={(e) => setFormInscription({ ...formInscription, motDePasse: e.target.value })} required />
                </div>
              </div>
              <div className="lms-modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setAfficherInscription(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Valider l'inscription</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}