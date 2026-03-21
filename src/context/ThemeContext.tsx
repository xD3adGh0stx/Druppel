import { createContext, useContext, useEffect, useState } from 'react'
import { StatusBar, Style } from '@capacitor/status-bar'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  isFirstLaunch: boolean
  dismissWelcome: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const THEME_KEY = 'druppel_theme'
const WELCOMED_KEY = 'druppel_welcomed'

async function applyStatusBar(theme: Theme) {
  try {
    await StatusBar.setOverlaysWebView({ overlay: false })
    if (theme === 'dark') {
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#0f172a' })
    } else {
      await StatusBar.setStyle({ style: Style.Light })
      await StatusBar.setBackgroundColor({ color: '#f8fafc' })
    }
  } catch {
    // Not on native platform (web/desktop), ignore
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem(THEME_KEY) as Theme) ?? 'light'
  })
  const [isFirstLaunch, setIsFirstLaunch] = useState(() => {
    return !localStorage.getItem(WELCOMED_KEY)
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    applyStatusBar(theme)
  }, [theme])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem(THEME_KEY, t)
  }

  function dismissWelcome() {
    setIsFirstLaunch(false)
    localStorage.setItem(WELCOMED_KEY, '1')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isFirstLaunch, dismissWelcome }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
