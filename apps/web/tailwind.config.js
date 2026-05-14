/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Backgrounds (navy tricolor, dark theme) ────────────────────────
        bg: '#010E33',          // navy-deep
        surface: {
          DEFAULT: '#021A54',   // navy
          2: '#071E5C',         // navy-card
          3: '#0C2470',         // navy-lift
          bgDark:    '#0E1130',
          bgLight:   '#F5F0E6',
          cardDark:  '#0A1740',
          cardLight: '#FFFFFF',
          borderDark:  'rgba(245,240,230,0.08)',
          borderLight: 'rgba(2,26,84,0.10)',
        },
        // ─ Vintage slab palette — used for large fills (Principle 7) ─
        variant: {
          ember:    '#C75A3A',
          solar:    '#D9B342',
          cobalt:   '#3A5582',
          cobaltLt: '#1E2D5C',
          red:      '#963024',
          chalk:    '#F5F0E6',
          onyx:     '#2A2520',
          green:    '#5E7245',
          black:    '#1A1612',
          flPink:   '#DC5A8E',
          brown:    '#7A5E3F',
          stripeMid:'#021A54',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.08)',  // navy-rim
          subtle: 'rgba(255,255,255,0.04)',
          strong: 'rgba(255,255,255,0.13)',   // navy-rim2
        },

        // ── Brand: Navy ─────────────────────────────────────────────────────
        navy: {
          DEFAULT: '#021A54',
          deep:    '#010E33',
          card:    '#071E5C',
          lift:    '#0C2470',
        },

        // ── Brand: Orange (primary action) ─────────────────────────────────
        orange: {
          DEFAULT: '#F45B26',
          400:     '#FA7B4D',
          500:     '#F45B26',
          600:     '#e04d1c',
          deep:    '#e04d1c',
          soft:    'rgba(244,91,38,0.15)',
          glow:    'rgba(244,91,38,0.08)',
        },

        // ── Brand: Yellow (highlight / secondary) ──────────────────────────
        yellow: {
          DEFAULT: '#F8DE22',
          400:     '#FFE85A',
          500:     '#F8DE22',
          600:     '#D9C200',
          soft:    'rgba(248,222,34,0.12)',
          rim:     'rgba(248,222,34,0.22)',
        },

        // ── Semantic (kept distinct from brand) ────────────────────────────
        green: {
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
        gold: {
          400: '#FBBF24',
          500: '#F8DE22',   // alias to yellow for the streak chip
          600: '#D9C200',
        },
        bronze: {
          400: '#D4956A',
          500: '#CD7F32',
          600: '#B8691C',
        },
        silver: {
          400: '#D1D5DB',
          500: '#9CA3AF',
          600: '#6B7280',
        },

        correct: '#22C55E',
        wrong:   '#EF4444',
        hint:    '#818CF8',
        info:    '#38BDF8',
        growth:  '#F45B26',

        // ── Text (white-on-navy default) ───────────────────────────────────
        text: {
          primary:   'rgba(255,255,255,0.95)',
          secondary: 'rgba(255,255,255,0.55)',
          muted:     'rgba(255,255,255,0.32)',
          faint:     'rgba(255,255,255,0.18)',
          inverse:   '#021A54',
        },
      },

      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        sans:    ['DM Sans', 'sans-serif'],
      },

      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },

      animation: {
        'correct-pulse': 'correctPulse 0.3s ease-out',
        'wrong-shake':   'wrongShake 0.4s ease-out',
        'timer-pulse':   'timerPulse 1s ease-in-out infinite',
        'fade-in':       'fadeIn 0.2s ease-out',
        'fade-up':       'fadeUp 0.5s ease both',
        'slide-up':      'slideUp 0.3s ease-out',
        'pulse-soft':    'pulse 2s infinite',
        'float':         'float 3s ease-in-out infinite',
        'shimmer':       'shimmer 2.4s linear infinite',
        'marquee':       'scrollMarquee 38s linear infinite',
        'onyx-gloss':    'onyxGloss 16s ease-in-out infinite',
      },

      keyframes: {
        correctPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.04)' },
        },
        wrongShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-8px)' },
          '40%':      { transform: 'translateX(8px)' },
          '60%':      { transform: 'translateX(-4px)' },
          '80%':      { transform: 'translateX(4px)' },
        },
        timerPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.05)' },
        },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.35' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        scrollMarquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        onyxGloss: {
          '0%, 100%': { opacity: '0.25' },
          '50%':      { opacity: '0.35' },
        },
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },

      maxWidth: {
        content:   '768px',
        dashboard: '1280px',
      },

      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #F8DE22 0%, #021A54 50%, #F45B26 100%)',
        'orange-yellow':  'linear-gradient(135deg, #F45B26 0%, #F8DE22 100%)',
        'variant-sunrise':   'linear-gradient(135deg, #C75A3A 0%, #D9B342 100%)',
        'variant-emberfall': 'linear-gradient(135deg, #C75A3A 0%, #2A2520 100%)',
        'onyx-gloss':        'radial-gradient(ellipse at 75% 20%, rgba(58,58,74,0.35) 0%, rgba(42,37,32,0) 60%)',
      },
    },
  },
  plugins: [],
}
