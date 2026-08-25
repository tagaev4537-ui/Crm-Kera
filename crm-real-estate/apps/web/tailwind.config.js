/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F7F7F9",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#17181C",
          soft: "#5B5D68",
          faint: "#9A9CA8",
        },
        accent: {
          DEFAULT: "#E3A335",
          soft: "#FBEACB",
          dark: "#C4841F",
        },
        line: "#E9E9EE",
        success: "#2F8F5B",
        danger: "#D65C5C",
        warning: "#E3A335",
        navy: "#1B2333",
      },
      fontFamily: {
        display: ["Manrope", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(23, 24, 28, 0.05), 0 1px 10px rgba(23, 24, 28, 0.04)",
      },
      borderRadius: {
        xl: "14px",
      },
    },
  },
  plugins: [],
};
