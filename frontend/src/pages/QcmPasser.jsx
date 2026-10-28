import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

export default function QcmPasser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [chargement, setChargement] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [idTentative, setIdTentative] = useState(null);
  const [reponses, setReponses] = useState({});
  
  const [tempsRestant, setTempsRestant] = useState(null); 
  const [statut, setStatut] = useState("en_cours");
  const [resultat, setResultat] = useState(null);
  
  const timerRef = useRef(null);
  const initRef = useRef(false);

  // CHARGEMENT DU QCM
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    api(`/apprenant/evaluations/${id}/qcm`)
      .then((data) => {
        setIdTentative(data.idTentative);
        setQuestions(data.questions);
        
        if (data.dureeMinutes && data.dureeMinutes > 0) {
          setTempsRestant(data.dureeMinutes * 60);
        }
        setChargement(false);
        
        if (data.reprise) {
          toast.ok("Reprise de votre tentative en cours...");
        }
      })
      .catch((e) => {
        toast.erreur(e.message);
        navigate("/mes-formations");
      });
  }, [id, navigate, toast]);

  // CHRONOMÈTRE
  useEffect(() => {
    if (tempsRestant !== null && tempsRestant > 0 && statut === "en_cours") {
      timerRef.current = setInterval(() => {
        setTempsRestant((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            soumettre(true); // Soumission auto
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [tempsRestant, statut]);

  // FONCTION DE SOUMISSION
  async function soumettre(estAuto = false) {
    if (statut === "termine") return;
    
    // SÉCURITÉ : On vérifie que l'ID de tentative est valide pour éviter le NaN
    if (!idTentative || isNaN(idTentative)) {
      toast.erreur("Erreur : Impossible de trouver l'identifiant de la tentative.");
      return;
    }

    setStatut("termine");
    if (timerRef.current) clearInterval(timerRef.current);

    // Formatage des réponses (Ta logique d'origine)
    const reponsesFormattees = Object.entries(reponses).map(([idQuestion, idProposition]) => ({
      id_question: Number(idQuestion),
      id_proposition: Number(idProposition)
    }));

    try {
      const res = await api(`/apprenant/evaluations/${id}/qcm`, {
        method: "POST",
        body: { idTentative, reponses: reponsesFormattees }
      });
      setResultat(res);
      toast.ok(estAuto ? "Temps écoulé ! QCM soumis automatiquement." : "QCM soumis avec succès !");
    } catch (e) {
      toast.erreur(e.message);
      if (e.message.includes("temps")) {
        setResultat({ score: 0, scoreMax: 20, message: "Temps écoulé." }); 
      } else {
         setStatut("en_cours"); // On laisse réessayer en cas d'erreur réseau
      }
    }
  }

  function cocherReponse(idQuestion, idProposition) {
    setReponses({ ...reponses, [idQuestion]: idProposition });
  }

  const formatTemps = (secondes) => {
    if (secondes === null) return "Pas de limite";
    const m = Math.floor(secondes / 60);
    const s = secondes % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (chargement) return <div className="p-5 text-center text-muted">Chargement du QCM...</div>;

  // AFFICHAGE DU RÉSULTAT
  if (statut === "termine" && resultat) {
    return (
      <div className="container py-5" style={{ maxWidth: '600px' }}>
        <div className="card border-0 shadow-sm text-center p-5">
          <i className="bi bi-trophy-fill text-warning" style={{ fontSize: '4rem' }}></i>
          <h2 className="fw-bold mt-3 mb-2">QCM Terminé !</h2>
          <h1 className="display-3 fw-bold text-primary mb-3">{resultat.score} / {resultat.scoreMax}</h1>
          <p className="text-muted fs-5">Bonnes réponses : {resultat.bonnesReponses} sur {resultat.total}</p>
          
          <div className="alert alert-info border-0 mt-4">
            {resultat.statut === "expiree" ? (
              <><i className="bi bi-clock-history me-2"></i> Le temps est écoulé.</>
            ) : (
              <><i className="bi bi-check-circle me-2"></i> QCM terminé avec succès.</>
            )}
          </div>
          
          <button className="btn btn-primary mt-4 px-4" onClick={() => navigate("/mes-formations")}>
            Retour à mes formations
          </button>
        </div>
      </div>
    );
  }

  // AFFICHAGE DU QCM EN COURS
  return (
    <div className="container py-4" style={{ maxWidth: '900px' }}>
      
      {/* EN-TÊTE FIXE (Titre + Chrono) */}
      <div className="d-flex justify-content-between align-items-center mb-4 sticky-top bg-body pt-2 pb-3" style={{ zIndex: 100 }}>
        <div>
          <h2 className="h3 fw-bold mb-0">QCM en cours</h2>
          <p className="text-muted small mb-0">{questions.length} questions</p>
        </div>
        
        {tempsRestant !== null ? (
          <div className={`badge fs-5 px-4 py-2 shadow-sm ${tempsRestant < 60 ? 'bg-danger' : 'bg-primary'}`}>
            <i className="bi bi-clock me-2"></i> {formatTemps(tempsRestant)}
          </div>
        ) : (
          <div className="badge bg-secondary fs-6 px-3 py-2">
            <i className="bi bi-infinity me-1"></i> Pas de limite
          </div>
        )}
      </div>

      {/* LISTE DES QUESTIONS */}
      <div className="d-flex flex-column gap-4">
        {questions.map((q, index) => (
          <div key={q.id_question} className="card border-0 shadow-sm">
            <div className="card-body p-4">
              
              <h5 className="fw-bold mb-4 text-dark" style={{ lineHeight: 1.5 }}>
                <span className="text-primary me-2">Q{index + 1}.</span> {q.enonce}
              </h5>

              <div className="d-flex flex-column gap-3">
                {q.propositions.map((p) => {
                  const estSelectionne = reponses[q.id_question] === p.id_proposition;
                  return (
                    <label 
                      key={p.id_proposition} 
                      className={`qcm-option d-flex align-items-center gap-3 p-3 rounded-3 border ${
                        estSelectionne ? 'border-primary bg-primary bg-opacity-10' : 'border-light bg-light'
                      }`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      <input 
                        type="radio" 
                        name={`question_${q.id_question}`} 
                        className="form-check-input mt-0 fs-5" 
                        checked={estSelectionne}
                        onChange={() => cocherReponse(q.id_question, p.id_proposition)}
                      />
                      <span className={`fs-6 ${estSelectionne ? 'fw-bold text-primary' : 'text-dark'}`}>
                        {p.texte}
                      </span>
                    </label>
                  );
                })}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* BOUTON DE SOUMISSION */}
      <div className="text-center mt-5 mb-5">
        <button 
          type="button" 
          className="btn btn-success px-5 py-3 rounded-pill fw-bold shadow-sm" 
          onClick={() => soumettre(false)}
        >
          <i className="bi bi-check2-circle me-2"></i> Soumettre mes réponses
        </button>
      </div>

    </div>
  );
}