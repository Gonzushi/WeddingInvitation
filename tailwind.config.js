/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // Adjust based on your project structure
    "./public/index.html", // If you use plain HTML files
  ],
  safelist: [
    "col-span-1",
    "col-span-2",
    "col-span-3",
    "col-span-4",
    "col-span-5",
    "col-span-6",
    "col-span-7",
    "col-span-8",
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
