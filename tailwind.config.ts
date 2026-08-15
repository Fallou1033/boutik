import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — Boutik
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e", // Primary green (Mobile Money / success)
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        violet: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6", // Accent violet (premium)
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        // Semantic colors
        surface: {
          DEFAULT: "#ffffff",
          subtle:  "#f8fafc",
          muted:   "#f1f5f9",
          border:  "#e2e8f0",
        },
        text: {
          DEFAULT:  "#0f172a",
          muted:    "#64748b",
          subtle:   "#94a3b8",
          inverted: "#ffffff",
        },
        // Status colors (commande state machine)
        status: {
          pending:  { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
          paid:     { bg: "#dcfce7", text: "#166534", border: "#86efac" },
          shipped:  { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
          delivered:{ bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
          cancelled:{ bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
        },
      },

      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "Menlo", "monospace"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },

      borderRadius: {
        "4xl": "2rem",
      },

      boxShadow: {
        card:   "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        glow:   "0 0 20px rgb(34 197 94 / 0.3)",
        "glow-violet": "0 0 20px rgb(139 92 246 / 0.3)",
      },

      animation: {
        "fade-in":      "fadeIn 0.2s ease-out",
        "slide-up":     "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "scale-in":     "scaleIn 0.15s ease-out",
        "pulse-soft":   "pulseSoft 2s ease-in-out infinite",
        "shimmer":      "shimmer 1.5s linear infinite",
      },

      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%":   { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      backgroundImage: {
        "shimmer-gradient":
          "linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.6) 50%, transparent 100%)",
        "gradient-brand":
          "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
        "gradient-violet":
          "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
        "gradient-hero":
          "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1d4ed8 100%)",
      },

      screens: {
        "xs": "375px", // Mobile petit (iPhone SE)
      },
    },
  },
  plugins: [],
};

export default config;
