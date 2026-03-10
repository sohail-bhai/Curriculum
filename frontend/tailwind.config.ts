import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        navy: {
          50:  '#f0f4fa',
          100: '#dce6f4',
          200: '#b8cde9',
          300: '#85a8d5',
          400: '#4f7cba',
          500: '#2d5fa0',
          600: '#1e4785',
          700: '#163569',
          800: '#0f2240',
          900: '#091628',
        },
      },
      boxShadow: {
        card:  '0 1px 3px rgba(15,34,64,.06), 0 4px 16px -2px rgba(15,34,64,.08)',
        hover: '0 4px 24px -4px rgba(15,34,64,.16)',
        panel: '0 0 0 1px rgba(15,34,64,.06), 0 8px 32px -4px rgba(15,34,64,.12)',
      },
      keyframes: {
        fadeUp:   { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: '0' },                               to: { opacity: '1' } },
        slideIn:  { from: { opacity: '0', transform: 'translateX(-6px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        shimmer:  { from: { backgroundPosition: '-200% 0' },              to: { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-up':  'fadeUp .3s cubic-bezier(.16,1,.3,1)',
        'fade-in':  'fadeIn .2s ease-out',
        'slide-in': 'slideIn .25s cubic-bezier(.16,1,.3,1)',
        shimmer:    'shimmer 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
