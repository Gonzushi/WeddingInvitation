/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // Adjust based on your project structure
    "./public/index.html", // If you use plain HTML files
  ],
  theme: {
    extend: {
      colors: {
        terracotta: "#E2725B",
      },
      maxWidth: {
        mobile: "480px",
      },
    },
    container: {
      center: true,
      padding: "1rem",
    },
  },
  plugins: [],
};
