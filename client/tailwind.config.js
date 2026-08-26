/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ledger: {
          bg: '#FBF8EF',
          paper: '#F6F1E5',
          card: '#FFFDF9',
          ink: '#0F2042',
          navy: '#1A2B4C',
          red: '#C83232',
          redMargin: '#D9383A',
          stampGreen: '#1E7E45',
          stampRed: '#B82525',
          stampAmber: '#C67D0A',
          stampPurple: '#6B38AC',
          pencil: '#5A6578'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['Courier Prime', 'Courier New', 'monospace'],
        handwritten: ['Caveat', 'Dancing Script', 'cursive']
      }
    },
  },
  plugins: [],
}
