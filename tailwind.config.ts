import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        violet: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          900: '#2e1065',
        },
        rose: {
          300: '#fda4af',
          400: '#fb7185',
        },
        surface: {
          glass: 'rgba(255, 255, 255, 0.12)',
          card: 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        'playfair': ['"Playfair Display"', 'serif'],
        'dm-sans': ['"DM Sans"', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-violet': 'linear-gradient(to bottom, #1a0533, #2e1065, #1e0a3c)',
      },
      boxShadow: {
        'glow': '0 8px 32px rgba(139,92,246,0.3)',
        'glow-strong': '0 12px 40px rgba(139,92,246,0.4)',
      },
      animation: {
        'gradient-mesh': 'gradient-mesh 15s ease infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
      },
      keyframes: {
        'gradient-mesh': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
