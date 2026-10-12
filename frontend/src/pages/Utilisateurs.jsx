import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const ROLES = ["administrateur", "formateur", "apprenant"];
const VIDE = { nom: "", prenom: "", identifiant: "", motDePasse: "", roles: ["apprenant"] };

// Cas d'utilisation « Gérer les utilisateurs » : liste, création, désactivation.
export default function Utilisateurs() {
  const { utilisateur: moi } = useAuth();
  const [liste, setListe] = useState([]);
  const [form, setForm] = useState(VIDE);
  const [message, setMessage] = useState(null);

  const charger = () => api("/utilisateurs").then(setListe).catch((e) => setMessage({ erreur: e.message }));
  useEffect(() => { charger(); }, []);

  function basculerRole(role) {
    setForm((f) => ({ ...f, roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role] }));
  }
  async function creer(e) {
    e.preventDefault();
    try { await api("/utilisateurs", { method: "POST", body: form }); setForm(VIDE); setMessage({ ok: "Compte créé." }); charger(); }
    catch (err) { setMessage({ erreur: err.message }); }
  }
  async function desactiver(id) {
    try { await api(`/utilisateurs/${id}/desactiver`, { method: "PATCH" }); setMessage({ ok: "Compte désactivé." }); charger(); }
    catch (err) { setMessage({ erreur: err.message }); }
  }

  return (
    <div className="carte">
      <h1>Gérer les utilisateurs</h1>
      {message?.erreur && <p className="erreur">{message.erreur}</p>}
      {message?.ok && <p className="ok">{message.ok}</p>}

      <form onSubmit={creer} className="grille">
        <label>Nom<input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></label>
        <label>Prénom<input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required /></label>
        <label>Identifiant<input value={form.identifiant} onChange={(e) => setForm({ ...form, identifiant: e.target.value })} required /></label>
        <label>Mot de passe initial<input type="password" value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} required /></label>
        <fieldset><legend>Rôles</legend>
          {ROLES.map((r) => <label key={r}><input type="checkbox" checked={form.roles.includes(r)} onChange={() => basculerRole(r)} /> {r}</label>)}
        </fieldset>
        <button type="submit">Créer le compte</button>
      </form>

      <table>
        <thead><tr><th>Nom</th><th>Identifiant</th><th>Rôles</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {liste.map((u) => (
            <tr key={u.id_utilisateur}>
              <td>{u.prenom} {u.nom}</td><td>{u.identifiant}</td><td>{u.roles.join(", ")}</td><td>{u.statut_compte}</td>
              <td>{u.statut_compte === "actif" && u.id_utilisateur !== moi.id && <button onClick={() => desactiver(u.id_utilisateur)}>Désactiver</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
