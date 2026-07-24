/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf3',
          100: '#d1fae5',
          400: '#34d399',
          500: '#16a34a',
          600: '#059669',
          700: '#047857',
          DEFAULT: '#16a34a',
          dark: '#059669',
          light: '#86efac',
          bg: '#ecfdf3',
        },
        ink: {
          900: '#0f1f18',
          700: '#1f3a2e',
          500: '#4b5563',
          400: '#6b7280',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,40,28,.04), 0 8px 24px -12px rgba(16,40,28,.12)',
        pop: '0 12px 40px -12px rgba(16,163,74,.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .45s cubic-bezier(.22,1,.36,1) both',
        'pop-in': 'pop-in .3s cubic-bezier(.22,1,.36,1) both',
      },
    },
  },
  plugins: [],
}
