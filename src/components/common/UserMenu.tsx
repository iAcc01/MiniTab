import { useRef, useEffect } from "react"
import { User, LogOut } from "lucide-react"

interface UserMenuProps {
  onClose: () => void
  onSignOut: () => void
}

export function UserMenu({ onClose, onSignOut }: UserMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute bottom-12 left-0 w-[196px] h-[78px] bg-background rounded-[6px] shadow-menu z-50"
      style={{
        outline: "1px solid var(--border)",
        outlineOffset: "-1px",
      }}
    >
      <button
        className="flex items-center gap-2 w-[184px] h-8 px-2 text-sm text-foreground hover:bg-border rounded-[4px] cursor-pointer transition-colors"
        style={{ margin: "6px 6px 0 6px" }}
        onClick={onClose}
      >
        <User size={16} />
        个人中心
      </button>
      <button
        className="flex items-center gap-2 w-[184px] h-8 px-2 text-sm text-foreground hover:bg-border rounded-[4px] cursor-pointer transition-colors"
        style={{ margin: "2px 6px 0 6px" }}
        onClick={() => {
          onSignOut()
          onClose()
        }}
      >
        <LogOut size={16} />
        退出
      </button>
    </div>
  )
}
