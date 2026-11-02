import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { setToken } from "../api/client.js";
import { Turnstile } from "@marsidev/react-turnstile";

export default function Login() {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [choixEcoles, setChoixEcoles] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);

  const { connecter, connecterEcole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
    
    if (!captchaToken) {
      setErreur("Veuillez valider le CAPTCHA avant de continuer.");
      return;
    }

    setChargement(true);
    try {
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
      
      {/* ICÔNE MODE SOMBRE (Sans fond) */}
      <div className="position-absolute top-0 end-0 p-4">
        <button 
          type="button" 
          className="topbar-icon-btn" 
          onClick={() => setIsDark(!isDark)}
        >
          <i className={`bi ${isDark ? 'bi-sun-fill text-warning' : 'bi-moon-fill'}`}></i>
        </button>
      </div>

      <div className="connexion-boite shadow-sm">
        <div className="text-center mb-4">
          <div className="logo-login mb-3" style={{ background: isDark ? '#334155' : '#e0e7ff' }}>
            <i className="bi bi-mortarboard-fill text-primary"></i>
          </div>
          <h2 className="fw-bold mb-1">Bienvenue</h2>
          <p className="text-muted small">Connectez-vous à votre espace.</p>
        </div>

        {erreur && <div className="alert alert-danger py-2 text-center small rounded-3">{erreur}</div>}

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
              <label className="form-label text-muted small fw-bold">Adresse email</label>
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
              <label className="form-label text-muted small fw-bold">Mot de passe</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••"
                value={motDePasse} 
                onChange={(e) => setMotDePasse(e.target.value)} 
                required 
              />
            </div>

            <div className="mb-4 d-flex justify-content-center">
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                onSuccess={(token) => setCaptchaToken(token)}
                onError={() => setErreur("Erreur de chargement du CAPTCHA.")}
                onExpire={() => setCaptchaToken(null)}
                options={{ theme: isDark ? "dark" : "light" }}
              />
            </div>

            {/* BOUTON SE CONNECTER (Gris foncé, pas bleu) */}
            <button type="submit" className="btn btn-dark w-100 py-3 fw-bold mb-4" disabled={chargement || !captchaToken} style={{ borderRadius: 12 }}>
              {chargement ? "Connexion en cours..." : "Se connecter"}
            </button>

            <div className="separateur-ou">OU CONTINUER AVEC</div>

            <div className="d-flex gap-3 mb-4">
              <button type="button" className="btn-social google" onClick={() => loginOAuth('google')}>
                <i className="bi bi-google"></i> Google
              </button>
              <button type="button" className="btn-social facebook" onClick={() => loginOAuth('facebook')}>
                <i className="bi bi-facebook"></i> Facebook
              </button>
            </div>

            <div className="text-center pt-4 border-top">
              <p className="mb-2 text-muted small">Vous n'avez pas encore d'espace ?</p>
              {/* BOUTON CRÉER UN ESPACE (Transparent/Ghost) */}
              <Link to="/creer-espace" className="btn btn-outline-primary w-100 fw-bold" style={{ borderRadius: 12 }}>
                Créer un espace
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}