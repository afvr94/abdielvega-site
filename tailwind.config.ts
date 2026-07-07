import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: 'rgb(var(--cream) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        hairline: 'rgb(var(--hairline) / 0.13)',
        income: 'rgb(var(--income) / <alpha-value>)',
        expense: 'rgb(var(--expense) / <alpha-value>)',
        savings: 'rgb(var(--savings) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
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
