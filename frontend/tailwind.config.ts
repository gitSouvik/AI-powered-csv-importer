import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#F97316',
          hover: '#EA6A0C',
          light: '#FFF1E7',
        },
        ink: '#18181B',
        line: '#E4E4E7',
        surface: '#FFFFFF',
        muted: '#71717A',
        good: '#16A34A',
        bad: '#DC2626',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
