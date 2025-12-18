import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#39E079',
        'background-light': '#f6f8f7',
        'background-dark': '#122017',
        'surface-dark': '#1a2c15',
        'surface-border': '#2c4724',
        'text-muted': '#9fc893',
      },
      fontFamily: {
        display: ['"Manrope"', 'sans-serif'],
        body: ['"Noto Sans"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
      boxShadow: {
        'banx-glow': '0 0 20px rgba(73, 230, 25, 0.2)',
        'banx-send': '0 0 10px rgba(73, 230, 25, 0.3)',
      },
    },
  },
}

export default config
