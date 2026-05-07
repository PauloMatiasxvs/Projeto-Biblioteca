import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#f4ede0',
          light: '#faf6ec',
          dark: '#e8dfca',
        },
        ink: {
          DEFAULT: '#1c1611',
          soft: '#3d342a',
          mute: '#786a58',
        },
        bordeaux: {
          DEFAULT: '#6b2c2c',
          deep: '#4a1d1d',
          light: '#8d4242',
        },
        gold: {
          DEFAULT: '#c9a961',
          deep: '#a08440',
        },
        moss: '#3d4f3d',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        wider: '0.2em',
        widest: '0.35em',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.3, 1) both',
        'fade-in': 'fadeIn 0.4s ease both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
