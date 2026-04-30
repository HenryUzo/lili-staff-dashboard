import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f5faf5",
        foreground: "#143329",
        border: "#d7e5d9",
        input: "#eff6f0",
        ring: "#75a98e",
        primary: {
          DEFAULT: "#2d6b52",
          foreground: "#f5fff8",
          muted: "#d8eadc"
        },
        secondary: {
          DEFAULT: "#eff5ef",
          foreground: "#325646"
        },
        accent: {
          DEFAULT: "#dff0e3",
          foreground: "#17382d"
        },
        muted: {
          DEFAULT: "#edf3ee",
          foreground: "#557466"
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#143329"
        },
        destructive: {
          DEFAULT: "#c75146",
          foreground: "#fff8f7"
        },
        warning: {
          DEFAULT: "#c9901b",
          foreground: "#fffaf0"
        },
        success: {
          DEFAULT: "#2f7a54",
          foreground: "#f2fff5"
        }
      },
      boxShadow: {
        shell: "0 24px 80px rgba(23, 56, 45, 0.08)",
        soft: "0 10px 30px rgba(23, 56, 45, 0.08)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem"
      },
      fontFamily: {
        sans: ["Manrope", "Avenir Next", "Segoe UI", "sans-serif"],
        serif: ["Newsreader", "Georgia", "serif"]
      },
      backgroundImage: {
        "vet-grid":
          "radial-gradient(circle at top, rgba(223, 240, 227, 0.85), rgba(245, 250, 245, 0) 45%), linear-gradient(rgba(210, 228, 215, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(210, 228, 215, 0.18) 1px, transparent 1px)"
      },
      backgroundSize: {
        "vet-grid": "100% 100%, 28px 28px, 28px 28px"
      }
    }
  },
  plugins: []
};

export default config;
