import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
  ],
  theme: {
    screens: {
      sm: '481px',
      md: '769px',
      lg: '1025px',
      xl: '1280px',
    },
    extend: {
      colors: {
        pink: {
          blush: '#fff0f5',
          soft: '#ffd6e7',
          rose: '#f06292',
          hot: '#e91e8c',
          deep: '#c2185b',
        },
      },
      fontFamily: {
        heading: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
