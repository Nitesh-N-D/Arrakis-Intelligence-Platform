/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0a0a0a",
        obsidian: "#111111",
        ember: "#f97316",
        dune: "#f6c453",
        gold: "#f59e0b",
        sand: "#fef3c7",
        "surface-glass": "rgba(255,255,255,0.05)",
        "surface-panel": "rgba(255,255,255,0.03)",
        "border-subtle": "rgba(255,255,255,0.1)"
      },
      boxShadow: {
        glow: "0 0 20px rgba(255,165,0,0.4)",
        card: "0 10px 30px rgba(0,0,0,0.5)",
        dune: "0 24px 80px rgba(249,115,22,0.16)"
      },
      backdropBlur: {
        glass: "20px"
      },
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        card: "1rem",
        button: "0.875rem"
      },
      backgroundImage: {
        "dune-hero":
          "radial-gradient(circle at top left, rgba(249,115,22,0.22), transparent 28%), radial-gradient(circle at top right, rgba(245,158,11,0.18), transparent 22%), linear-gradient(180deg, #0a0a0a 0%, #111111 100%)"
      }
    }
  },
  plugins: []
};
