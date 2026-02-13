import { useRef, useEffect, useState, RefObject } from "react"

interface GroupMenuProps {
  onClose: () => void
  onCreateGroup: () => void
  onImportBookmarks: () => void
  anchorRef: RefObject<HTMLElement | null>
}

export function GroupMenu({ onClose, onCreateGroup, onImportBookmarks, anchorRef }: GroupMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({
        top: rect.top,
        left: rect.right + 6,
      })
    }
  }, [anchorRef])

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
      className="fixed w-[84px] h-[78px] bg-background rounded-[6px] shadow-menu z-50"
      style={{
        top: pos.top,
        left: pos.left,
        outline: "1px solid var(--border)",
        outlineOffset: "-1px",
      }}
    >
      <button
        className="flex items-center w-[72px] h-8 px-2 text-sm text-foreground hover:bg-border rounded-[4px] cursor-pointer transition-colors"
        style={{ margin: "6px 6px 0 6px" }}
        onClick={() => {
          onCreateGroup()
          onClose()
        }}
      >
        新建分组
      </button>
      <button
        className="flex items-center w-[72px] h-8 px-2 text-sm text-foreground hover:bg-border rounded-[4px] cursor-pointer transition-colors"
        style={{ margin: "2px 6px 0 6px" }}
        onClick={() => {
          onImportBookmarks()
          onClose()
        }}
      >
        导入书签
      </button>
    </div>
  )
}
