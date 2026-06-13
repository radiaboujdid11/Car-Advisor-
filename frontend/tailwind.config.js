/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark:      '#0A0B0F',
        dark2:     '#12141A',
        dark3:     '#1C1F28',
        gold:      '#E8B84B',
        gold2:     '#F5D17A',
        accent:    '#4FC3F7',
        muted:     '#8A8FA8',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['Space Mono', 'monospace'],
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-out',
        'fade-up':  'fadeUp 0.5s ease-out',
        'pulse-dot': 'pulse-dot 1.5s infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeUp:  { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'none' } },
        'pulse-dot': { '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: '.4', transform: 'scale(.7)' } },
      }
    }
  },
  plugins: []
};
