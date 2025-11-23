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
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Brand colors
        brand: {
          primary: '#9333ea', // purple-600
          'primary-hover': '#a855f7', // purple-500
          accent: '#ec4899', // pink-500
        },
        // Surface colors
        surface: {
          DEFAULT: '#18181b', // zinc-900
          elevated: '#27272a', // zinc-800
          border: '#3f3f46', // zinc-700
        },
        // Text colors
        content: {
          primary: '#ffffff',
          secondary: '#a1a1aa', // zinc-400
          muted: '#71717a', // zinc-500
        },
        // Status colors
        status: {
          error: '#f87171', // red-400
          'error-bg': 'rgb(127 29 29 / 0.2)', // red-900/20
          'error-border': '#991b1b', // red-800
          success: '#4ade80', // green-400
          'success-bg': 'rgb(20 83 45 / 0.4)', // green-900/40
        },
      },
      borderRadius: {
        DEFAULT: '0.75rem', // 12px - consistent rounded-xl
      },
      boxShadow: {
        card: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
        'card-hover': '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
