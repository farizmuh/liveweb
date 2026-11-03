/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mlbb: {
          dark: "#0b0f19",
          card: "#121826",
          accent: "#ffd700",
          gold: "#f59e0b",
          goldLight: "#fef08a",
          blue: "#1d4ed8",
          blueGlow: "#3b82f6",
          red: "#b91c1c",
          redGlow: "#ef4444",
        },
      },
      fontFamily: {
        rajdhani: ["Rajdhani", "sans-serif"],
        display: ["Teko", "Impact", "sans-serif"],
      },
      boxShadow: {
        "gold-glow": "0 0 20px rgba(245, 158, 11, 0.45)",
        "blue-glow": "0 0 25px rgba(59, 130, 246, 0.6)",
        "red-glow": "0 0 25px rgba(239, 68, 68, 0.6)",
      },
    },
  },
  plugins: [],
};

