import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import Loading from "../components/Loading.jsx";

/* Petite barre horizontale animée */
function Barre({ valeur, total, couleur = "" }) {
  const pourcent = total > 0 ? (valeur / total) * 100 : 0;
  const [largeur, setLargeur] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setLargeur(pourcent), 80);
    return () => clearTimeout(t);
  }, [pourcent]);
  return (
    <div className="stat-barre">
      <div className={`stat-barre-remplie ${couleur}`} style={{ width: `${largeur}%` }} />
    </div>
  );
}

/* Carte de statistique simple */
function CarteStat({ valeur, libelle, icone, teinte = "" }) {
  return (
    <div className={`stat-bloc ${teinte}`}>
      <div className="stat-bloc-icone">{icone}</div>
      <div>
        <div className="stat-bloc-valeur">{valeur}</div>
        <div className="stat-bloc-libelle">{libelle}</div>
      </div>
    </div>
  );
}

export default function Statistiques() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api("/admin/statistiques")
      .then((data) => { setStats(data); setChargement(false); })
      .catch((e) => { toast.erreur(e.message); setChargement(false); });
  }, []);

  if (chargement) return <Loading texte="Chargement des statistiques…" />;
  if (!stats) return <div className="carte">Impossible de charger les statistiques.</div>;

  const { utilisateurs, formations, inscriptions, modules, soumissions, attestations, parRole } = stats;

  const rolesData = [
    { nom: "Administrateur", valeur: parRole.find((r) => r.role === "administrateur")?.nombre || 0, couleur: "bleu" },
    { nom: "Formateur", valeur: parRole.find((r) => r.role === "formateur")?.nombre || 0, couleur: "violet" },
    { nom: "Apprenant", valeur: parRole.find((r) => r.role === "apprenant")?.nombre || 0, couleur: "rose" },
  ];
  const totalRoles = rolesData.reduce((a, r) => a + r.valeur, 0);

  return (
    <>
      <h1 style={{ marginBottom: 20 }}>Statistiques de la plateforme</h1>

      <section className="stats-section">
        {/* Cartes principales */}
        <div className="stats-cartes">
          <CarteStat valeur={utilisateurs.total} libelle="Utilisateurs" icone="👥" teinte="violet" />
          <CarteStat valeur={formations.total} libelle="Formations" icone="📚" teinte="bleu" />
          <CarteStat valeur={inscriptions.total} libelle="Inscriptions" icone="📝" teinte="rose" />
          <CarteStat valeur={modules.publies} libelle="Modules publiés" icone="📦" teinte="vert" />
          <CarteStat valeur={soumissions.a_corriger} libelle="Travaux à corriger" icone="✏️" teinte="orange" />
          <CarteStat valeur={attestations.total} libelle="Attestations" icone="🎓" teinte="violet" />
        </div>

        {/* Bloc : répartition par rôle */}
        <div className="stats-bloc-detail">
          <h3>Répartition des utilisateurs par rôle</h3>
          <div className="stats-barres">
            {rolesData.map((r) => (
              <div key={r.nom} className="stats-barre-ligne">
                <span className="stats-barre-libelle">{r.nom}</span>
                <Barre valeur={r.valeur} total={totalRoles} couleur={r.couleur} />
                <span className="stats-barre-valeur">{r.valeur}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bloc : formations par statut + inscriptions par statut */}
        <div className="stats-grille-2">
          <div className="stats-bloc-detail">
            <h3>Formations par statut</h3>
            <div className="stats-barres">
              <div className="stats-barre-ligne">
                <span className="stats-barre-libelle">Brouillons</span>
                <Barre valeur={formations.brouillons} total={formations.total} couleur="orange" />
                <span className="stats-barre-valeur">{formations.brouillons}</span>
              </div>
              <div className="stats-barre-ligne">
                <span className="stats-barre-libelle">Publiées</span>
                <Barre valeur={formations.publiees} total={formations.total} couleur="vert" />
                <span className="stats-barre-valeur">{formations.publiees}</span>
              </div>
              <div className="stats-barre-ligne">
                <span className="stats-barre-libelle">Archivées</span>
                <Barre valeur={formations.archivees} total={formations.total} couleur="gris" />
                <span className="stats-barre-valeur">{formations.archivees}</span>
              </div>
            </div>
          </div>

          <div className="stats-bloc-detail">
            <h3>Inscriptions par statut</h3>
            <div className="stats-barres">
              <div className="stats-barre-ligne">
                <span className="stats-barre-libelle">En attente</span>
                <Barre valeur={inscriptions.en_attente} total={inscriptions.total} couleur="orange" />
                <span className="stats-barre-valeur">{inscriptions.en_attente}</span>
              </div>
              <div className="stats-barre-ligne">
                <span className="stats-barre-libelle">Validées</span>
                <Barre valeur={inscriptions.validees} total={inscriptions.total} couleur="vert" />
                <span className="stats-barre-valeur">{inscriptions.validees}</span>
              </div>
              <div className="stats-barre-ligne">
                <span className="stats-barre-libelle">Refusées</span>
                <Barre valeur={inscriptions.refusees} total={inscriptions.total} couleur="rouge" />
                <span className="stats-barre-valeur">{inscriptions.refusees}</span>
              </div>
              <div className="stats-barre-ligne">
                <span className="stats-barre-libelle">Annulées</span>
                <Barre valeur={inscriptions.annulees} total={inscriptions.total} couleur="gris" />
                <span className="stats-barre-valeur">{inscriptions.annulees}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloc : modules + soumissions */}
        <div className="stats-grille-2">
          <div className="stats-bloc-detail">
            <h3>Modules</h3>
            <div className="stats-barres">
              <div className="stats-barre-ligne">
                <span className="stats-barre-libelle">Publiés</span>
                <Barre valeur={modules.publies} total={modules.total} couleur="vert" />
                <span className="stats-barre-valeur">{modules.publies}</span>
              </div>
              <div className="stats-barre-ligne">
                <span className="stats-barre-libelle">Brouillons</span>
                <Barre valeur={modules.brouillons} total={modules.total} couleur="orange" />
                <span className="stats-barre-valeur">{modules.brouillons}</span>
              </div>
            </div>
          </div>

          <div className="stats-bloc-detail">
            <h3>Soumissions</h3>
            <div className="stats-barres">
              <div className="stats-barre-ligne">
                <span className="stats-barre-libelle">Corrigées</span>
                <Barre valeur={soumissions.corrigees} total={soumissions.total} couleur="vert" />
                <span className="stats-barre-valeur">{soumissions.corrigees}</span>
              </div>
              <div className="stats-barre-ligne">
                <span className="stats-barre-libelle">À corriger</span>
                <Barre valeur={soumissions.a_corriger} total={soumissions.total} couleur="orange" />
                <span className="stats-barre-valeur">{soumissions.a_corriger}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
