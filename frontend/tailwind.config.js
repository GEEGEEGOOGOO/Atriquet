/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'nexus-cream': '#F9F6F0',
        'nexus-beige': '#E5DAC8',
        'nexus-brown': '#A0634D',
        'nexus-brown-light': '#B57B66',
        'nexus-dark': '#3E332B',
        'nexus-text': '#1F1F1F',
        'nexus-gray': '#666666',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Lato"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
