import { Sparkles } from "lucide-react"

interface UpdateBadgeProps {
  onClick: () => void
}

export function UpdateBadge({ onClick }: UpdateBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 cursor-pointer transition-colors"
    >
      <Sparkles size={14} strokeWidth={2} />
      <span>新版本</span>
    </button>
  )
}
