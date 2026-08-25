/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F5F6FA",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#141B36",
          soft: "#4C5578",
          faint: "#8891B3",
        },
        accent: {
          DEFAULT: "#C98A3E",
          soft: "#F1DFC0",
          dark: "#A66F2E",
        },
        line: "#E5E7F1",
        success: "#2F8F5B",
        danger: "#C94C4C",
        warning: "#D98E2B",
      },
      fontFamily: {
        display: ["Manrope", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 27, 54, 0.06), 0 1px 12px rgba(20, 27, 54, 0.04)",
      },
      borderRadius: {
        xl: "14px",
      },
    },
  },
  plugins: [],
};
