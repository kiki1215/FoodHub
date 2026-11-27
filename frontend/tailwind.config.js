/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F47721',
          orangeHover: '#E06510',
          cream: '#FFF8F0',
          peach: '#F4E5D7',
          charcoal: '#262626',
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -5px rgba(38, 38, 38, 0.08)',
        soft: '0 4px 16px rgba(244, 119, 33, 0.08)',
      },
    },
  },
  plugins: [],
};
