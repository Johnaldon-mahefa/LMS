import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Pendant le développement, les appels /api sont redirigés vers le serveur Express (pas de problème CORS).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://localhost:3000" } },
});
