import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

export default function CreerEspace() {
  const toast = useToast();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ 
    nomEtablissement: "", 
    codeAcces: "", 
    nom: "", 
    prenom: "", 
    email: "", 
    motDePasse: "" 
  });
  const [chargement, setChargement] = useState(false);

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

  async function submit(e) {
    e.preventDefault();
    setChargement(true);
    try {
      await api("/auth/inscrire-etablissement", { method: "POST", body: form });
      toast.ok("Espace créé avec succès ! Vous pouvez maintenant vous connecter.");
      navigate("/connexion");
    } catch (err) {
      toast.erreur(err.message);
      setChargement(false);
    }
  }

  return (
    <div className="container-fluid page-creer-espace py-5 position-relative">
      
      {/* BOUTON MODE SOMBRE FLOTTANT */}
      <div className="position-absolute top-0 end-0 p-4">
        <button 
          type="button" 
          className="topbar-icon-btn" // <-- ON GARDE JUSTE CETTE CLASSE
          onClick={() => setIsDark(!isDark)}
          title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
        >
          <i className={`bi ${isDark ? 'bi-sun-fill text-warning' : 'bi-moon-fill'}`}></i>
        </button>
      </div>

      <div className="container">
        <div className="row justify-content-center align-items-center g-5">
          
          {/* COLONNE GAUCHE : Présentation (Marketing) */}
          <div className="col-lg-6 pe-lg-5">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div style={{ width: 48, height: 48, background: '#e0e7ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-mortarboard-fill" style={{ fontSize: 24, color: 'var(--primary)' }}></i>
              </div>
              <h4 className="fw-bold mb-0" style={{ letterSpacing: '-0.5px' }}>Inno-v T LMS</h4>
            </div>
            
            <h1 className="display-5 fw-bold mb-4" style={{ letterSpacing: '-1px', lineHeight: 1.2 }}>
              Créez votre propre<br />école en ligne.
            </h1>
            
            <p className="lead text-muted mb-5" style={{ fontSize: '1.1rem' }}>
              Rejoignez notre plateforme SaaS et obtenez votre espace dédié. Gérez vos formations, vos formateurs, vos apprenants et vos évaluations en toute simplicité.
            </p>

            <div className="d-flex flex-column gap-4 mb-4">
              <div className="d-flex align-items-start gap-3">
                <div style={{ background: '#dcfce7', padding: '4px 8px', borderRadius: '50%' }}>
                  <i className="bi bi-check-lg text-success fw-bold"></i>
                </div>
                <div>
                  <strong className="d-block text-dark fs-6">Espace 100% isolé</strong>
                  <span className="text-muted small">Vos données sont sécurisées et séparées des autres établissements.</span>
                </div>
              </div>
              <div className="d-flex align-items-start gap-3">
                <div style={{ background: '#dcfce7', padding: '4px 8px', borderRadius: '50%' }}>
                  <i className="bi bi-check-lg text-success fw-bold"></i>
                </div>
                <div>
                  <strong className="d-block text-dark fs-6">Gestion complète</strong>
                  <span className="text-muted small">Cours, QCM, suivi de progression et génération d'attestations.</span>
                </div>
              </div>
              <div className="d-flex align-items-start gap-3">
                <div style={{ background: '#dcfce7', padding: '4px 8px', borderRadius: '50%' }}>
                  <i className="bi bi-check-lg text-success fw-bold"></i>
                </div>
                <div>
                  <strong className="d-block text-dark fs-6">Prêt en 1 minute</strong>
                  <span className="text-muted small">Créez votre compte administrateur et commencez immédiatement.</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : Formulaire */}
          <div className="col-lg-5">
            <div className="card creer-espace-card">
              <div className="card-body p-4 p-md-5">
                
                <div className="text-center mb-4">
                  <h3 className="fw-bold" style={{ letterSpacing: '-0.5px' }}>Créer mon espace</h3>
                  <p className="text-muted small">Remplissez les informations de votre établissement.</p>
                </div>

                <form onSubmit={submit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-muted small">Nom de l'école</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: Tech Academy"
                      value={form.nomEtablissement} 
                      onChange={(e) => setForm({ ...form, nomEtablissement: e.target.value })} 
                      required 
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-muted small">Code d'accès unique</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: tech-academy"
                      value={form.codeAcces} 
                      onChange={(e) => setForm({ ...form, codeAcces: e.target.value })} 
                      required 
                    />
                    <div className="form-text small mt-1">Ce code identifiera votre école (minuscules, sans espaces).</div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted small">Prénom</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Jean"
                        value={form.prenom} 
                        onChange={(e) => setForm({ ...form, prenom: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-muted small">Nom</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Dupont"
                        value={form.nom} 
                        onChange={(e) => setForm({ ...form, nom: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-muted small">Email (Identifiant)</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="admin@votre-ecole.com"
                      value={form.email} 
                      onChange={(e) => setForm({ ...form, email: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold text-muted small">Mot de passe</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="Min. 8 caractères"
                      value={form.motDePasse} 
                      onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} 
                      minLength={8}
                      required 
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100" disabled={chargement}>
                    {chargement ? "Création en cours..." : "Créer mon espace"}
                  </button>
                </form>

                <div className="text-center mt-4 pt-4 border-top">
                  <span className="text-muted small">Déjà un compte ? </span>
                  <Link to="/connexion" className="text-decoration-none fw-bold" style={{ color: 'var(--primary)' }}>Se connecter</Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}