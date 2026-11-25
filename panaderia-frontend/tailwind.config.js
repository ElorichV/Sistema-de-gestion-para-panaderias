/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#08060b',
          900: '#0e0b14',
          850: '#14101d',
          800: '#1b1526',
          700: '#271f36',
        },
        brioche: {
          300: '#fcd38d',
          400: '#f6ad55',
          500: '#ed8936',
          600: '#dd6b20',
        },
        arcane: {
          400: '#b794f4',
          500: '#9f7aea',
          600: '#805ad5',
        }
      }
    },
  },
  plugins: [],
}
