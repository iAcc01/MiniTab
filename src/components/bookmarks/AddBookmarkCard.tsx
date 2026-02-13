import { Plus } from "lucide-react"

interface AddBookmarkCardProps {
  onClick: () => void
}

export function AddBookmarkCard({ onClick }: AddBookmarkCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-4 rounded-[12px] bg-muted hover:opacity-80 cursor-pointer transition-opacity"
    >
      <div className="w-10 h-10 rounded-xl border border-border-strong flex items-center justify-center flex-shrink-0">
        <Plus size={16} className="text-muted-foreground" />
      </div>
      <span className="text-sm text-placeholder">添加书签</span>
    </button>
  )
}
