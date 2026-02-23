import defaultTheme from 'tailwindcss/defaultTheme'

const withOpacity = (variable) => {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) {
      return `rgb(var(${variable}))`
    }
    return `rgb(var(${variable}) / ${opacityValue})`
  }
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: withOpacity('--color-background'),
        surface: withOpacity('--color-surface'),
        'surface-muted': withOpacity('--color-surface-muted'),
        border: withOpacity('--color-border'),
        accent: {
          DEFAULT: withOpacity('--color-accent'),
          foreground: withOpacity('--color-accent-foreground'),
        },
        success: withOpacity('--color-success'),
        warning: withOpacity('--color-warning'),
        danger: withOpacity('--color-danger'),
        // Alias "error" to the same token so
        // utilities like border-error / ring-error work.
        error: withOpacity('--color-danger'),
        text: {
          primary: withOpacity('--color-text-primary'),
          secondary: withOpacity('--color-text-secondary'),
          muted: withOpacity('--color-text-muted'),
        },
      },
      fontFamily: {
        sans: ['"Inter"', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        glow: '0 25px 50px -12px rgba(99, 102, 241, 0.35)',
      },
      backgroundImage: {
        'surface-glow': 'var(--surface-glow)',
      },
    },
  },
  plugins: [],
}
