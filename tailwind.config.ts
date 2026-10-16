import { type Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        marquee: "marquee 25s linear infinite",
        marquee2: "marquee2 25s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": {
            transform: "translateX(0%)",
          },
          "100%": {
            transform: "translateX(-100%)",
          },
        },
        marquee2: {
          "0%": {
            transform: "translateX(100%)",
          },
          "100%": {
            transform: "translateX(0%)",
          },
        },
      },
      borderRadius: {
        none: "0",
        DEFAULT: "0",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
        full: "9999px",
      },
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "sans-serif"],
        display: ['"Bricolage Grotesque Variable"', '"Inter Variable"', "sans-serif"],
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        line: "hsl(var(--line))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        navy: {
          50: "hsl(var(--navy-50))",
          100: "hsl(var(--navy-100))",
          200: "hsl(var(--navy-200))",
          400: "hsl(var(--navy-400))",
          600: "hsl(var(--navy-600))",
          700: "hsl(var(--navy-700))",
          800: "hsl(var(--navy-800))",
          900: "hsl(var(--navy-900))",
        },
        signal: "hsl(var(--signal))",
        destructive: "hsl(var(--destructive))",
      },
    },
  },
  plugins: [
    require("tailwindcss-radix")(),
    require("tailwindcss-animate"),
    require("@vidstack/react/tailwind.cjs")({
      prefix: "media",
    }),
    customVariants,
  ],
} satisfies Config;

function customVariants({
  addVariant,
  matchVariant,
}: {
  addVariant: any;
  matchVariant: any;
}) {
  // Strict version of `.group` to help with nesting.
  matchVariant("parent-data", (value: any) => `.parent[data-${value}] > &`);

  addVariant("hocus", ["&:hover", "&:focus-visible"]);
  addVariant("group-hocus", [".group:hover &", ".group:focus-visible &"]);
}
