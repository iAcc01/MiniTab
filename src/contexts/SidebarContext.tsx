import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, MutableRefObject } from "react"

const COLLAPSE_BREAKPOINT = 1280

interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  activeNav: string
  setActiveNav: (v: string) => void
  activeGroupId: string | null
  setActiveGroupId: (v: string | null) => void
  scrollToGroupRef: MutableRefObject<((groupId: string) => void) | null>
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(() => window.innerWidth < COLLAPSE_BREAKPOINT)
  const [activeNav, setActiveNav] = useState("bookmarks")
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const scrollToGroupRef = useRef<((groupId: string) => void) | null>(null)

  // 监听窗口宽度变化，小于 1280px 时自动收起
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < COLLAPSE_BREAKPOINT) {
        setIsCollapsed(true)
      } else {
        setIsCollapsed(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSidebar = useCallback(() => setIsCollapsed((prev) => !prev), [])

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleSidebar,
        activeNav,
        setActiveNav,
        activeGroupId,
        setActiveGroupId,
        scrollToGroupRef,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error("useSidebar must be used within SidebarProvider")
  return context
}
