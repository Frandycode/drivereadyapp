/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Backgrounds ────────────────────────────────────────────────────
        bg: '#0A0F0D',
        surface: {
          DEFAULT: '#111A14',
          2: '#1A2B1F',
          3: '#243D29',
        },
        border: {
          DEFAULT: '#243D29',
          subtle: '#1A2B1F',
        },

        // ── Oklahoma Green ─────────────────────────────────────────────────
        green: {
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },

        // ── Prairie Gold ───────────────────────────────────────────────────
        gold: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },

        // ── Bronze / Silver (difficulty tiers) ────────────────────────────
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

        // ── Semantic ───────────────────────────────────────────────────────
        correct: '#22C55E',
        wrong: '#EF4444',
        hint: '#818CF8',
        info: '#38BDF8',
        growth: '#F97316',

        // ── Text ──────────────────────────────────────────────────────────
        text: {
          primary: '#F0FDF4',
          secondary: '#86EFAC',
          inverse: '#14532D',
        },
      },

      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['DM Sans', 'sans-serif'],   // override default
      },

      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },

      animation: {
        'correct-pulse': 'correctPulse 0.3s ease-out',
        'wrong-shake': 'wrongShake 0.4s ease-out',
        'timer-pulse': 'timerPulse 1s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },

      keyframes: {
        correctPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
        wrongShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        timerPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },

      maxWidth: {
        content: '768px',
        dashboard: '1280px',
      },
    },
  },
  plugins: [],
}
