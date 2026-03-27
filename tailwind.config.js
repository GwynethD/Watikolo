/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f7f8',
          100: '#e2ecef',
          200: '#c5d9df',
          300: '#9bbfc9',
          400: '#6d9cad',
          500: '#4f8197',
          600: '#3d677d',
          700: '#345466',
          800: '#2f4755',
          900: '#2b3d48',
        },
        gold: {
          50: '#fbf8ef',
          100: '#f4ecd2',
          200: '#ead7a4',
          300: '#dfbb6d',
          400: '#d3a044',
          500: '#c68930',
          600: '#a96c28',
          700: '#875122',
          800: '#704221',
          900: '#603820',
        },
        surface: '#f7f7f5',
        ink: '#13212d',
      },
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
        display: ['Open Sans', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 45px rgba(19, 33, 45, 0.08)',
        card: '0 10px 25px rgba(19, 33, 45, 0.08)',
      },
      backgroundImage: {
        hero: 'radial-gradient(circle at top left, rgba(198, 137, 48, 0.16), transparent 35%), linear-gradient(135deg, #13212d 0%, #233646 45%, #36586b 100%)',
      },
    },
  },
  plugins: [],
};
