/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bakery: {
          50: '#fdf8f4',
          100: '#faeee3',
          200: '#f3d9c2',
          300: '#eabf9b',
          400: '#df9c6e',
          500: '#d77e49',
          600: '#ca6438',
          700: '#a74e2f',
          800: '#86402d',
          900: '#6d3627',
          950: '#3a1b13',
        }
      }
    },
  },
  plugins: [],
}
