import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 20px 80px rgba(15, 23, 42, 0.12)',
      },
      colors: {
        brand: {
          light: '#fff1f2',
          DEFAULT: '#ef4444',
          dark: '#991b1b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
