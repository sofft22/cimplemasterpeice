/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Bodoni Moda"', 'Georgia', 'serif'],
        numbers: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        white: '#ffffff',
        black: '#0e0e0e',
        pink: { soft: '#fbeef1', blush: '#f7dfe4', line: '#f2e4e8' },
        rose: { DEFAULT: '#a63d5f', deep: '#7d2c47', pop: '#c9446f' },
        ink: '#2a2a2a',
        muted: '#8a7a7a',
        bone: '#f4ede2',
        linen: '#ece3d5',
        blood: { DEFAULT: '#8c2e3f', dark: '#6f2231' },
      },
      boxShadow: {
        soft: '0 10px 40px -15px rgba(166, 61, 95, 0.15)',
        pop: '0 20px 60px -20px rgba(166, 61, 95, 0.35)',
      },
    },
  },
  plugins: [],
};