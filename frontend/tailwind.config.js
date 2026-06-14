/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B2A2F",
        parchment: "#F6F1E4",
        parchment2: "#EFE7D6",
        brass: "#C99A4B",
        sage: "#7A9B7E",
        terracotta: "#C5694B",
        slateblue: "#5C7C99",
        cardline: "#D8CFBC"
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        mono: ["IBM Plex Mono", "monospace"],
        body: ["Inter", "sans-serif"]
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(27,42,47,0.04) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};
