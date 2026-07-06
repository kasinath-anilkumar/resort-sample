/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        water: {
          light: '#e6f4f1',
          DEFAULT: '#cfe8e3',
          dark: '#9dcac1',
        },
        lagoon: {
          light: '#e6f4f1',
          DEFAULT: '#cfe8e3',
          dark: '#9dcac1',
        },
        sand: {
          light: '#fdfaf6',
          DEFAULT: '#f5efe6',
          dark: '#e6dccf',
        },
        mint: {
          light: '#f0fdf4',
          DEFAULT: '#dcfce7',
          dark: '#bbf7d0',
        },
        blush: {
          light: '#fdf2f2',
          DEFAULT: '#f8e4e4',
          dark: '#eacaca',
        },
        sky: {
          light: '#f0f7ff',
          DEFAULT: '#e0efff',
          dark: '#c7dbf7',
        },
        beige: {
          light: '#fdfaf6',
          DEFAULT: '#f3ede4',
          dark: '#e7dccd',
        },
        gold: {
          light: '#e7d3a3',
          DEFAULT: '#c6a76d',
          dark: '#a3874f',
        },
        charcoal: {
          light: '#475569',
          DEFAULT: '#1e293b',
          dark: '#0f172a',
        },
        teal: {
          light: '#e6fffb',
          DEFAULT: '#b2f5ea',
          dark: '#81e6d9',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
