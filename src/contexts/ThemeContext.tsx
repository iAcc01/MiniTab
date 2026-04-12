import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type Mode = "light" | "dark"
type ColorScheme = "slate" | "stone"

interface ThemeContextType {
  mode: Mode
  colorScheme: ColorScheme
  setMode: (mode: Mode) => void
  setColorScheme: (scheme: ColorScheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem("minitab_theme")
    return (saved as Mode) || "light"
  })

  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem("minitab_color_scheme")
    return (saved as ColorScheme) || "slate"
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", mode === "dark")
    localStorage.setItem("minitab_theme", mode)
  }, [mode])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("theme-stone", colorScheme === "stone")
    localStorage.setItem("minitab_color_scheme", colorScheme)
  }, [colorScheme])

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colorScheme,
        setMode,
        setColorScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}
