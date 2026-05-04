/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ow: {
          orange: '#F99E1A',
          blue: '#4FC1E9',
          dark: '#0D1117',
          panel: '#161B22',
          border: '#21262D',
          hover: '#1C2128',
          accent: '#F99E1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
