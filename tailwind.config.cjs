const { heroui } = require('@heroui/react');
const tokens = require('./src/theme/tokens.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [
    heroui({
      defaultTheme: 'light',
      themes: {
        light: {
          colors: {
            background: tokens.background,
            foreground: tokens.foreground,
            divider: tokens.border,
            primary: { DEFAULT: tokens.primary, foreground: tokens.primaryForeground },
            secondary: { DEFAULT: tokens.accent, foreground: tokens.accentForeground },
            focus: tokens.primary,
          },
        },
      },
    }),
  ],
};
