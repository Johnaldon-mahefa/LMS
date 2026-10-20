import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

export default function QcmEditor() {
  const { id } = useParams(); // id_evaluation
  const toast = useToast();
  
  const [questions, setQuestions] = useState([]);
  const [nouvelleQuestion, setNouvelleQuestion] = useState({ enonce: "", typeQuestion: "choix_unique" });
  const [nouvelleProposition, setNouvelleProposition] = useState({ texte: "", estCorrecte: false });
  const [questionActive, setQuestionActive] = useState(null); // Pour savoir à quelle question on ajoute une proposition

  const charger = () => {
    api(`/formateur/evaluations/${id}/questions`)
      .then(setQuestions)
      .catch((e) => toast.erreur(e.message));
  };

  useEffect(() => { charger(); }, [id]);

  async function ajouterQuestion(e) {
    e.preventDefault();
    try {
      await api(`/formateur/evaluations/${id}/questions`, { method: "POST", body: nouvelleQuestion });
      toast.ok("Question ajoutée.");
      setNouvelleQuestion({ enonce: "", typeQuestion: "choix_unique" });
      charger();
    } catch (err) { toast.erreur(err.message); }
  }

  async function ajouterProposition(e, idQuestion) {
    e.preventDefault();
    try {
      await api(`/formateur/questions/${idQuestion}/propositions`, { method: "POST", body: nouvelleProposition });
      toast.ok("Proposition ajoutée.");
      setNouvelleProposition({ texte: "", estCorrecte: false });
      setQuestionActive(null);
      charger();
    } catch (err) { toast.erreur(err.message); }
  }

  return (
    <div className="carte large">
      <p><Link to="/contenu">← Retour aux modules</Link></p>
      <h1>Éditeur de QCM</h1>

      {/* Formulaire pour créer une question */}
      <section className="bloc">
        <h2>Ajouter une question</h2>
        <form className="ligne" onSubmit={ajouterQuestion}>
          <label style={{ flex: 1 }}>Énoncé de la question
            <input value={nouvelleQuestion.enonce} onChange={(e) => setNouvelleQuestion({ ...nouvelleQuestion, enonce: e.target.value })} required />
          </label>
          <label>Type
            <select value={nouvelleQuestion.typeQuestion} onChange={(e) => setNouvelleQuestion({ ...nouvelleQuestion, typeQuestion: e.target.value })}>
              <option value="choix_unique">Choix unique</option>
              <option value="vrai_faux">Vrai / Faux</option>
            </select>
          </label>
          <button type="submit">Créer la question</button>
        </form>
      </section>

      {/* Liste des questions existantes */}
      <section className="bloc">
        <h2>Questions ({questions.length})</h2>
        {questions.length === 0 && <p>Aucune question pour le moment.</p>}
        
        {questions.map((q, index) => (
          <div key={q.id_question} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10, borderRadius: 8 }}>
            <h3>Q{index + 1} : {q.enonce}</h3>
            
            <ul>
              {q.propositions?.map((p) => (
                <li key={p.id_proposition} style={{ color: p.est_correcte ? "green" : "inherit", fontWeight: p.est_correcte ? "bold" : "normal" }}>
                  {p.texte} {p.est_correcte && "✅ (Bonne réponse)"}
                </li>
              ))}
            </ul>

            {/* Formulaire pour ajouter une proposition à cette question */}
            {questionActive === q.id_question ? (
              <form className="ligne" onSubmit={(e) => ajouterProposition(e, q.id_question)} style={{ marginTop: 10, backgroundColor: "#f0f0f0", padding: 10 }}>
                <label style={{ flex: 1 }}>Texte de la proposition
                  <input value={nouvelleProposition.texte} onChange={(e) => setNouvelleProposition({ ...nouvelleProposition, texte: e.target.value })} required />
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <input type="checkbox" checked={nouvelleProposition.estCorrecte} onChange={(e) => setNouvelleProposition({ ...nouvelleProposition, estCorrecte: e.target.checked })} />
                  Est-ce la bonne réponse ?
                </label>
                <button type="submit">Ajouter</button>
                <button type="button" onClick={() => setQuestionActive(null)}>Annuler</button>
              </form>
            ) : (
              <button type="button" onClick={() => setQuestionActive(q.id_question)} style={{ marginTop: 10 }}>
                + Ajouter une proposition
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
