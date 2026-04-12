import { useState, useRef, useEffect } from "react"
import { Sun, Moon, ArrowUp, Palette, Check } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"

interface FloatingActionsProps {
  scrollContainerRef?: React.RefObject<HTMLElement | null>
}

export function FloatingActions({ scrollContainerRef }: FloatingActionsProps) {
  const { mode, colorScheme, setMode, setColorScheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // 监听滚动容器，判断是否显示回到顶部按钮
  useEffect(() => {
    const container = scrollContainerRef?.current ?? window
    const handleScroll = () => {
      const scrollTop =
        scrollContainerRef?.current
          ? scrollContainerRef.current.scrollTop
          : window.scrollY
      setShowScrollTop(scrollTop > 100)
    }
    // 初始判断
    handleScroll()
    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [scrollContainerRef])

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
      <div className="relative" ref={panelRef}>
        {open && (
          <div className="absolute bottom-12 right-0 w-52 bg-card border border-border rounded-xl shadow-menu p-3 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* 亮暗模式 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">外观模式</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("light")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    mode === "light"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sun size={14} />
                  浅色
                  {mode === "light" && <Check size={12} />}
                </button>
                <button
                  onClick={() => setMode("dark")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    mode === "dark"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Moon size={14} />
                  深色
                  {mode === "dark" && <Check size={12} />}
                </button>
              </div>
            </div>

            {/* 配色方案 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">配色方案</p>
              <div className="space-y-1.5">
                <button
                  onClick={() => setColorScheme("slate")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    colorScheme === "slate"
                      ? "bg-secondary ring-1 ring-primary/30"
                      : "hover:bg-secondary/60"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full border border-border-strong flex-shrink-0" style={{ background: "linear-gradient(135deg, #F8FAFC 50%, #2563EB 50%)" }} />
                  <span className="flex-1 text-left">冷蓝</span>
                  {colorScheme === "slate" && <Check size={14} className="text-primary" />}
                </button>
                <button
                  onClick={() => setColorScheme("stone")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    colorScheme === "stone"
                      ? "bg-secondary ring-1 ring-primary/30"
                      : "hover:bg-secondary/60"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full border border-border-strong flex-shrink-0" style={{ background: "linear-gradient(135deg, #FCFBF8 50%, #1C1C1C 50%)" }} />
                  <span className="flex-1 text-left">暖石</span>
                  {colorScheme === "stone" && <Check size={14} className="text-primary" />}
                </button>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-full bg-card-hover hover:bg-border-strong flex items-center justify-center cursor-pointer transition-colors shadow-menu"
          title="主题设置"
        >
          <Palette size={18} className="text-foreground" />
        </button>
      </div>
      <button
        onClick={scrollToTop}
        className={`w-10 h-10 rounded-full bg-card-hover hover:bg-border-strong flex items-center justify-center cursor-pointer transition-all shadow-menu ${
          showScrollTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        title="回到顶部"
      >
        <ArrowUp size={18} className="text-foreground" />
      </button>
    </div>
  )
}
