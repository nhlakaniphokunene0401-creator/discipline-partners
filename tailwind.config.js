/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./standalone.html"
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          650: "#293548",
          750: "#1e293b",
          850: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
