import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5D5FEF',
          50: '#E8E9FE',
          100: '#D1D3FD',
          200: '#A3A7FB',
          300: '#757BF9',
          400: '#474FF7',
          500: '#5D5FEF',
          600: '#4A4CBF',
          700: '#37398F',
          800: '#252660',
          900: '#121330',
        },
        success: {
          DEFAULT: '#00D27A',
          light: '#E6F9F0',
          dark: '#00A862',
        },
        danger: {
          DEFAULT: '#FF5C5C',
          light: '#FFE6E6',
          dark: '#CC4A4A',
        },
        warning: {
          DEFAULT: '#FFA500',
          light: '#FFF3E0',
          dark: '#CC8400',
        },
        info: {
          DEFAULT: '#00B8D9',
          light: '#E0F7FA',
          dark: '#0093AE',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      borderRadius: {
        'card': '24px',
        'button': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
