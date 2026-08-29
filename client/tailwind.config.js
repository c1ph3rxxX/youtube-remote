/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#08090d',
        surface: '#111218',
        'surface-elevated': '#161822',
        card: '#1a1c28',
        'card-hover': '#232636',
        border: 'rgba(255, 255, 255, 0.08)',
        'border-highlight': 'rgba(255, 255, 255, 0.18)',
        accent: '#10b981',
        'accent-dim': '#059669',
        'accent-cyan': '#06b6d4',
        'accent-purple': '#8b5cf6',
        'accent-pink': '#ec4899',
        muted: '#64748b',
        text: '#ffffff',
        'text-dim': '#94a3b8',
      },
      boxShadow: {
        glow: '0 0 35px -5px rgba(16, 185, 129, 0.35)',
        'glow-cyan': '0 0 35px -5px rgba(6, 182, 212, 0.35)',
        'glow-purple': '0 0 35px -5px rgba(139, 92, 246, 0.35)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'inner-glow': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'spin-slow': 'spin 22s linear infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'eq-1': 'eq1 0.8s ease-in-out infinite alternate',
        'eq-2': 'eq2 0.5s ease-in-out infinite alternate',
        'eq-3': 'eq3 0.9s ease-in-out infinite alternate',
        'eq-4': 'eq4 0.6s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        eq1: {
          '0%': { height: '3px' },
          '100%': { height: '16px' },
        },
        eq2: {
          '0%': { height: '14px' },
          '100%': { height: '4px' },
        },
        eq3: {
          '0%': { height: '6px' },
          '100%': { height: '18px' },
        },
        eq4: {
          '0%': { height: '16px' },
          '100%': { height: '5px' },
        },
      },
    },
  },
  plugins: [],
};

