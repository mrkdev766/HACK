import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#0F172A",
          dark: "#020617",
          deep: "#090D16",
          light: "#1E293B",
          soft: "#334155",
        },
        cream: {
          DEFAULT: "#F8FAFC",
          light: "#FFFFFF",
          dark: "#F1F5F9",
          card: "#FFFFFF",
        },
        sage: {
          DEFAULT: "#E2E8F0",
          light: "#F8FAFC",
          dark: "#CBD5E1",
        },
        action: {
          DEFAULT: "#10B981",
          hover: "#059669",
          light: "#34D399",
          surface: "rgba(16, 185, 129, 0.12)",
        },
        reward: {
          gold: "#F59E0B",
          goldLight: "#FCD34D",
          goldDark: "#D97706",
        },
        ink: {
          DEFAULT: "#0F172A",
          light: "#334155",
        },
        muted: {
          DEFAULT: "#64748B",
          light: "#94A3B8",
          dark: "#475569",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "sans-serif"],
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        editorial: ["var(--font-serif)", "Playfair Display", "serif"],
      },
      borderRadius: {
        card: "18px",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 8px 30px rgba(20, 61, 48, 0.08)",
        floating: "0 14px 40px rgba(20, 61, 48, 0.18)",
        gold: "0 4px 20px rgba(232, 184, 90, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
