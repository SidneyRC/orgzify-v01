import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand Primary ──
        primary: {
          DEFAULT: "#1e3a8a", // blue-900
          hover:   "#1e40af", // blue-800 (hover state)
          light:   "#dbeafe", // blue-100 (backgrounds, badges)
          muted:   "#bfdbfe", // blue-200 (borders, dividers)
        },

        // ── Brand Accent ──
        accent: {
          DEFAULT: "#facc15", // yellow-400
          hover:   "#eab308", // yellow-500
          light:   "#fef9c3", // yellow-100
        },

        // ── Semantic Colors ──
        success: {
          DEFAULT: "#16a34a", // green-600
          bg:      "#f0fdf4", // green-50
          border:  "#bbf7d0", // green-200
          text:    "#15803d", // green-700
        },
        error: {
          DEFAULT: "#dc2626", // red-600
          bg:      "#fef2f2", // red-50
          border:  "#fecaca", // red-200
          text:    "#b91c1c", // red-700
        },
        warning: {
          DEFAULT: "#d97706", // amber-600
          bg:      "#fffbeb", // amber-50
          border:  "#fde68a", // amber-200
          text:    "#92400e", // amber-800
        },
        info: {
          DEFAULT: "#0284c7", // sky-600
          bg:      "#f0f9ff", // sky-50
          border:  "#bae6fd", // sky-200
          text:    "#075985", // sky-800
        },

        // ── Neutral / UI ──
        surface: {
          DEFAULT: "#ffffff", // card background
          page:    "#f9fafb", // page background (gray-50)
          border:  "#f3f4f6", // gray-100
        },
      },

      borderRadius: {
        input: "0.75rem",  // 12px — inputs, buttons
        card:  "1rem",     // 16px — cards
        xl2:   "1.25rem",  // 20px — modal cards
      },

      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }], // 10px
      },

      boxShadow: {
        card:  "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        focus: "0 0 0 3px rgb(30 58 138 / 0.15)",
      },

      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
