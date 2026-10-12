// Client HTTP unique : ajoute le jeton JWT, gère l'envoi de fichiers et le téléchargement contrôlé.
const TOKEN_KEY = "lms_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));
const entetes = (json) => ({ ...(json && { "Content-Type": "application/json" }), ...(getToken() && { Authorization: `Bearer ${getToken()}` }) });

// body : objet JSON ; form : FormData (envoi de fichier)
export async function api(chemin, { method = "GET", body, form } = {}) {
  const reponse = await fetch(`/api${chemin}`, { method, headers: entetes(!!body), body: form || (body ? JSON.stringify(body) : undefined) });
  if (reponse.status === 204) return null;
  const donnees = await reponse.json().catch(() => ({}));
  if (!reponse.ok) throw new Error(donnees.message || "Erreur de communication avec le serveur.");
  return donnees;
}

// Télécharge un fichier protégé (le jeton est envoyé dans l'en-tête, un simple lien ne suffirait pas).
export async function telecharger(chemin, nomParDefaut = "fichier") {
  const reponse = await fetch(`/api${chemin}`, { headers: entetes(false) });
  if (!reponse.ok) throw new Error((await reponse.json().catch(() => ({}))).message || "Téléchargement impossible.");
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(await reponse.blob());
  lien.download = nomParDefaut;
  lien.click();
  URL.revokeObjectURL(lien.href);
}
