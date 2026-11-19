import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Allows public tunnels (ngrok / cloudflared) used for Meta app review URLs.
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      // Proxy only the backend OAuth endpoints. A blanket "/auth" proxy would
      // swallow the frontend pages /auth/verify and /auth/recovery.
      "/auth/google": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/auth/callback": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/auth/instagram": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/auth/ig-callback": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/logout": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
