import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const STORAGE_KEY = '7d-admin-portal:theme'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const getPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

type ThemeProviderProps = {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(() => getPreferredTheme())
  const [hasExplicitPreference, setHasExplicitPreference] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    const storedTheme = window.localStorage.getItem(STORAGE_KEY)
    return storedTheme === 'light' || storedTheme === 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    const nextTheme = theme === 'dark' ? 'dark' : 'light'

    root.classList.remove(nextTheme === 'dark' ? 'light' : 'dark')
    root.classList.add(nextTheme)
    root.dataset.theme = nextTheme
    if (hasExplicitPreference) {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [theme, hasExplicitPreference])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event: MediaQueryListEvent) => {
      if (hasExplicitPreference) {
        return
      }

      setThemeState(event.matches ? 'dark' : 'light')
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [hasExplicitPreference])

  const setTheme = useCallback((nextTheme: Theme) => {
    setHasExplicitPreference(true)
    setThemeState(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setHasExplicitPreference(true)
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
