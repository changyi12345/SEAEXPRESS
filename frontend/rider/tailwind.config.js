/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF69B4',
          dark: '#E91E63',
        },
        secondary: '#2196F3',
        accent: '#4CAF50',
        text: '#333333',
      },
    },
  },
  plugins: [],
}

