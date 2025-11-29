/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mystical Faction - Mistyczny Indygo (Ancient Conflict palette)
        mystical: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Primary mystical
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Human Faction - Wojenny Karmazyn (Ancient Conflict palette)
        human: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c', // Primary human
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Ancient Gold - Antyczne Złoto (Primary accent)
        ancient: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207', // Primary ancient
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        // Imperial Violet - Imperialny Fiolet (Secondary magic)
        imperial: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        // Game UI colors (Ancient Conflict theme)
        game: {
          dark: '#0a0a0a', // Starożytna czerń
          darker: '#050505',
          card: '#111111',
          border: '#1f1f1f',
          accent: '#a16207', // Ancient gold accent
          health: '#22c55e',
          mana: '#3b82f6',
          experience: '#a855f7',
          gold: '#eab308',
        },
        // Wyblakłe srebro - Starożytne elementy
        silver: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8', // Primary silver
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Miedziany brąz - Detale metalik
        copper: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#bfa094',
          600: '#a18072',
          700: '#92400e', // Primary copper
          800: '#7c2d12',
          900: '#6c2d0e',
          950: '#3b1106',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'hero-pattern': 'radial-gradient(ellipse at center, rgba(161,98,7,0.15) 0%, transparent 70%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glow-mystical': 'radial-gradient(circle, rgba(79,70,229,0.4) 0%, transparent 70%)',
        'glow-human': 'radial-gradient(circle, rgba(185,28,28,0.4) 0%, transparent 70%)',
        'glow-ancient': 'radial-gradient(circle, rgba(161,98,7,0.4) 0%, transparent 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-drift': 'floatDrift 20s ease-in-out infinite',
        'blob': 'blob 15s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-ancient': 'glowAncient 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        floatDrift: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '0.3' },
          '25%': { transform: 'translate(10px, -20px) rotate(5deg)', opacity: '0.6' },
          '50%': { transform: 'translate(-5px, -40px) rotate(-3deg)', opacity: '0.4' },
          '75%': { transform: 'translate(15px, -20px) rotate(8deg)', opacity: '0.7' },
          '100%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '0.3' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(20px, -30px) scale(1.1)' },
          '50%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '75%': { transform: 'translate(30px, 10px) scale(1.05)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(79,70,229,0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(79,70,229,0.8)' },
        },
        glowAncient: {
          '0%': { boxShadow: '0 0 20px rgba(161,98,7,0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(161,98,7,0.8)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
