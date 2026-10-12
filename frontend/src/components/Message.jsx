export default function Message({ msg }) {
  if (!msg) return null;
  return msg.erreur ? <p className="erreur">{msg.erreur}</p> : <p className="ok">{msg.ok}</p>;
}
