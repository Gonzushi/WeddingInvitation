import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Allow external access
    allowedHosts: ["38f573c4063f.ngrok-free.app"], // <- Add your ngrok domain here
  },
});
