import Profil from "./pages/Profil.jsx";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Accueil from "./pages/Accueil.jsx";
import Statistiques from "./pages/Statistiques.jsx";
import Utilisateurs from "./pages/Utilisateurs.jsx";
import Formations from "./pages/Formations.jsx";
import Inscriptions from "./pages/Inscriptions.jsx";
import Contenu from "./pages/Contenu.jsx";
import Module from "./pages/Module.jsx";
import Corrections from "./pages/Corrections.jsx";
import Suivi from "./pages/Suivi.jsx";
import Catalogue from "./pages/Catalogue.jsx";
import MesInscriptions from "./pages/MesInscriptions.jsx";
import { MesFormations, ContenuFormation } from "./pages/MesFormations.jsx";
import Resultats from "./pages/Resultats.jsx";
import QcmEditor from "./pages/QcmEditor.jsx";
import QcmPasser from "./pages/QcmPasser.jsx";

const page = (roles, element) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Accueil />} />
        <Route path="/profil" element={<Profil />} />

        {/* Administrateur */}
        <Route path="/statistiques" element={page(["administrateur"], <Statistiques />)} />
        <Route path="/utilisateurs" element={page(["administrateur"], <Utilisateurs />)} />
        <Route path="/formations" element={page(["administrateur"], <Formations />)} />
        <Route path="/inscriptions" element={page(["administrateur"], <Inscriptions />)} />

        {/* Formateur */}
        <Route path="/contenu" element={page(["formateur"], <Contenu />)} />
        <Route path="/contenu/:id" element={page(["formateur"], <Module />)} />
        <Route path="/corrections" element={page(["formateur"], <Corrections />)} />
        <Route path="/suivi" element={page(["formateur"], <Suivi />)} />
        <Route path="/formateur/qcm/:id" element={<QcmEditor />} />

        {/* Apprenant */}
        <Route path="/catalogue" element={page(["apprenant"], <Catalogue />)} />
        <Route path="/mes-inscriptions" element={page(["apprenant"], <MesInscriptions />)} />
        <Route path="/mes-formations" element={page(["apprenant"], <MesFormations />)} />
        <Route path="/mes-formations/:id" element={page(["apprenant"], <ContenuFormation />)} />
        <Route path="/resultats" element={page(["apprenant"], <Resultats />)} />
        <Route path="/apprenant/qcm/:id" element={<QcmPasser />} />
      </Route>
    </Routes>
  );
}