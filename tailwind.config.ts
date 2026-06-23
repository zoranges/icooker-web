import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Extended palette
        sage: {
          DEFAULT: "hsl(var(--color-sage))",
          bg: "hsl(var(--color-sage-bg))",
        },
        slateblue: {
          DEFAULT: "hsl(var(--color-slate-blue))",
          bg: "hsl(var(--color-slate-blue-bg))",
        },
        cyanteal: {
          DEFAULT: "hsl(var(--color-cyan))",
          bg: "hsl(var(--color-cyan-bg))",
        },
        indigo: {
          DEFAULT: "hsl(var(--color-indigo))",
          bg: "hsl(var(--color-indigo-bg))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },
      fontFamily: {
        display: ["'DM Sans'", "'Inter'", "system-ui", "-apple-system", "sans-serif"],
        sans: ["'DM Sans'", "'Inter'", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        'card': '0 1px 3px 0 hsl(215 25% 12% / 0.04), 0 1px 2px -1px hsl(215 25% 12% / 0.04)',
        'card-hover': '0 4px 12px -2px hsl(215 25% 12% / 0.08), 0 2px 4px -2px hsl(215 25% 12% / 0.04)',
        'modal': '0 20px 60px -12px hsl(215 25% 12% / 0.15)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
