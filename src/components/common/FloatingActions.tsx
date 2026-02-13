import { Sun, Moon, ArrowUp } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"

interface FloatingActionsProps {
  scrollContainerRef?: React.RefObject<HTMLElement | null>
}

export function FloatingActions({ scrollContainerRef }: FloatingActionsProps) {
  const { theme, toggleTheme } = useTheme()

  const scrollToTop = () => {
    const container = scrollContainerRef?.current
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-40">
      <button
        onClick={toggleTheme}
        className="w-10 h-10 rounded-full bg-card-hover hover:bg-border-strong flex items-center justify-center cursor-pointer transition-colors shadow-menu"
        title={theme === "light" ? "切换暗色模式" : "切换亮色模式"}
      >
        {theme === "light" ? (
          <Moon size={18} className="text-foreground" />
        ) : (
          <Sun size={18} className="text-foreground" />
        )}
      </button>
      <button
        onClick={scrollToTop}
        className="w-10 h-10 rounded-full bg-card-hover hover:bg-border-strong flex items-center justify-center cursor-pointer transition-colors shadow-menu"
        title="回到顶部"
      >
        <ArrowUp size={18} className="text-foreground" />
      </button>
    </div>
  )
}
