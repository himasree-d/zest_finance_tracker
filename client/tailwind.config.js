/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light stone base
        stone: {
          50:  '#F7F6F2',
          100: '#EEECEA',
          200: '#E2DFD9',
          300: '#C8C4BB',
          400: '#9E9A93',
          500: '#706C65',
          600: '#4A4640',
          800: '#2A2724',
          900: '#1A1815',
        },
        charcoal: {
          900: 'var(--charcoal-900)',
          800: 'var(--charcoal-800)',
          700: 'var(--charcoal-700)',
          600: 'var(--charcoal-600)',
          500: 'var(--charcoal-500)',
          400: 'var(--charcoal-400)',
        },
        slate: {
          50: 'var(--slate-50)',
          100: 'var(--slate-100)',
          200: 'var(--slate-200)',
          300: 'var(--slate-300)',
          400: 'var(--slate-400)',
          500: 'var(--slate-500)',
          600: 'var(--slate-600)',
          700: 'var(--slate-700)',
          800: 'var(--slate-800)',
          900: 'var(--slate-900)',
        },
        // Teal primary accent
        teal: {
          300: '#7EC8BB',
          400: '#4AADA0',
          500: '#2D7D6F',
          600: '#1F5F55',
          700: '#164840',
        },
        // Electric aliases map to teal
        electric: {
          200: '#b2d8d4',
          300: '#7EC8BB',
          400: '#4AADA0',
          500: '#2D7D6F',
          600: '#1F5F55',
        },
        amber: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in':        'fadeIn 0.3s ease-out',
        'slide-up':       'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in':       'scaleIn 0.2s ease-out',
        'spin-slow':      'spin 3s linear infinite',
        'pulse-slow':     'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'bounce-subtle':  'bounceSubtle 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:        { '0%': { opacity: '0' },                              '100%': { opacity: '1' } },
        slideUp:       { '0%': { opacity: '0', transform: 'translateY(20px)'},'100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight:  { '0%': { opacity: '0', transform: 'translateX(20px)'},'100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:       { '0%': { opacity: '0', transform: 'scale(0.95)' },    '100%': { opacity: '1', transform: 'scale(1)' } },
        bounceSubtle:  { '0%,100%': { transform: 'translateY(0)' },           '50%':  { transform: 'translateY(-4px)' } },
      },
      boxShadow: {
        glow:          '0 0 0 3px rgba(45,125,111,0.15)',
        'glow-amber':  '0 0 0 3px rgba(245,158,11,0.15)',
        'glow-emerald':'0 0 0 3px rgba(16,185,129,0.15)',
        card:          '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        modal:         '0 20px 60px rgba(0,0,0,0.14)',
      },
      borderRadius: {
        xl:   '1rem',
        '2xl':'1.25rem',
        '3xl':'1.5rem',
      },
    },
  },
  plugins: [],
};