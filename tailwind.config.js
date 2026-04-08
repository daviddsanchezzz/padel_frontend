/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg:      '#0b1d12',
          hover:   '#132a1a',
          active:  '#1a4028',
          border:  '#1c3325',
          text:    '#8aab95',
          textDim: '#4a6b57',
          label:   '#3d5a47',
        },
        brand: {
          50:  '#edfaf3',
          100: '#d4f3e3',
          200: '#ace6c9',
          300: '#76d2a9',
          400: '#3eb885',
          500: '#1e9e6a',
          600: '#158055',
          700: '#116644',
          800: '#0f5238',
          900: '#0c3f2c',
        },
      },
    },
  },
  plugins: [],
};
