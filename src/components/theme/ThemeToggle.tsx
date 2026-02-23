import { type ComponentPropsWithoutRef } from 'react'
import { useTheme } from './ThemeProvider'

type ThemeToggleProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'floating' | 'inline'
}

const iconStyles = 'h-5 w-5 transition-transform duration-300'

const ThemeToggle = ({ variant = 'floating', className = '', ...props }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const baseClasses =
    variant === 'floating'
      ? 'fixed bottom-6 right-6 z-50'
      : ''

  return (
    <button
      type="button"
      aria-label="Toggle color theme"
      onClick={toggleTheme}
      className={`${baseClasses} inline-flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-surface text-text-primary shadow-glow transition hover:-translate-y-0.5 hover:border-accent/60 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${className}`}
      {...props}
    >
      <span className="sr-only">Switch between light and dark theme</span>
      <span className="relative flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className={`${iconStyles} ${isDark ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m2.93-7.07 1.41 1.41m11.31 11.32 1.41 1.41m0-14.14-1.41 1.41M6.34 17.66l-1.41 1.41" />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className={`${iconStyles} absolute ${isDark ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
          />
        </svg>
      </span>
    </button>
  )
}

export default ThemeToggle
