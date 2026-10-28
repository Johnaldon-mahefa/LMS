import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "Inno-v T LMS",
        short_name: "LMS",
        description: "Plateforme de formation en ligne Inno-v T",
        theme_color: "#6366f1",
        background_color: "#f8fafc",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],
  server: { 
    host: true, // <-- OBLIGATOIRE : autorise l'accès depuis ton téléphone
    port: 5173, 
    proxy: { "/api": "http://localhost:3000" } 
  },
});