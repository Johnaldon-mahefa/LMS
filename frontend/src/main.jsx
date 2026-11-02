import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ConfirmProvider } from "./context/ConfirmContext.jsx";

import { LoadingProvider, useLoading } from "./context/LoadingContext.jsx"; // <-- NOUVEAU
import { setGlobalLoading } from "./api/client.js"; // <-- NOUVEAU
import GlobalSpinner from "./components/GlobalSpinner.jsx"; // <-- NOUVEAU

import "bootstrap/dist/css/bootstrap.min.css"; 
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles.css";
import { registerSW } from 'virtual:pwa-register';

// On enregistre le Service Worker immédiatement
registerSW({ immediate: true });


function LoadingConnector() {
  const { demarrer, arreter } = useLoading();
  setGlobalLoading({ start: demarrer, stop: arreter });
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ToastProvider>
      <ConfirmProvider>
        <LoadingProvider> {/* <-- ENVELOPPE */}
          <LoadingConnector /> {/* <-- CONNECTEUR */}
          <GlobalSpinner /> {/* <-- BARRE DE CHARGEMENT */}
          <AuthProvider>
            <App />
          </AuthProvider>
        </LoadingProvider>
      </ConfirmProvider>
    </ToastProvider>
  </BrowserRouter>
);