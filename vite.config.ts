import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Allow external access
    allowedHosts: ["1a5c1067baed.ngrok-free.app"], // <- Add your ngrok domain here
  },
});
