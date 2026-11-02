import { useLoading } from "../context/LoadingContext.jsx"; // Attention, on ne peut pas utiliser un hook hors composant.
// Solution : On expose des fonctions globales.
export let globalStartLoading = () => {};
export let globalStopLoading = () => {};

export function setGlobalLoading(fns) {
  globalStartLoading = fns.start;
  globalStopLoading = fns.stop;
}

const TOKEN_KEY = "lms_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

const entetes = (json) => ({ ...(json && { "Content-Type": "application/json" }), ...(getToken() && { Authorization: `Bearer ${getToken()}` }) });

export async function api(chemin, { method = "GET", body, form } = {}) {
  globalStartLoading(); // <-- On lance la barre
  try {
    const reponse = await fetch(`/api${chemin}`, { method, headers: entetes(!!body), body: form || (body ? JSON.stringify(body) : undefined) });
    if (reponse.status === 204) return null;
    const donnees = await reponse.json().catch(() => ({}));
    if (!reponse.ok) throw new Error(donnees.message || "Erreur de communication avec le serveur.");
    return donnees;
  } finally {
    globalStopLoading(); // <-- On arrête la barre
  }
}

export async function telecharger(chemin, nomParDefaut = "fichier") {
  globalStartLoading();
  try {
    const reponse = await fetch(`/api${chemin}`, { headers: entetes(false) });
    if (!reponse.ok) throw new Error((await reponse.json().catch(() => ({}))).message || "Téléchargement impossible.");
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(await reponse.blob());
    lien.download = nomParDefaut;
    lien.click();
    URL.revokeObjectURL(lien.href);
  } finally {
    globalStopLoading();
  }
}