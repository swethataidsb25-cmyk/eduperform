/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        positive: 'var(--positive)',
        negative: 'var(--negative)',
        warning: 'var(--warning)',
        info: 'var(--info)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'calc(var(--radius) - 0.375rem)',
        md: 'var(--radius)',
        lg: 'calc(var(--radius) + 0.125rem)',
        xl: 'calc(var(--radius) + 0.375rem)',
        '2xl': 'calc(var(--radius) + 0.75rem)',
        '3xl': 'calc(var(--radius) + 1.25rem)',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'card-hover': '0 8px 24px rgba(67, 56, 202, 0.10), 0 2px 6px rgba(0,0,0,0.04)',
        modal: '0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        sidebar: '1px 0 0 0 #E5E7EB',
        'kpi': '0 4px 16px rgba(67, 56, 202, 0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'input-focus': '0 0 0 3px rgba(67, 56, 202, 0.12)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};