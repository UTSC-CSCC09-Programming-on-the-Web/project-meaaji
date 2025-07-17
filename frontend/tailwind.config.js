/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Using a playful font suitable for children's apps
      fontFamily: {
        sans: [
          "Bubblegum Sans", // A fun, rounded font
          "Inter", // Fallback
          "system-ui",
          "Avenir",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      // Vibrant and child-friendly color palette
      colors: {
        // Primary color: a cheerful blue
        primary: {
          50: "#e0f2fe", // Lightest blue
          100: "#bae6fd",
          200: "#7dd3fc",
          300: "#38bdf8",
          400: "#0ea5e9",
          500: "#0284c7", // Main primary blue
          600: "#0369a1",
          700: "#075985",
          800: "#0c4a6e",
          900: "#082f49",
        },
        // Secondary color: a playful yellow/orange
        secondary: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b", // Main secondary yellow/orange
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        // Accent color: a lively green
        accent: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efad",
          400: "#4ade80",
          500: "#22c55e", // Main accent green
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        // Soft background/text colors for contrast, but still friendly
        neutral: {
          50: "#fdfdfd", // Almost white
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717", // Almost black
        },
      },
      // Enhanced animations for a more dynamic feel
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pop-in": "popIn 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)", // Bouncy pop-in
        "wiggle": "wiggle 1s ease-in-out infinite", // Continuous subtle wiggle
        "pulse-grow": "pulseGrow 1.5s infinite alternate", // Gentle pulse
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        popIn: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        pulseGrow: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.03)" },
        },
      },
    },
  },
  plugins: [],
};
