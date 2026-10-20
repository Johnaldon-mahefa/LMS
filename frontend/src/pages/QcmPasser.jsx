import { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
  
  const [tempsRestant, setTempsRestant] = useState(null); // null = pas de chrono
  const [statut, setStatut] = useState("en_cours");
  const [resultat, setResultat] = useState(null);
  
  const timerRef = useRef(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    api(`/apprenant/evaluations/${id}/qcm`)
      .then((data) => {
        setIdTentative(data.idTentative);
        setQuestions(data.questions);
        
        // Si une durée est définie, on lance le chrono
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
  }, [id, navigate]);

  useEffect(() => {
    if (tempsRestant !== null && tempsRestant > 0 && statut === "en_cours") {
      timerRef.current = setInterval(() => {
        setTempsRestant((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            soumettre(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [tempsRestant, statut]);

  async function soumettre(estAuto = false) {
    if (statut === "termine") return;
    setStatut("termine");
    if (timerRef.current) clearInterval(timerRef.current);

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
      toast.ok("QCM soumis avec succès !");
    } catch (e) {
      toast.erreur(e.message);
      if (e.message.includes("temps")) {
        setResultat({ score: 0, scoreMax: 20, message: "Temps écoulé." }); 
      } else {
         setStatut("en_cours"); // En cas d'erreur réseau, on laisse réessayer
      }
    }
  }

  function cocherReponse(idQuestion, idProposition) {
    setReponses({ ...reponses, [idQuestion]: idProposition });
  }

  if (chargement) return <div className="carte large">Chargement du QCM...</div>;

  if (statut === "termine" && resultat) {
    return (
      <div className="carte large" style={{ textAlign: "center", padding: 40 }}>
        <h1>Résultat du QCM</h1>
        <h2 style={{ fontSize: 48, color: "#7c3aed", margin: "20px 0" }}>
          {resultat.score} / {resultat.scoreMax}
        </h2>
        <p>Bonnes réponses : {resultat.bonnesReponses} sur {resultat.total}</p>
        <p style={{ marginTop: 20, fontWeight: "bold" }}>
          {resultat.statut === "expiree" ? "⏰ Temps écoulé" : "✅ QCM terminé"}
        </p>
        <button type="button" style={{ marginTop: 30 }} onClick={() => navigate("/mes-formations")}>
          Retour à mes formations
        </button>
      </div>
    );
  }

  return (
    <div className="carte large">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>QCM en cours</h1>
        
        {/* Affichage conditionnel du chrono */}
        {tempsRestant !== null ? (
          <div style={{ fontSize: 24, fontWeight: "bold", color: tempsRestant < 60 ? "red" : "#7c3aed" }}>
            ⏱️ {Math.floor(tempsRestant / 60)}:{(tempsRestant % 60).toString().padStart(2, "0")}
          </div>
        ) : (
          <div style={{ fontSize: 18, color: "#6b6485" }}>Pas de limite de temps</div>
        )}
      </div>

      <div className="bloc">
        {questions.map((q, index) => (
          <div key={q.id_question} style={{ marginBottom: 30, padding: 15, backgroundColor: "#f9f9f9", borderRadius: 8 }}>
            <h3>Q{index + 1} : {q.enonce}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 15 }}>
              {q.propositions.map((p) => (
                <label key={p.id_proposition} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input 
                    type="radio" 
                    name={`question_${q.id_question}`} 
                    value={p.id_proposition}
                    checked={reponses[q.id_question] === p.id_proposition}
                    onChange={() => cocherReponse(q.id_question, p.id_proposition)}
                  />
                  {p.texte}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button 
        type="button" 
        onClick={() => soumettre(false)} 
        style={{ padding: "12px 24px", fontSize: 18, backgroundColor: "#10b981", color: "white", borderRadius: 8, border: "none", cursor: "pointer" }}
      >
        Soumettre mes réponses
      </button>
    </div>
  );
}