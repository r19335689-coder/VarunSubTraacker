/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pastel-blue': {
          DEFAULT: '#7DD3FC',
          light: '#93C5FD',
          dark: '#60A5FA',
        },
        'pastel-orange': {
          DEFAULT: '#FB923C',
          light: '#FDBA74',
          dark: '#F97316',
        },
        'pastel-red': {
          DEFAULT: '#FCA5A5',
          light: '#FECACA',
          dark: '#F87171',
        },
      },
    },
  },
  plugins: [],
}

