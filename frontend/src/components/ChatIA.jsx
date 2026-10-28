import { useState, useRef, useEffect } from "react";
import { api } from "../api/client.js";
import ReactMarkdown from "react-markdown";

export default function ChatIA({ estOuvert, setEstOuvert }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider ?" }
  ]);
  const [question, setQuestion] = useState("");
  const [chargement, setChargement] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const envoyer = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const nouvelleQuestion = { role: "user", content: question };
    setMessages(prev => [...prev, nouvelleQuestion]);
    setQuestion("");
    setChargement(true);

    try {
      const historique = messages.slice(1); 
      const res = await api("/ia/chat", {
        method: "POST",
        body: { question: nouvelleQuestion.content, historique: historique }
      });
      setMessages(prev => [...prev, { role: "assistant", content: res }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue." }]);
    } finally {
      setChargement(false);
    }
  };

  if (!estOuvert) return null;

  return (
    <div 
      className="card shadow-lg border-0 position-fixed d-flex flex-column chat-widget"
      style={{ top: '80px', right: '20px', width: '380px', height: '550px', zIndex: 1050, borderRadius: '20px' }}
    >
      {/* EN-TÊTE */}
      <div className="chat-header d-flex justify-content-between align-items-center p-3">
        <div className="d-flex align-items-center gap-2">
          <div className="chat-avatar-ai"><i className="bi bi-robot text-primary"></i></div>
          <div>
            <span className="fw-bold d-block">Assistant IA</span>
            <small className="opacity-75" style={{ fontSize: '11px' }}>En ligne</small>
          </div>
        </div>
        <button className="btn-close" onClick={() => setEstOuvert(false)}></button>
      </div>
      
      {/* MESSAGES */}
      <div className="chat-body flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`d-flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            
            <div className={`chat-avatar ${msg.role === 'user' ? 'chat-avatar-user' : 'chat-avatar-ai'}`}>
              <i className={`bi ${msg.role === 'user' ? 'bi-person' : 'bi-robot'}`}></i>
            </div>

            <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
              {msg.role === 'assistant' ? (
                <div className="chat-markdown">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {chargement && (
          <div className="d-flex gap-2">
            <div className="chat-avatar chat-avatar-ai"><i className="bi bi-robot"></i></div>
            <div className="chat-bubble chat-bubble-ai">
              <div className="spinner-grow spinner-grow-sm text-primary" role="status"></div>
              <span className="ms-2 small text-muted">L'assistant réfléchit...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={envoyer} className="chat-footer p-3 border-top">
        <div className="input-group">
          <input 
            type="text" 
            className="form-control chat-input" 
            placeholder="Posez votre question..." 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)} 
            disabled={chargement}
          />
          <button className="btn btn-primary px-3" type="submit" disabled={chargement || !question.trim()}>
            <i className="bi bi-send-fill"></i>
          </button>
        </div>
      </form>
    </div>
  );
}