/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050505",
        ember: "#f97316",
        dune: "#f6c453",
        glass: "rgba(255,255,255,0.06)"
      },
      boxShadow: {
        dune: "0 24px 80px rgba(249,115,22,0.15)"
      },
      backgroundImage: {
        "storm-grid":
          "radial-gradient(circle at top, rgba(249,115,22,0.18), transparent 30%), linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0))"
      },
      fontFamily: {
        display: ["ui-serif", "Georgia", "serif"],
        body: ["ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
