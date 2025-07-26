import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Allow external access
    allowedHosts: ["04ccaa9f532a.ngrok-free.app"], // <- Add your ngrok domain here
  },
});
