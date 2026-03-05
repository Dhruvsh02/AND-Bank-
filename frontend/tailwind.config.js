/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // AND Bank Brand Colors
        navy: {
          50:  '#e8edf5',
          100: '#c5d0e4',
          200: '#9fb0d0',
          300: '#7890bc',
          400: '#5a78ad',
          500: '#3b609e',
          600: '#2d4f8a',
          700: '#1e3a6e',
          800: '#112240',
          900: '#0A1628',
          950: '#060e1a',
        },
        gold: {
          50:  '#fdf9ed',
          100: '#f9f0cc',
          200: '#f5e8a0',
          300: '#efd86d',
          400: '#E4C57A',
          500: '#C9A84C',
          600: '#b08c32',
          700: '#8c6d28',
          800: '#6e5420',
          900: '#4d3b16',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      boxShadow: {
        'gold':    '0 4px 20px rgba(201,168,76,0.3)',
        'gold-lg': '0 8px 40px rgba(201,168,76,0.4)',
        'navy':    '0 4px 20px rgba(10,22,40,0.5)',
      },
      backgroundImage: {
        'gradient-navy': 'linear-gradient(135deg, #0A1628 0%, #1a3a6b 50%, #0d2040 100%)',
        'gradient-gold': 'linear-gradient(135deg, #C9A84C 0%, #B8932E 100%)',
        'gradient-card': 'linear-gradient(135deg, #1a3a6b 0%, #0d2a50 50%, #0A1628 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'pulse-gold': 'pulseGold 2s infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseGold: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(201,168,76,0)' } },
      },
    },
  },
  plugins: [],
}
