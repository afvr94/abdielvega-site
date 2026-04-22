import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F5EFE4',
        ink: '#1A1815',
        muted: '#8A8178',
        hairline: '#1A181522',
        income: '#4A6741',
        expense: '#B54228',
        savings: '#2E5266',
        warn: '#C17A1F',
        card: '#FFFFFF',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-instrument)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        'tightest-2': '-0.02em',
        'tightest-3': '-0.03em',
      },
      borderRadius: {
        card: '14px',
      },
      keyframes: {
        fadein: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadein: 'fadein 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
