import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ConfirmProvider } from "./context/ConfirmContext.jsx";
import "bootstrap/dist/css/bootstrap.min.css"; 
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles.css";
import { registerSW } from 'virtual:pwa-register';

// On enregistre le Service Worker immédiatement
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
);