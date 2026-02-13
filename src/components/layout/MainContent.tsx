import { ReactNode, forwardRef } from "react"
import { useSidebar } from "@/contexts/SidebarContext"
import { cn } from "@/lib/utils"

interface MainContentProps {
  children: ReactNode
}

export const MainContent = forwardRef<HTMLElement, MainContentProps>(function MainContent({ children }, ref) {
  const { isCollapsed } = useSidebar()

  return (
    <main
      ref={ref}
      className={cn(
        "flex-1 bg-background rounded-xl border border-border overflow-y-auto transition-all duration-300 mt-3 mr-3 mb-3 ml-0",
        isCollapsed ? "ml-3" : "ml-0"
      )}
    >
      <div className="pt-3 px-6 pb-6 max-w-[1600px] mx-auto">{children}</div>
    </main>
  )
})
