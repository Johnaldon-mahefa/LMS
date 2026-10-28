import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { setToken } from "../api/client.js";
import { Turnstile } from "@marsidev/react-turnstile"; // <-- IMPORT DU WIDGET

export default function Login() {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [choixEcoles, setChoixEcoles] = useState(null);
  
  // ÉTAT POUR LE CAPTCHA
  const [captchaToken, setCaptchaToken] = useState(null);

  const { connecter, connecterEcole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // MODE SOMBRE
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // GESTION DU RETOUR OAUTH
  useEffect(() => {
    const oauthError = searchParams.get("oauth_error");
    const oauthToken = searchParams.get("oauth_token");
    const oauthChoix = searchParams.get("oauth_choix_ecole");
    const oauthIdUtilisateur = searchParams.get("oauth_idUtilisateur");
    const oauthEcoles = searchParams.get("oauth_ecoles");

    if (oauthError) {
      setErreur(oauthError);
      window.history.replaceState({}, "", "/connexion");
      return;
    }

    if (oauthToken) {
      setToken(oauthToken);
      window.location.href = "/"; 
      return;
    }

    if (oauthChoix === "1" && oauthIdUtilisateur && oauthEcoles) {
      try {
        const ecoles = JSON.parse(decodeURIComponent(oauthEcoles));
        setChoixEcoles({ ecoles, idUtilisateur: oauthIdUtilisateur });
      } catch (e) {
        setErreur("Erreur de lecture des écoles.");
      }
      window.history.replaceState({}, "", "/connexion");
    }
  }, [searchParams]);

  async function submit(e) {
    e.preventDefault();
    setErreur("");
    
    // On vérifie que le CAPTCHA est validé
    if (!captchaToken) {
      setErreur("Veuillez valider le CAPTCHA avant de continuer.");
      return;
    }

    setChargement(true);
    try {
      // On passe le captchaToken à la fonction connecter
      const res = await connecter(identifiant, motDePasse, captchaToken);
      if (res.choix_ecole_requis) {
        setChoixEcoles(res);
      } else {
        navigate("/");
      }
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  async function choisirEcole(idEtablissement) {
    setChargement(true);
    try {
      await connecterEcole(choixEcoles.idUtilisateur, idEtablissement);
      navigate("/");
    } catch (err) {
      setErreur(err.message);
      setChargement(false);
    }
  }

  const loginOAuth = (provider) => {
    window.location.href = `http://localhost:3000/api/auth/${provider}`;
  };

  return (
    <div className="connexion-page position-relative">
      
      {/* BOUTON MODE SOMBRE */}
      <div className="position-absolute top-0 end-0 p-4">
        <button 
          type="button" 
          className="topbar-icon-btn" 
          onClick={() => setIsDark(!isDark)}
        >
          <i className={`bi ${isDark ? 'bi-sun-fill text-warning' : 'bi-moon-fill'}`}></i>
        </button>
      </div>

      <div className="connexion-boite">
        <div className="text-center mb-4">
          <div style={{ width: 56, height: 56, background: isDark ? '#334155' : '#e0e7ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <i className="bi bi-mortarboard-fill" style={{ fontSize: 28, color: '#6366f1' }}></i>
          </div>
          <h2 className="fw-bold" style={{ fontSize: 24, letterSpacing: '-0.5px' }}>Bienvenue</h2>
          <p className="text-muted" style={{ fontSize: 14 }}>Connectez-vous à votre espace.</p>
        </div>

        {erreur && <div className="alert alert-danger py-2 text-center" style={{ fontSize: 13, borderRadius: 10 }}>{erreur}</div>}

        {choixEcoles ? (
          <div>
            <h5 className="text-center mb-4 fw-bold">Choisissez votre espace</h5>
            <div className="d-flex flex-column gap-3">
              {choixEcoles.ecoles.map((e) => (
                <button 
                  key={e.id} 
                  className="btn btn-outline-primary py-3 text-start px-4" 
                  onClick={() => choisirEcole(e.id)}
                  disabled={chargement}
                  style={{ borderRadius: 12, fontWeight: 600 }}
                >
                  <i className="bi bi-building me-3"></i> {e.nom}
                </button>
              ))}
            </div>
            <button className="btn btn-link w-100 mt-3 text-muted text-decoration-none" onClick={() => setChoixEcoles(null)}>
              ← Retour
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label text-muted" style={{ fontSize: 13, fontWeight: 600 }}>Adresse email</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="ex: admin@innov-t.mg"
                value={identifiant} 
                onChange={(e) => setIdentifiant(e.target.value)} 
                required 
              />
            </div>
            <div className="mb-4">
              <label className="form-label text-muted" style={{ fontSize: 13, fontWeight: 600 }}>Mot de passe</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••"
                value={motDePasse} 
                onChange={(e) => setMotDePasse(e.target.value)} 
                required 
              />
            </div>

            {/* WIDGET CLOUDFLARE TURNSTILE */}
            <div className="mb-4 d-flex justify-content-center">
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setCaptchaToken(token)}
                onError={() => setErreur("Erreur de chargement du CAPTCHA.")}
                onExpire={() => setCaptchaToken(null)}
                options={{ theme: isDark ? "dark" : "light" }}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={chargement || !captchaToken}>
              {chargement ? "Connexion en cours..." : "Se connecter"}
            </button>

            <div className="separateur-ou">OU CONTINUER AVEC</div>

            <div className="d-flex gap-3 mb-4">
              <button type="button" className="btn-social google w-50" onClick={() => loginOAuth('google')}>
                <i className="bi bi-google"></i> Google
              </button>
              <button type="button" className="btn-social facebook w-50" onClick={() => loginOAuth('facebook')}>
                <i className="bi bi-facebook"></i> Facebook
              </button>
            </div>

            <div className="text-center pt-4 border-top">
              <p className="mb-2 text-muted" style={{ fontSize: 13 }}>Vous n'avez pas encore d'espace ?</p>
              <Link to="/creer-espace" className="btn btn-outline-primary w-100" style={{ borderRadius: 12 }}>
                Créer un espace
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}