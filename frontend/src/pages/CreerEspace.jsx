import { useState } from "react";
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
    <div className="container-fluid vh-100 d-flex align-items-center" style={{ backgroundColor: '#f4f6f8' }}>
      <div className="container">
        <div className="row justify-content-center align-items-center">
          
          {/* COLONNE GAUCHE : Présentation */}
          <div className="col-lg-6 mb-5 mb-lg-0 pe-lg-5">
            <div className="d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-mortarboard-fill text-primary" style={{ fontSize: '2rem' }}></i>
              <h4 className="fw-bold mb-0 text-dark">Plateforme LMS</h4>
            </div>
            
            <h1 className="display-5 fw-bold mb-4" style={{ color: '#1e293b' }}>
              Créez votre propre école en ligne.
            </h1>
            
            <p className="lead text-muted mb-5">
              Rejoignez notre plateforme SaaS et obtenez votre espace dédié. Gérez vos formations, vos formateurs, vos apprenants et vos évaluations en toute simplicité.
            </p>

            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex align-items-start gap-3">
                <i className="bi bi-check-circle-fill text-success fs-5"></i>
                <div>
                  <strong className="d-block text-dark">Espace 100% isolé</strong>
                  <span className="text-muted">Vos données sont sécurisées et séparées des autres établissements.</span>
                </div>
              </div>
              <div className="d-flex align-items-start gap-3">
                <i className="bi bi-check-circle-fill text-success fs-5"></i>
                <div>
                  <strong className="d-block text-dark">Gestion complète</strong>
                  <span className="text-muted">Cours, QCM, suivi de progression et génération d'attestations.</span>
                </div>
              </div>
              <div className="d-flex align-items-start gap-3">
                <i className="bi bi-check-circle-fill text-success fs-5"></i>
                <div>
                  <strong className="d-block text-dark">Prêt en 1 minute</strong>
                  <span className="text-muted">Créez votre compte administrateur et commencez immédiatement.</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : Formulaire */}
          <div className="col-lg-5">
            <div className="card shadow border-0 rounded-4">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h3 className="fw-bold">Créer mon espace</h3>
                  <p className="text-muted">Remplissez les informations de votre établissement.</p>
                </div>

                <form onSubmit={submit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Nom de l'école</label>
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
                    <label className="form-label fw-semibold">Code d'accès unique</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: tech-academy"
                      value={form.codeAcces} 
                      onChange={(e) => setForm({ ...form, codeAcces: e.target.value })} 
                      required 
                    />
                    <div className="form-text small">Ce code identifiera votre école.</div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Prénom (Admin)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={form.prenom} 
                        onChange={(e) => setForm({ ...form, prenom: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Nom (Admin)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={form.nom} 
                        onChange={(e) => setForm({ ...form, nom: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email (Identifiant)</label>
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
                    <label className="form-label fw-semibold">Mot de passe</label>
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

                  <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={chargement}>
                    {chargement ? "Création en cours..." : "Créer mon espace"}
                  </button>
                </form>

                <div className="text-center mt-4 pt-3 border-top">
                  <span className="text-muted">Déjà un compte ? </span>
                  <Link to="/connexion" className="text-decoration-none fw-semibold">Se connecter</Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}