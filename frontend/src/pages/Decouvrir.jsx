import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

export default function Decouvrir() {
  const [ecoles, setEcoles] = useState([]);
  const [plans, setPlans] = useState([]);
  const [faqOuverte, setFaqOuverte] = useState(0);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  const navigate = useNavigate();
  const toast = useToast();

  // États pour la modale d'inscription
  const [ecoleSelectionnee, setEcoleSelectionnee] = useState(null);
  const [afficherInscription, setAfficherInscription] = useState(false);
  const [formInscription, setFormInscription] = useState({ nom: "", prenom: "", email: "", motDePasse: "" });

  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    api("/public/ecoles").then(setEcoles).catch(() => {});
    api("/public/plans").then(setPlans).catch(() => {});
  }, []);

  const ouvrirInscription = (ecole) => {
    setEcoleSelectionnee(ecole);
    setAfficherInscription(true);
  };

  async function soumettreInscription(e) {
    e.preventDefault();
    try {
      const res = await api("/public/inscription", {
        method: "POST",
        body: { ...formInscription, codeAccesEcole: ecoleSelectionnee.code_acces },
      });
      toast.ok(res.message);
      setAfficherInscription(false);
      setTimeout(() => navigate("/connexion"), 2000);
    } catch (err) {
      toast.erreur(err.message);
    }
  }

  const faqs = [
    { q: "Qu'est-ce qu'Inno-v T LMS ?", a: "Inno-v T LMS est une plateforme SaaS qui permet aux centres de formation de gérer leurs formations, leurs formateurs, leurs apprenants et leurs évaluations dans un espace sécurisé." },
    { q: "Qui peut créer une plateforme ?", a: "Tout organisme de formation, école ou formateur indépendant souhaitant digitaliser son activité." },
    { q: "Comment créer mon espace de formation ?", a: "Cliquez sur « Créer ma plateforme », renseignez les informations de votre établissement, puis attendez la validation de votre compte." },
    { q: "Puis-je gérer plusieurs formateurs ?", a: "Oui, selon votre plan d'abonnement, vous pouvez affecter plusieurs formateurs à vos sessions." },
  ];

  return (
    <div className="public-page">
      
      {/* 1. NAVBAR */}
      <nav className="pub-navbar">
        <div className="container d-flex justify-content-between align-items-center">
          <Link to="/decouvrir" className="pub-brand">
            <div className="pub-brand-icon"><i className="bi bi-mortarboard-fill"></i></div>
            <span>Inno-v T <small>LMS</small></span>
          </Link>
          
          <div className={`pub-nav-links ${menuOuvert ? "open" : ""}`}>
            <a href="#fonctionnalites" onClick={() => setMenuOuvert(false)}>Fonctionnalités</a>
            <a href="#clients" onClick={() => setMenuOuvert(false)}>Nos Clients</a>
            <a href="#tarifs" onClick={() => setMenuOuvert(false)}>Tarifs</a>
            <a href="#apropos" onClick={() => setMenuOuvert(false)}>À propos</a>
            <a href="#faq" onClick={() => setMenuOuvert(false)}>FAQ</a>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button className="pub-icon-btn" onClick={() => setIsDark(!isDark)}>
              <i className={`bi ${isDark ? "bi-sun-fill" : "bi-moon-fill"}`}></i>
            </button>
            <Link to="/connexion" className="btn btn-outline-primary d-none d-md-block fw-semibold">Connexion</Link>
            <Link to="/creer-espace" className="btn btn-primary d-none d-md-block fw-semibold">Créer ma plateforme</Link>
            <button className="pub-icon-btn d-md-none" onClick={() => setMenuOuvert(!menuOuvert)}>
              <i className={`bi ${menuOuvert ? "bi-x-lg" : "bi-list"}`}></i>
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pub-hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <span className="pub-badge"><i className="bi bi-stars"></i> Plateforme LMS Multi-Tenant</span>
              <h1 className="display-4 fw-bold mt-3 mb-4" style={{ letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                Créez votre plateforme de <br/>
                <span className="text-primary">formation en ligne.</span>
              </h1>
              <p className="lead text-muted mb-5" style={{ fontSize: '1.1rem' }}>
                Gérez vos formations, vos formateurs et vos apprenants depuis un espace unique. 
                Une solution LMS flexible pour développer votre activité.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/creer-espace" className="btn btn-primary btn-lg px-4 py-3 fw-bold">
                  Créer ma plateforme <i className="bi bi-arrow-right ms-2"></i>
                </Link>
                <a href="#fonctionnalites" className="btn btn-outline-primary btn-lg px-4 py-3 fw-bold">
                  Découvrir la solution
                </a>
              </div>
            </div>
            
            <div className="col-lg-6">
              {/* NOUVELLE IMAGE 3D ICI */}
              <div className="pub-hero-visual position-relative text-center">
                
                <img 
                  src="/hero-illustration.png" 
                  alt="Illustration écosystème d'apprentissage" 
                  className="pub-hero-image" 
                />

                {/* PUCES ANIMÉES AUTOUR DE L'IMAGE */}
                <div className="pub-float-chip pub-chip-1 bg-white rounded-pill shadow-sm px-3 py-2 border">
                  <i className="bi bi-bar-chart-fill text-primary me-2"></i> Suivi de progression
                </div>
                <div className="pub-float-chip pub-chip-2 bg-white rounded-pill shadow-sm px-3 py-2 border">
                  <i className="bi bi-patch-check-fill text-success me-2"></i> Attestation PDF
                </div>
                <div className="pub-float-chip pub-chip-3 bg-white rounded-pill shadow-sm px-3 py-2 border">
                  <i className="bi bi-play-circle-fill text-info me-2"></i> Leçons interactives
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FONCTIONNALITÉS */}
      <section id="fonctionnalites" className="pub-section bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Une solution complète</h2>
            <p className="text-muted">Tout ce dont vous avez besoin pour gérer votre centre de formation.</p>
          </div>
          <div className="row g-4">
            {[
              { icon: "bi-building", title: "Multi-Établissements", desc: "Chaque école dispose d'un espace isolé et sécurisé." },
              { icon: "bi-journal-bookmark", title: "Formations", desc: "Créez vos modules, leçons et sessions en quelques clics." },
              { icon: "bi-patch-question", title: "QCM & Évaluations", desc: "Évaluez vos apprenants avec des QCM ou des PDF." },
              { icon: "bi-graph-up", title: "Suivi de progression", desc: "Suivez l'avancement de chaque apprenant en temps réel." },
              { icon: "bi-award", title: "Attestations", desc: "Générez des diplômes PDF avec QR code de vérification." },
              { icon: "bi-credit-card", title: "Paiement MVola", desc: "Gérez vos abonnements directement via Mobile Money." }
            ].map((f, i) => (
              <div key={i} className="col-12 col-md-6 col-lg-4">
                <div className="pub-feature-card p-4 bg-white rounded-4 shadow-sm h-100">
                  <div className="pub-feature-icon mb-3"><i className={`bi ${f.icon}`}></i></div>
                  <h5 className="fw-bold mb-2">{f.title}</h5>
                  <p className="text-muted small mb-0">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. NOS CLIENTS (Avec bouton S'inscrire) */}
      <section id="clients" className="pub-section">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Nos établissements partenaires</h2>
            <p className="text-muted">Ils nous font confiance pour gérer leurs formations.</p>
          </div>
          <div className="row g-4 justify-content-center">
            {ecoles.length === 0 ? (
              <div className="col-12 text-center text-muted">Chargement des établissements...</div>
            ) : (
              ecoles.map((ecole) => (
                <div key={ecole.id_etablissement} className="col-12 col-md-6 col-lg-4">
                  <div className="pub-client-card p-4 bg-white rounded-4 shadow-sm h-100 d-flex flex-column">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="pub-client-icon"><i className="bi bi-building"></i></div>
                      <div>
                        <h5 className="fw-bold mb-1">{ecole.nom}</h5>
                        <span className="text-muted small"><i className="bi bi-collection-play me-1"></i> {ecole.nb_formations} formations</span>
                      </div>
                    </div>
                    <button className="btn btn-outline-primary w-100 mt-auto fw-semibold" onClick={() => ouvrirInscription(ecole)}>
                      S'inscrire à cette école
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. TARIFS */}
      <section id="tarifs" className="pub-section bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Nos plans d'abonnement</h2>
            <p className="text-muted">Choisissez le plan qui correspond à votre activité.</p>
          </div>
          <div className="row g-4 justify-content-center">
            {plans.length === 0 ? (
              <div className="col-12 text-center text-muted">Chargement des offres...</div>
            ) : (
              plans.map((plan) => {
                const isPro = plan.nom.toLowerCase().includes("pro") || plan.nom.toLowerCase().includes("premium");
                return (
                  <div key={plan.id_plan} className="col-12 col-md-6 col-lg-4">
                    <div className={`pub-price-card p-4 bg-white rounded-4 shadow-sm h-100 position-relative ${isPro ? 'border-primary border-2' : ''}`}>
                      {isPro && <span className="badge bg-primary position-absolute top-0 start-50 translate-middle rounded-pill px-3 py-2">Recommandé</span>}
                      <h4 className="fw-bold mb-1 mt-2">{plan.nom}</h4>
                      <p className="text-muted small mb-4">{plan.description}</p>
                      <div className="mb-4">
                        <span className="display-5 fw-bold">{Number(plan.prix_mensuel).toLocaleString('fr-FR')}</span>
                        <span className="text-muted fw-semibold"> Ar / mois</span>
                      </div>
                      <ul className="list-unstyled mb-4">
                        <li className="mb-2 small"><i className="bi bi-check2-circle text-success me-2"></i>Formations illimitées</li>
                        <li className="mb-2 small"><i className="bi bi-check2-circle text-success me-2"></i>{plan.fonctionnalites?.includes('QCM') ? 'QCM interactifs' : 'Évaluations PDF'}</li>
                        <li className="mb-2 small"><i className="bi bi-check2-circle text-success me-2"></i>{plan.fonctionnalites?.includes('ATTESTATION') ? 'Attestations PDF' : 'Support standard'}</li>
                      </ul>
                      <Link to="/creer-espace" className={`btn w-100 fw-bold ${isPro ? 'btn-primary' : 'btn-outline-primary'}`}>
                        Choisir ce plan
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 6. À PROPOS */}
      <section id="apropos" className="pub-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0 text-center">
               <div className="p-5 bg-light rounded-4 border d-inline-block w-100">
                 <i className="bi bi-buildings text-primary" style={{ fontSize: '6rem' }}></i>
                 <h4 className="fw-bold mt-3">INNOV-T Consulting</h4>
                 <p className="text-muted mb-0">Fianarantsoa, Madagascar</p>
               </div>
            </div>
            <div className="col-lg-6 ps-lg-5">
              <h2 className="fw-bold mb-3">À propos d'INNOV-T</h2>
              <h5 className="text-primary fw-semibold mb-3">L'innovation numérique au service de votre réussite</h5>
              <p className="text-muted mb-4">
                INNOV-T Consulting est une entreprise informatique spécialisée dans le développement de solutions numériques et l'accompagnement des entreprises dans leur transformation digitale.
              </p>
              <ul className="list-unstyled mb-4">
                <li className="mb-2 d-flex gap-2"><i className="bi bi-check-circle-fill text-primary"></i> <span className="text-muted">Développement web et mobile</span></li>
                <li className="mb-2 d-flex gap-2"><i className="bi bi-check-circle-fill text-primary"></i> <span className="text-muted">Conception de logiciels desktop</span></li>
                <li className="mb-2 d-flex gap-2"><i className="bi bi-check-circle-fill text-primary"></i> <span className="text-muted">Solutions de gestion ERP et CRM</span></li>
                <li className="mb-2 d-flex gap-2"><i className="bi bi-check-circle-fill text-primary"></i> <span className="text-muted">Intelligence artificielle et SaaS</span></li>
              </ul>
              <a href="https://innov-t.netlify.app" target="_blank" rel="noreferrer" className="btn btn-outline-primary">
                Découvrir INNOV-T <i className="bi bi-box-arrow-up-right ms-1"></i>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="pub-section bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Questions fréquentes</h2>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="accordionFAQ">
                {faqs.map((f, i) => (
                  <div className="accordion-item border-0 mb-2 shadow-sm rounded-3 overflow-hidden" key={i}>
                    <h2 className="accordion-header">
                      <button 
                        className={`accordion-button ${faqOuverte === i ? '' : 'collapsed'} fw-bold`} 
                        type="button" 
                        onClick={() => setFaqOuverte(faqOuverte === i ? null : i)}
                      >
                        {f.q}
                      </button>
                    </h2>
                    <div className={`accordion-collapse collapse ${faqOuverte === i ? 'show' : ''}`}>
                      <div className="accordion-body text-muted">
                        {f.a}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="pub-footer">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="pub-brand-icon bg-white text-primary"><i className="bi bi-mortarboard-fill"></i></div>
                <span className="fw-bold fs-4 text-white">Inno-v T LMS</span>
              </div>
              <p className="text-white-50 small mb-0">
                La plateforme qui simplifie la gestion de la formation. Apprenez. Gérez. Progressez.
              </p>
            </div>
            <div className="col-6 col-md-3 col-lg-2 offset-lg-1">
              <h6 className="text-white fw-bold mb-3">Découvrir</h6>
              <ul className="list-unstyled pub-footer-links">
                <li><a href="#fonctionnalites">Fonctionnalités</a></li>
                <li><a href="#clients">Nos Clients</a></li>
                <li><a href="#tarifs">Tarifs</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <h6 className="text-white fw-bold mb-3">Plateforme</h6>
              <ul className="list-unstyled pub-footer-links">
                <li><Link to="/connexion">Se connecter</Link></li>
                <li><Link to="/creer-espace">Créer un compte</Link></li>
              </ul>
            </div>
            <div className="col-lg-3">
              <h6 className="text-white fw-bold mb-3">Contact</h6>
              <ul className="list-unstyled pub-footer-links">
                <li><i className="bi bi-telephone me-2"></i> +261 34 34 131 12</li>
                <li><i className="bi bi-envelope me-2"></i> contactinnovt@gmail.com</li>
                <li><i className="bi bi-geo-alt me-2"></i> Fianarantsoa, Madagascar</li>
              </ul>
            </div>
          </div>
          <hr className="border-secondary my-4" />
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 small text-white-50">
            <span>© 2026 Inno-v T LMS. Tous droits réservés.</span>
            <span>Une solution développée par <a href="https://innov-t.netlify.app" className="text-white text-decoration-none fw-bold">INNOV-T Consulting</a>.</span>
          </div>
        </div>
      </footer>

      {/* 9. MODALE D'INSCRIPTION */}
      {afficherInscription && ecoleSelectionnee && (
        <div className="lms-modal-overlay" onClick={(e) => e.target === e.currentTarget && setAfficherInscription(false)}>
          <div className="lms-modal-box">
            <div className="lms-modal-header">
              <h2>Rejoindre {ecoleSelectionnee.nom}</h2>
              <button type="button" onClick={() => setAfficherInscription(false)}>✕</button>
            </div>
            <form onSubmit={soumettreInscription}>
              <div className="lms-modal-body">
                <p className="text-muted small mb-4">Créez votre compte apprenant pour accéder aux formations de cette école.</p>
                <div className="row">
                  <div className="col-md-6 mb-3"><label>Prénom</label><input type="text" className="form-control" value={formInscription.prenom} onChange={(e) => setFormInscription({ ...formInscription, prenom: e.target.value })} required /></div>
                  <div className="col-md-6 mb-3"><label>Nom</label><input type="text" className="form-control" value={formInscription.nom} onChange={(e) => setFormInscription({ ...formInscription, nom: e.target.value })} required /></div>
                </div>
                <div className="mb-3"><label>Email</label><input type="email" className="form-control" value={formInscription.email} onChange={(e) => setFormInscription({ ...formInscription, email: e.target.value })} required /></div>
                <div className="mb-3"><label>Mot de passe</label><input type="password" className="form-control" minLength={8} value={formInscription.motDePasse} onChange={(e) => setFormInscription({ ...formInscription, motDePasse: e.target.value })} required /></div>
              </div>
              <div className="lms-modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setAfficherInscription(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}