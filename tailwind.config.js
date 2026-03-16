/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '420px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        background: '#000000',
        surface: '#1c1c1e',
        surfaceHover: '#2c2c2e',
        border: 'rgba(255,255,255,0.08)',
        textPrimary: '#f5f5f7',
        textSecondary: '#86868b',
        accentTeal: '#63e6be',
        accentBlue: '#0a84ff',
        accentEmerald: '#30d158',
        accentAmber: '#ff9f0a',
        accentRose: '#ff453a',
        accentPurple: '#bf5af2',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 2px 20px rgba(0, 0, 0, 0.4)',
        card: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
        glow: '0 0 20px rgba(99,230,190,0.08)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      }
    },
  },
  plugins: [],
}
