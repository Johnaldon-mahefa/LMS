// Spinner de chargement réutilisable.
export default function Loading({ texte = "Chargement…" }) {
  return (
    <div className="loading-block">
      <span className="loading-spinner" />
      <span>{texte}</span>
    </div>
  );
}